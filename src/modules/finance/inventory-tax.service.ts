import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateCloseItemDto,
  CreateInventoryDto,
  CreateTaxLineDto,
  RemitTaxDto,
  UpdateCloseItemDto,
  UpdateSetupDto,
  UpdateTaxLineDto,
} from './dto/ops.dto';
import { money, qty, rethrowUnique } from './money';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(approvalStatus?: string, itemCode?: string) {
    const rows = await this.prisma.finInventoryMovement.findMany({
      where: {
        approvalStatus: approvalStatus || undefined,
        itemCode: itemCode || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { items: rows.map((row) => this.map(row)) };
  }

  async create(dto: CreateInventoryDto) {
    const quantity = qty(dto.quantity);
    if (quantity === 0) {
      throw new BadRequestException('Quantity cannot be zero');
    }
    const unitCost = money(dto.unitCost ?? 0);
    const amount =
      dto.amount === undefined ? money(Math.abs(quantity) * unitCost) : money(dto.amount);
    const row = await this.prisma.finInventoryMovement.create({
      data: {
        itemCode: dto.itemCode.trim(),
        itemName: dto.itemName.trim(),
        location: dto.location,
        type: dto.type,
        quantity,
        unitCost,
        amount,
        approvalStatus: 'pending',
      },
    });
    return this.map(row);
  }

  async decide(id: string, approvalStatus: 'approved' | 'rejected') {
    const row = await this.prisma.finInventoryMovement.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Inventory movement not found');
    if (row.approvalStatus !== 'pending') {
      throw new BadRequestException(
        `Cannot decide from status ${row.approvalStatus}`,
      );
    }
    const updated = await this.prisma.finInventoryMovement.update({
      where: { id },
      data: { approvalStatus },
    });
    return this.map(updated);
  }

  private map(row: {
    id: string;
    itemCode: string;
    itemName: string;
    location: string | null;
    type: string;
    quantity: Prisma.Decimal | number;
    unitCost: Prisma.Decimal | number;
    amount: Prisma.Decimal | number;
    approvalStatus: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      itemCode: row.itemCode,
      itemName: row.itemName,
      location: row.location,
      type: row.type,
      quantity: qty(row.quantity),
      unitCost: money(row.unitCost),
      amount: money(row.amount),
      approvalStatus: row.approvalStatus,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  async list(period?: string, kind?: string) {
    const rows = await this.prisma.finTaxScheduleLine.findMany({
      where: {
        period: period || undefined,
        kind: kind || undefined,
      },
      orderBy: [{ period: 'desc' }, { kind: 'asc' }],
      take: 200,
    });
    return { items: rows.map((row) => this.map(row)) };
  }

  async create(dto: CreateTaxLineDto) {
    const amount = money(dto.amount);
    const row = await this.prisma.finTaxScheduleLine.create({
      data: {
        kind: dto.kind,
        period: dto.period,
        base: money(dto.base ?? 0),
        amount,
        outstanding: money(dto.outstanding ?? amount),
        ref: dto.ref,
      },
    });
    return this.map(row);
  }

  async update(id: string, dto: UpdateTaxLineDto) {
    await this.require(id);
    const row = await this.prisma.finTaxScheduleLine.update({
      where: { id },
      data: {
        base: dto.base === undefined ? undefined : money(dto.base),
        amount: dto.amount === undefined ? undefined : money(dto.amount),
        outstanding:
          dto.outstanding === undefined ? undefined : money(dto.outstanding),
        ref: dto.ref,
      },
    });
    return this.map(row);
  }

  async remit(id: string, dto: RemitTaxDto) {
    const row = await this.require(id);
    const next = money(money(row.outstanding) - money(dto.amount));
    if (next < -0.001) {
      throw new BadRequestException('Remittance exceeds outstanding tax');
    }
    const updated = await this.prisma.finTaxScheduleLine.update({
      where: { id },
      data: { outstanding: Math.max(0, next) },
    });
    return this.map(updated);
  }

  private async require(id: string) {
    const row = await this.prisma.finTaxScheduleLine.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Tax line not found');
    return row;
  }

  private map(row: {
    id: string;
    kind: string;
    period: string;
    base: Prisma.Decimal | number;
    amount: Prisma.Decimal | number;
    outstanding: Prisma.Decimal | number;
    ref: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      kind: row.kind,
      period: row.period,
      base: money(row.base),
      amount: money(row.amount),
      outstanding: money(row.outstanding),
      ref: row.ref,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class FinanceSetupService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetup() {
    const row = await this.prisma.finSetupConfig.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });
    return this.mapSetup(row);
  }

  async updateSetup(dto: UpdateSetupDto) {
    const row = await this.prisma.finSetupConfig.upsert({
      where: { id: 'default' },
      update: {
        entityName: dto.entityName,
        defaultBranchId: dto.defaultBranchId,
        arAccountantId: dto.arAccountantId,
        financeManagerId: dto.financeManagerId,
        vatRatePct: dto.vatRatePct === undefined ? undefined : money(dto.vatRatePct),
        salaryTaxEnabled: dto.salaryTaxEnabled,
        reportMode: dto.reportMode,
      },
      create: {
        id: 'default',
        entityName: dto.entityName ?? 'PSC',
        defaultBranchId: dto.defaultBranchId,
        arAccountantId: dto.arAccountantId,
        financeManagerId: dto.financeManagerId,
        vatRatePct: money(dto.vatRatePct ?? 10),
        salaryTaxEnabled: dto.salaryTaxEnabled ?? true,
        reportMode: dto.reportMode ?? 'provisional',
      },
    });
    return this.mapSetup(row);
  }

  async listChecklist(period?: string) {
    const rows = await this.prisma.finCloseChecklist.findMany({
      where: period ? { period } : undefined,
      orderBy: [{ period: 'desc' }, { itemKey: 'asc' }],
    });
    return { items: rows.map((row) => this.mapItem(row)) };
  }

  async createChecklistItem(dto: CreateCloseItemDto) {
    try {
      const row = await this.prisma.finCloseChecklist.create({
        data: {
          period: dto.period,
          itemKey: dto.itemKey.trim(),
          label: dto.label.trim(),
          owner: dto.owner,
          done: dto.done ?? false,
          due: dto.due,
        },
      });
      return this.mapItem(row);
    } catch (error) {
      rethrowUnique(error, 'Checklist item already exists for this period');
    }
  }

  async updateChecklistItem(id: string, dto: UpdateCloseItemDto) {
    const existing = await this.prisma.finCloseChecklist.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Checklist item not found');
    const row = await this.prisma.finCloseChecklist.update({
      where: { id },
      data: {
        label: dto.label?.trim(),
        owner: dto.owner,
        done: dto.done,
        due: dto.due,
      },
    });
    return this.mapItem(row);
  }

  private mapSetup(row: {
    id: string;
    entityName: string;
    defaultBranchId: string | null;
    arAccountantId: string | null;
    financeManagerId: string | null;
    vatRatePct: Prisma.Decimal | number;
    salaryTaxEnabled: boolean;
    reportMode: string;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      entityName: row.entityName,
      defaultBranchId: row.defaultBranchId,
      arAccountantId: row.arAccountantId,
      financeManagerId: row.financeManagerId,
      vatRatePct: money(row.vatRatePct),
      salaryTaxEnabled: row.salaryTaxEnabled,
      reportMode: row.reportMode,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapItem(row: {
    id: string;
    period: string;
    itemKey: string;
    label: string;
    owner: string | null;
    done: boolean;
    due: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      period: row.period,
      itemKey: row.itemKey,
      label: row.label,
      owner: row.owner,
      done: row.done,
      due: row.due,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
