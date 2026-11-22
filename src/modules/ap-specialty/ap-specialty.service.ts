import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { money, rethrowUnique } from '../finance/money';
import {
  CreateCatalogueDto,
  CreateDailyIngredientDto,
  CreatePettyCashDto,
  UpdateApSetupDto,
  UpdateCatalogueDto,
  UpdateDailyIngredientDto,
} from './dto/ap-specialty.dto';

@Injectable()
export class ApSpecialtyService {
  constructor(private readonly prisma: PrismaService) {}

  async listCatalogue(active?: string) {
    const where =
      active === 'true' ? { active: true } : active === 'false' ? { active: false } : undefined;
    const rows = await this.prisma.apCatalogueItem.findMany({
      where,
      orderBy: { code: 'asc' },
    });
    return { items: rows.map((row) => this.mapCatalogue(row)) };
  }

  async createCatalogue(dto: CreateCatalogueDto) {
    try {
      const row = await this.prisma.apCatalogueItem.create({
        data: {
          code: dto.code.trim(),
          nameKm: dto.nameKm.trim(),
          nameEn: dto.nameEn,
          category: dto.category,
          purchaseUnit: dto.purchaseUnit ?? 'kg',
          active: dto.active ?? true,
        },
      });
      return this.mapCatalogue(row);
    } catch (error) {
      rethrowUnique(error, 'Catalogue code already exists');
    }
  }

  async updateCatalogue(id: string, dto: UpdateCatalogueDto) {
    const existing = await this.prisma.apCatalogueItem.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Catalogue item not found');
    const row = await this.prisma.apCatalogueItem.update({
      where: { id },
      data: {
        nameKm: dto.nameKm?.trim(),
        nameEn: dto.nameEn,
        category: dto.category,
        purchaseUnit: dto.purchaseUnit,
        active: dto.active,
      },
    });
    return this.mapCatalogue(row);
  }

  async listIngredients(purchaseDate?: string, branchId?: string) {
    const rows = await this.prisma.apDailyIngredient.findMany({
      where: {
        purchaseDate: purchaseDate || undefined,
        branchId: branchId || undefined,
      },
      orderBy: { purchaseDate: 'desc' },
      take: 200,
    });
    return { items: rows.map((row) => this.mapIngredient(row)) };
  }

  async getIngredient(id: string) {
    const row = await this.prisma.apDailyIngredient.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Daily ingredient record not found');
    return this.mapIngredient(row);
  }

  async createIngredient(dto: CreateDailyIngredientDto) {
    if (!dto.lines.length) {
      throw new BadRequestException('Daily ingredient lines are required');
    }
    const row = await this.prisma.apDailyIngredient.create({
      data: {
        branchId: dto.branchId,
        branchCode: dto.branchCode,
        purchaseDate: dto.purchaseDate,
        marketBuyerId: dto.marketBuyerId,
        lines: dto.lines as Prisma.InputJsonValue,
        evidenceNote: dto.evidenceNote,
        linkedDocumentId: dto.linkedDocumentId,
      },
    });
    return this.mapIngredient(row);
  }

  async updateIngredient(id: string, dto: UpdateDailyIngredientDto) {
    const existing = await this.prisma.apDailyIngredient.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Daily ingredient record not found');
    if (dto.lines && dto.lines.length === 0) {
      throw new BadRequestException('Daily ingredient lines cannot be empty');
    }
    const row = await this.prisma.apDailyIngredient.update({
      where: { id },
      data: {
        evidenceNote: dto.evidenceNote,
        linkedDocumentId: dto.linkedDocumentId,
        lines: dto.lines ? (dto.lines as Prisma.InputJsonValue) : undefined,
      },
    });
    return this.mapIngredient(row);
  }

  async listPettyCash(branchId?: string) {
    const rows = await this.prisma.apPettyCash.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { paidAt: 'desc' },
      take: 200,
    });
    return { items: rows.map((row) => this.mapPetty(row)) };
  }

  async createPettyCash(dto: CreatePettyCashDto, recordedById?: string) {
    try {
      const row = await this.prisma.apPettyCash.create({
        data: {
          reference: dto.reference.trim(),
          branchId: dto.branchId,
          paidAt: dto.paidAt,
          currency: dto.currency ?? 'USD',
          amount: money(dto.amount),
          fundId: dto.fundId,
          receiptRef: dto.receiptRef,
          description: dto.description,
          recordedById,
        },
      });
      return this.mapPetty(row);
    } catch (error) {
      rethrowUnique(error, 'Petty cash reference already exists');
    }
  }

  async getSetup() {
    const row = await this.prisma.apSetupConfig.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });
    return this.mapSetup(row);
  }

  async updateSetup(dto: UpdateApSetupDto) {
    const row = await this.prisma.apSetupConfig.upsert({
      where: { id: 'default' },
      update: {
        checkerEmployeeId: dto.checkerEmployeeId,
        approverEmployeeId: dto.approverEmployeeId,
        defaultBranchId: dto.defaultBranchId,
        defaultBranchCode: dto.defaultBranchCode,
      },
      create: {
        id: 'default',
        checkerEmployeeId: dto.checkerEmployeeId,
        approverEmployeeId: dto.approverEmployeeId,
        defaultBranchId: dto.defaultBranchId,
        defaultBranchCode: dto.defaultBranchCode,
      },
    });
    return this.mapSetup(row);
  }

  private mapCatalogue(row: {
    id: string;
    code: string;
    nameKm: string;
    nameEn: string | null;
    category: string | null;
    purchaseUnit: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      code: row.code,
      nameKm: row.nameKm,
      nameEn: row.nameEn,
      category: row.category,
      purchaseUnit: row.purchaseUnit,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapIngredient(row: {
    id: string;
    branchId: string | null;
    branchCode: string | null;
    purchaseDate: string;
    marketBuyerId: string | null;
    lines: Prisma.JsonValue;
    evidenceNote: string | null;
    linkedDocumentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      branchId: row.branchId,
      branchCode: row.branchCode,
      purchaseDate: row.purchaseDate,
      marketBuyerId: row.marketBuyerId,
      lines: row.lines,
      evidenceNote: row.evidenceNote,
      linkedDocumentId: row.linkedDocumentId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapPetty(row: {
    id: string;
    reference: string;
    branchId: string | null;
    paidAt: string;
    currency: string;
    amount: Prisma.Decimal | number;
    fundId: string | null;
    receiptRef: string | null;
    description: string | null;
    recordedById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      reference: row.reference,
      branchId: row.branchId,
      paidAt: row.paidAt,
      currency: row.currency,
      amount: money(row.amount),
      fundId: row.fundId,
      receiptRef: row.receiptRef,
      description: row.description,
      recordedById: row.recordedById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapSetup(row: {
    id: string;
    checkerEmployeeId: string | null;
    approverEmployeeId: string | null;
    defaultBranchId: string | null;
    defaultBranchCode: string | null;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      checkerEmployeeId: row.checkerEmployeeId,
      approverEmployeeId: row.approverEmployeeId,
      defaultBranchId: row.defaultBranchId,
      defaultBranchCode: row.defaultBranchCode,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
