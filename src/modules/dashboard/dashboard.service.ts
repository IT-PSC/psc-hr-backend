import { Injectable } from '@nestjs/common';
import { todayInPhnomPenh } from '../../common/dates';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';

const ACTIVE = ['active', 'probation', 'on_leave'];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly finance: FinanceService,
  ) {}

  async summary() {
    const today = todayInPhnomPenh();
    const [
      employees,
      pendingApprovals,
      leavePending,
      attendance,
      helpdeskOpen,
      complianceOpen,
      finance,
    ] = await Promise.all([
      this.prisma.employee.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.approvalRequest.count({ where: { status: 'pending' } }),
      this.prisma.leaveRequest.count({ where: { status: 'pending' } }),
      this.prisma.attendanceDay.groupBy({
        by: ['status'],
        where: { date: today },
        _count: { _all: true },
      }),
      this.prisma.helpdeskTicket.count({
        where: { status: { in: ['open', 'in_progress', 'pending'] } },
      }),
      this.prisma.complianceItem.count({
        where: { status: { in: ['upcoming', 'due', 'overdue'] } },
      }),
      this.finance.summary(),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of employees) byStatus[row.status] = row._count._all;
    const headcount = ACTIVE.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0);

    const attendanceToday: Record<string, number> = {};
    for (const row of attendance) attendanceToday[row.status] = row._count._all;

    return {
      generatedAt: new Date().toISOString(),
      today,
      headcount,
      employeesByStatus: byStatus,
      pendingApprovals,
      leavePending,
      attendanceToday,
      helpdeskOpen,
      complianceOpen,
      finance: {
        currency: finance.currency,
        cashOnHand: finance.cashOnHand,
        receivables: finance.receivables,
        payablesOpen: finance.payablesOpen,
        payrollAccrual: finance.payrollAccrual,
      },
    };
  }
}
