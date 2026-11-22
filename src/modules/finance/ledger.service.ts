import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateAccountDto,
  CreateJournalDto,
  CreatePeriodDto,
  UpdateAccountDto,
} from './dto/ledger.dto';
import { iso, money, rethrowUnique } from './money';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts(type?: string) {
    const rows = await this.prisma.finAccount.findMany({
      where: type ? { type } : undefined,
      orderBy: { code: 'asc' },
    });
    return { items: rows.map((row) => this.mapAccount(row)) };
  }

  async createAccount(dto: CreateAccountDto) {
    try {
      const row = await this.prisma.finAccount.create({
        data: {
          code: dto.code.trim(),
          name: dto.name.trim(),
          type: dto.type,
          active: dto.active ?? true,
        },
      });
      return this.mapAccount(row);
    } catch (error) {
      rethrowUnique(error, 'Account code already exists');
    }
  }

  async updateAccount(id: string, dto: UpdateAccountDto) {
    await this.requireAccount(id);
    const row = await this.prisma.finAccount.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        type: dto.type,
        active: dto.active,
      },
    });
    return this.mapAccount(row);
  }

  async listPeriods() {
    const rows = await this.prisma.finPeriod.findMany({
      orderBy: { yearMonth: 'desc' },
    });
    return { items: rows.map((row) => this.mapPeriod(row)) };
  }

  async createPeriod(dto: CreatePeriodDto) {
    if (!/^\d{4}-\d{2}$/.test(dto.yearMonth)) {
      throw new BadRequestException('yearMonth must be YYYY-MM');
    }
    try {
      const row = await this.prisma.finPeriod.create({
        data: { yearMonth: dto.yearMonth, status: dto.status ?? 'open' },
      });
      return this.mapPeriod(row);
    } catch (error) {
      rethrowUnique(error, 'Period already exists');
    }
  }

  async setPeriodStatus(id: string, status: 'soft_close' | 'locked') {
    const row = await this.prisma.finPeriod.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Period not found');
    if (row.status === 'locked' && status === 'soft_close') {
      throw new BadRequestException('Locked period cannot be reopened');
    }
    const updated = await this.prisma.finPeriod.update({
      where: { id },
      data: { status },
    });
    return this.mapPeriod(updated);
  }

  async listJournals(status?: string) {
    const rows = await this.prisma.finJournal.findMany({
      where: status ? { status } : undefined,
      orderBy: { businessDate: 'desc' },
      take: 200,
      include: { lines: true },
    });
    return { items: rows.map((row) => this.mapJournal(row)) };
  }

  async getJournal(id: string) {
    const row = await this.prisma.finJournal.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!row) throw new NotFoundException('Journal not found');
    return this.mapJournal(row);
  }

  async createJournal(dto: CreateJournalDto) {
    if (!dto.lines.length) {
      throw new BadRequestException('Journal needs at least one line');
    }
    const accountIds = [...new Set(dto.lines.map((line) => line.accountId))];
    const accounts = await this.prisma.finAccount.findMany({
      where: { id: { in: accountIds } },
    });
    if (accounts.length !== accountIds.length) {
      throw new BadRequestException('One or more accounts do not exist');
    }
    if (accounts.some((account) => !account.active)) {
      throw new BadRequestException('Inactive account cannot be used');
    }
    const row = await this.prisma.finJournal.create({
      data: {
        businessDate: dto.businessDate,
        sourceSystem: dto.sourceSystem,
        sourceDocumentId: dto.sourceDocumentId,
        memo: dto.memo,
        status: 'draft',
        lines: {
          create: dto.lines.map((line) => ({
            accountId: line.accountId,
            debit: money(line.debit),
            credit: money(line.credit),
            memo: line.memo,
            branchId: line.branchId,
          })),
        },
      },
      include: { lines: true },
    });
    return this.mapJournal(row);
  }

  async postJournal(id: string, actorId?: string) {
    const row = await this.prisma.finJournal.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!row) throw new NotFoundException('Journal not found');
    if (row.status !== 'draft') {
      throw new BadRequestException(`Cannot post from status ${row.status}`);
    }
    this.assertBalanced(row.lines);
    await this.assertPeriodOpen(row.businessDate);
    const updated = await this.prisma.finJournal.update({
      where: { id },
      data: {
        status: 'posted',
        postedAt: new Date(),
        postedById: actorId,
      },
      include: { lines: true },
    });
    return this.mapJournal(updated);
  }

  async reverseJournal(id: string, actorId?: string) {
    const row = await this.prisma.finJournal.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!row) throw new NotFoundException('Journal not found');
    if (row.status !== 'posted') {
      throw new BadRequestException(`Cannot reverse from status ${row.status}`);
    }
    await this.assertPeriodOpen(row.businessDate);
    const reversal = await this.prisma.$transaction(async (tx) => {
      const created = await tx.finJournal.create({
        data: {
          businessDate: row.businessDate,
          status: 'posted',
          sourceSystem: 'reversal',
          sourceDocumentId: row.id,
          memo: `Reversal of ${row.id}`,
          reversalOf: row.id,
          postedAt: new Date(),
          postedById: actorId,
          lines: {
            create: row.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.credit,
              credit: line.debit,
              memo: line.memo,
              branchId: line.branchId,
            })),
          },
        },
        include: { lines: true },
      });
      await tx.finJournal.update({
        where: { id: row.id },
        data: { status: 'reversed' },
      });
      return created;
    });
    return this.mapJournal(reversal);
  }

  private assertBalanced(
    lines: { debit: { toString(): string } | number; credit: { toString(): string } | number }[],
  ) {
    if (!lines.length) {
      throw new BadRequestException('Journal has no lines');
    }
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
      debit += Number(line.debit);
      credit += Number(line.credit);
    }
    if (money(debit) !== money(credit)) {
      throw new BadRequestException(
        `Journal is not balanced (debit ${money(debit)} credit ${money(credit)})`,
      );
    }
  }

  private async assertPeriodOpen(businessDate: string) {
    const yearMonth = businessDate.slice(0, 7);
    const period = await this.prisma.finPeriod.findUnique({
      where: { yearMonth },
    });
    if (period?.status === 'locked') {
      throw new BadRequestException(`Period ${yearMonth} is locked`);
    }
  }

  private async requireAccount(id: string) {
    const row = await this.prisma.finAccount.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Account not found');
    return row;
  }

  private mapAccount(row: {
    id: string;
    code: string;
    name: string;
    type: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapPeriod(row: {
    id: string;
    yearMonth: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      yearMonth: row.yearMonth,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapJournal(row: {
    id: string;
    businessDate: string;
    status: string;
    sourceSystem: string | null;
    sourceDocumentId: string | null;
    memo: string | null;
    reversalOf: string | null;
    postedAt: Date | null;
    postedById: string | null;
    createdAt: Date;
    updatedAt: Date;
    lines: {
      id: string;
      accountId: string;
      debit: { toString(): string } | number;
      credit: { toString(): string } | number;
      memo: string | null;
      branchId: string | null;
    }[];
  }) {
    const lines = row.lines.map((line) => ({
      id: line.id,
      accountId: line.accountId,
      debit: money(line.debit),
      credit: money(line.credit),
      memo: line.memo,
      branchId: line.branchId,
    }));
    const debit = money(lines.reduce((sum, line) => sum + line.debit, 0));
    const credit = money(lines.reduce((sum, line) => sum + line.credit, 0));
    return {
      id: row.id,
      businessDate: row.businessDate,
      status: row.status,
      sourceSystem: row.sourceSystem,
      sourceDocumentId: row.sourceDocumentId,
      memo: row.memo,
      reversalOf: row.reversalOf,
      postedAt: iso(row.postedAt),
      postedById: row.postedById,
      debit,
      credit,
      balanced: debit === credit,
      lines,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
