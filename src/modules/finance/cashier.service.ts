import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CloseShiftDto, OpenShiftDto } from './dto/ops.dto';
import { iso, money } from './money';

@Injectable()
export class CashierService {
  constructor(private readonly prisma: PrismaService) {}

  async listShifts(status?: string, businessDate?: string) {
    const rows = await this.prisma.finShift.findMany({
      where: {
        status: status || undefined,
        businessDate: businessDate || undefined,
      },
      orderBy: { businessDate: 'desc' },
      take: 200,
    });
    return { items: rows.map((row) => this.mapShift(row)) };
  }

  async openShift(dto: OpenShiftDto, actorId?: string) {
    const row = await this.prisma.finShift.create({
      data: {
        businessDate: dto.businessDate,
        branchId: dto.branchId,
        terminal: dto.terminal,
        cashierId: dto.cashierId ?? actorId,
        openingFloat: money(dto.openingFloat ?? 0),
        status: 'open',
      },
    });
    return this.mapShift(row);
  }

  async closeShift(id: string, dto: CloseShiftDto) {
    const row = await this.prisma.finShift.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Shift not found');
    if (row.status !== 'open') {
      throw new BadRequestException(`Cannot close from status ${row.status}`);
    }
    const expected =
      dto.expectedCash === undefined
        ? await this.expectedCash(row.id, money(row.openingFloat))
        : money(dto.expectedCash);
    const counted = money(dto.countedCash);
    const updated = await this.prisma.finShift.update({
      where: { id },
      data: {
        status: 'closed',
        expectedCash: expected,
        countedCash: counted,
        variance: money(counted - expected),
        closedAt: new Date(),
      },
    });
    return this.mapShift(updated);
  }

  async reviewShift(id: string, reviewerId?: string) {
    const row = await this.prisma.finShift.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Shift not found');
    if (row.status !== 'closed') {
      throw new BadRequestException(`Cannot review from status ${row.status}`);
    }
    const updated = await this.prisma.finShift.update({
      where: { id },
      data: { status: 'reviewed', reviewerId },
    });
    return this.mapShift(updated);
  }

  private async expectedCash(shiftId: string, openingFloat: number) {
    const receipts = await this.prisma.finReceipt.findMany({
      where: {
        shiftId,
        method: 'cash',
        confirmationStatus: { not: 'rejected' },
      },
    });
    const taken = receipts.reduce((sum, receipt) => sum + money(receipt.amount), 0);
    return money(openingFloat + taken);
  }

  private mapShift(row: {
    id: string;
    branchId: string | null;
    terminal: string | null;
    cashierId: string | null;
    businessDate: string;
    status: string;
    openingFloat: { toString(): string } | number;
    expectedCash: { toString(): string } | number | null;
    countedCash: { toString(): string } | number | null;
    variance: { toString(): string } | number | null;
    reviewerId: string | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      branchId: row.branchId,
      terminal: row.terminal,
      cashierId: row.cashierId,
      businessDate: row.businessDate,
      status: row.status,
      openingFloat: money(row.openingFloat),
      expectedCash: row.expectedCash == null ? null : money(row.expectedCash),
      countedCash: row.countedCash == null ? null : money(row.countedCash),
      variance: row.variance == null ? null : money(row.variance),
      reviewerId: row.reviewerId,
      closedAt: iso(row.closedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
