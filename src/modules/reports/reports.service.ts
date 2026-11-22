import { Injectable } from '@nestjs/common';
import { todayInPhnomPenh } from '../../common/dates';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { money } from '../finance/money';
import { HrMonthlyQueryDto, HrTrendsQueryDto } from './dto/reports.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly finance: FinanceService,
  ) {}

  async hrSummary() {
    const today = todayInPhnomPenh();
    const [byStatus, departments, leave, attendance, contracts, probationOpen] =
      await Promise.all([
        this.prisma.employee.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.department.findMany({
          select: {
            id: true,
            code: true,
            name: true,
            _count: { select: { employees: true } },
          },
          orderBy: { code: 'asc' },
        }),
        this.prisma.leaveRequest.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.attendanceDay.groupBy({
          by: ['status'],
          where: { date: today },
          _count: { _all: true },
        }),
        this.prisma.employmentContract.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.probationCase.count({
          where: { status: { in: ['pending_eval', 'active', 'extended'] } },
        }),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      today,
      headcount: countMap(byStatus),
      departments: departments.map((department) => ({
        id: department.id,
        code: department.code,
        name: department.name,
        employees: department._count.employees,
      })),
      leave: countMap(leave),
      attendanceToday: countMap(attendance),
      contracts: countMap(contracts),
      probationOpen,
    };
  }

  async financeSummary() {
    const summary = await this.finance.summary();
    const [journals, invoices, receiptsPending, tax, openShifts, unmatchedBank] =
      await Promise.all([
        this.prisma.finJournal.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.finInvoice.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.finReceipt.count({
          where: { confirmationStatus: 'pending' },
        }),
        this.prisma.finTaxScheduleLine.aggregate({
          _sum: { outstanding: true, amount: true },
        }),
        this.prisma.finShift.count({ where: { status: 'open' } }),
        this.prisma.finBankStatementLine.count({
          where: { matchStatus: 'unmatched' },
        }),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      ...summary,
      journals: countMap(journals),
      invoices: countMap(invoices),
      receiptsPending,
      taxOutstanding: money(tax._sum.outstanding ?? 0),
      taxAmount: money(tax._sum.amount ?? 0),
      openShifts,
      unmatchedBankLines: unmatchedBank,
    };
  }

  async hrMonthly(query: HrMonthlyQueryDto = {}) {
    const today = todayInPhnomPenh();
    const [todayYear, todayMonth] = today.split('-').map((part) => Number(part));
    return this.monthSnapshot(query.year ?? todayYear, query.month ?? todayMonth);
  }

  async hrTrends(query: HrTrendsQueryDto = {}) {
    const months = query.months ?? 6;
    const today = todayInPhnomPenh();
    const [year, month] = today.split('-').map((part) => Number(part));
    const items = [];
    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const shifted = shiftMonth(year, month, -offset);
      items.push(await this.monthSnapshot(shifted.year, shifted.month));
    }
    return { months, items };
  }

  private async monthSnapshot(year: number, month: number) {
    const bounds = monthBounds(year, month);
    const activeStatuses = ['active', 'probation', 'on_leave'];
    const [headcount, newHires, exits, attendance, leaves] = await Promise.all([
      this.prisma.employee.count({
        where: {
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: bounds.end } }] },
            {
              OR: [
                { status: { in: activeStatuses } },
                { lastWorkingDay: { gte: bounds.start, lte: bounds.end } },
              ],
            },
          ],
        },
      }),
      this.prisma.employee.count({
        where: { startDate: { gte: bounds.start, lte: bounds.end } },
      }),
      this.prisma.employee.count({
        where: { lastWorkingDay: { gte: bounds.start, lte: bounds.end } },
      }),
      this.prisma.attendanceDay.groupBy({
        by: ['status'],
        where: { date: { gte: bounds.startStr, lte: bounds.endStr } },
        _count: { _all: true },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          status: 'approved',
          startDate: { lte: bounds.end },
          endDate: { gte: bounds.start },
        },
        select: { days: true },
      }),
    ]);

    const attendanceCounts = countMap(attendance);
    const recorded = Object.values(attendanceCounts).reduce((sum, n) => sum + n, 0);
    const attended = ['present', 'late', 'half_day', 'wfh', 'remote'].reduce(
      (sum, status) => sum + (attendanceCounts[status] ?? 0),
      0,
    );
    const leaveDays =
      Math.round(leaves.reduce((sum, row) => sum + Number(row.days), 0) * 100) / 100;

    return {
      year,
      month,
      period: bounds.label,
      headcount,
      attendanceRate: recorded === 0 ? 0 : Math.round((attended / recorded) * 1000) / 1000,
      attendance: { recorded, attended, byStatus: attendanceCounts },
      leaveDays,
      newHires,
      exits,
    };
  }
}

function countMap(rows: { status: string; _count: { _all: number } }[]) {
  const out: Record<string, number> = {};
  for (const row of rows) out[row.status] = row._count._all;
  return out;
}

function monthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const label = `${year}-${String(month).padStart(2, '0')}`;
  return {
    start,
    end,
    startStr: `${label}-01`,
    endStr: end.toISOString().slice(0, 10),
    label,
  };
}

function shiftMonth(year: number, month: number, delta: number) {
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1 };
}
