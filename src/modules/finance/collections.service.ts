import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ConfirmBatchDto,
  CreateBankLineDto,
  CreateCollectionBatchDto,
  MatchBankLineDto,
} from './dto/ops.dto';
import { money } from './money';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBatches(status?: string) {
    const rows = await this.prisma.finCollectionBatch.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { items: rows.map((row) => this.mapBatch(row)) };
  }

  async createBatch(dto: CreateCollectionBatchDto) {
    const receiptIds = dto.receiptIds ?? [];
    let received = dto.receivedAmount;
    if (received === undefined && receiptIds.length) {
      const receipts = await this.prisma.finReceipt.findMany({
        where: { id: { in: receiptIds } },
      });
      if (receipts.length !== receiptIds.length) {
        throw new BadRequestException('One or more receipts do not exist');
      }
      received = receipts.reduce((sum, receipt) => sum + money(receipt.amount), 0);
    }
    const row = await this.prisma.finCollectionBatch.create({
      data: {
        branchId: dto.branchId,
        sourceAccount: dto.sourceAccount,
        destinationAccount: dto.destinationAccount,
        receiptIds,
        receivedAmount: money(received ?? 0),
        status: 'draft',
      },
    });
    if (receiptIds.length) {
      await this.prisma.finReceipt.updateMany({
        where: { id: { in: receiptIds }, batchId: null },
        data: { batchId: row.id },
      });
    }
    return this.mapBatch(row);
  }

  async submitBatch(id: string) {
    const row = await this.requireBatch(id);
    if (row.status !== 'draft') {
      throw new BadRequestException(`Cannot submit from status ${row.status}`);
    }
    const updated = await this.prisma.finCollectionBatch.update({
      where: { id },
      data: { status: 'submitted' },
    });
    return this.mapBatch(updated);
  }

  async confirmBatch(
    id: string,
    dto: ConfirmBatchDto = {},
    confirmerId?: string,
  ) {
    const row = await this.requireBatch(id);
    if (row.status !== 'draft' && row.status !== 'submitted') {
      throw new BadRequestException(`Cannot confirm from status ${row.status}`);
    }
    const confirmedAmount = money(dto.confirmedAmount ?? row.receivedAmount);
    const updated = await this.prisma.finCollectionBatch.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmedAmount,
        feeAmount: dto.feeAmount === undefined ? undefined : money(dto.feeAmount),
        confirmerId,
      },
    });
    return this.mapBatch(updated);
  }

  async rejectBatch(id: string) {
    const row = await this.requireBatch(id);
    if (row.status !== 'draft' && row.status !== 'submitted') {
      throw new BadRequestException(`Cannot reject from status ${row.status}`);
    }
    const updated = await this.prisma.finCollectionBatch.update({
      where: { id },
      data: { status: 'rejected' },
    });
    return this.mapBatch(updated);
  }

  async listBankLines(matchStatus?: string) {
    const rows = await this.prisma.finBankStatementLine.findMany({
      where: matchStatus ? { matchStatus } : undefined,
      orderBy: { statementDate: 'desc' },
      take: 200,
    });
    return { items: rows.map((row) => this.mapBankLine(row)) };
  }

  async createBankLine(dto: CreateBankLineDto) {
    const row = await this.prisma.finBankStatementLine.create({
      data: {
        statementDate: dto.statementDate,
        description: dto.description.trim(),
        amount: money(dto.amount),
        matchStatus: 'unmatched',
      },
    });
    return this.mapBankLine(row);
  }

  async matchBankLine(id: string, dto: MatchBankLineDto) {
    const row = await this.prisma.finBankStatementLine.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Bank line not found');
    if (row.matchStatus !== 'unmatched') {
      throw new BadRequestException(`Cannot match from status ${row.matchStatus}`);
    }
    const batch = await this.prisma.finCollectionBatch.findUnique({
      where: { id: dto.matchedBatchId },
    });
    if (!batch) throw new NotFoundException('Collection batch not found');
    const updated = await this.prisma.finBankStatementLine.update({
      where: { id },
      data: { matchStatus: 'matched', matchedBatchId: batch.id },
    });
    return this.mapBankLine(updated);
  }

  async ignoreBankLine(id: string) {
    const row = await this.prisma.finBankStatementLine.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Bank line not found');
    if (row.matchStatus !== 'unmatched') {
      throw new BadRequestException(`Cannot ignore from status ${row.matchStatus}`);
    }
    const updated = await this.prisma.finBankStatementLine.update({
      where: { id },
      data: { matchStatus: 'ignored', matchedBatchId: null },
    });
    return this.mapBankLine(updated);
  }

  private async requireBatch(id: string) {
    const row = await this.prisma.finCollectionBatch.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Collection batch not found');
    return row;
  }

  private mapBatch(row: {
    id: string;
    branchId: string | null;
    sourceAccount: string | null;
    destinationAccount: string | null;
    status: string;
    receiptIds: string[];
    receivedAmount: { toString(): string } | number;
    confirmedAmount: { toString(): string } | number | null;
    feeAmount: { toString(): string } | number | null;
    confirmerId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      branchId: row.branchId,
      sourceAccount: row.sourceAccount,
      destinationAccount: row.destinationAccount,
      status: row.status,
      receiptIds: row.receiptIds,
      receivedAmount: money(row.receivedAmount),
      confirmedAmount:
        row.confirmedAmount == null ? null : money(row.confirmedAmount),
      feeAmount: row.feeAmount == null ? null : money(row.feeAmount),
      confirmerId: row.confirmerId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapBankLine(row: {
    id: string;
    statementDate: string;
    description: string;
    amount: { toString(): string } | number;
    matchStatus: string;
    matchedBatchId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      statementDate: row.statementDate,
      description: row.description,
      amount: money(row.amount),
      matchStatus: row.matchStatus,
      matchedBatchId: row.matchedBatchId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
