import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { ApprovalsService } from '../approvals/approvals.service';

@Injectable()
export class TimesheetService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ApprovalsService))
    private readonly approvals: ApprovalsService,
  ) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private monthRange(month: string) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('month must be YYYY-MM');
    }
    const start = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const end = `${month}-${String(last).padStart(2, '0')}`;
    return { start, end };
  }

  async summary(payload: JwtPayload, month: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'timesheet', 'view')) return { month, items: [], locked: false };

    const { start, end } = this.monthRange(month);
    const days = await this.prisma.attendanceDay.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ employeeId: 'asc' }, { date: 'asc' }],
    });
    const scoped = filterByScope(
      user,
      'timesheet',
      'view',
      days.map((d) => ({
        employeeId: d.employeeId,
        date: d.date,
        hoursWorked: d.hoursWorked != null ? Number(d.hoursWorked) : 0,
        overtimeHours: d.overtimeHours != null ? Number(d.overtimeHours) : 0,
        status: d.status,
      })),
    );

    const byEmp = new Map<
      string,
      {
        employeeId: string;
        worked: number;
        late: number;
        absent: number;
        leaveDays: number;
        otHours: number;
        days: number;
      }
    >();
    for (const row of scoped) {
      const cur = byEmp.get(row.employeeId) ?? {
        employeeId: row.employeeId,
        worked: 0,
        late: 0,
        absent: 0,
        leaveDays: 0,
        otHours: 0,
        days: 0,
      };
      cur.days += 1;
      cur.worked += row.hoursWorked;
      cur.otHours += row.overtimeHours;
      if (row.status === 'late') cur.late += 1;
      if (row.status === 'absent') cur.absent += 1;
      if (row.status === 'leave') cur.leaveDays += 1;
      byEmp.set(row.employeeId, cur);
    }

    const lock = await this.prisma.timesheetLock.findUnique({ where: { month } });
    const approval = await this.prisma.timesheetApproval.findUnique({
      where: { month_scopeKey: { month, scopeKey: 'company' } },
    });

    return {
      month,
      locked: !!lock,
      lock: lock
        ? {
            month: lock.month,
            lockedBy: lock.lockedBy,
            lockedAt: lock.lockedAt.toISOString(),
          }
        : null,
      approval: approval
        ? {
            id: approval.id,
            status: approval.status,
            requestedBy: approval.requestedBy,
            decidedBy: approval.decidedBy,
            decidedAt: approval.decidedAt?.toISOString(),
          }
        : null,
      items: [...byEmp.values()].map((i) => ({
        ...i,
        worked: Math.round(i.worked * 100) / 100,
        otHours: Math.round(i.otHours * 100) / 100,
      })),
    };
  }

  async submit(payload: JwtPayload, month: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'timesheet', 'approve') && !can(user, 'timesheet', 'edit')) {
      throw new ForbiddenException('Missing permission: timesheet submit');
    }
    this.monthRange(month);
    const existing = await this.prisma.timesheetApproval.findUnique({
      where: { month_scopeKey: { month, scopeKey: 'company' } },
    });
    if (existing?.status === 'approved') {
      throw new BadRequestException('Timesheet already approved');
    }

    return this.prisma.$transaction(async (tx) => {
      const approval = await this.approvals.createInTx(tx, {
        type: 'timesheet',
        requesterId: payload.employeeId ?? payload.sub,
        summary: `Timesheet ${month}`,
        relatedId: `${month}:company`,
        relatedType: 'timesheet',
      });
      const row = await tx.timesheetApproval.upsert({
        where: { month_scopeKey: { month, scopeKey: 'company' } },
        create: {
          month,
          scopeKey: 'company',
          status: 'pending',
          requestedBy: payload.employeeId ?? payload.sub,
          approvalId: approval.id,
        },
        update: {
          status: 'pending',
          requestedBy: payload.employeeId ?? payload.sub,
          approvalId: approval.id,
          decidedBy: null,
          decidedAt: null,
        },
      });
      return {
        id: row.id,
        month: row.month,
        status: row.status,
        approvalId: row.approvalId,
      };
    });
  }

  async lock(payload: JwtPayload, month: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'timesheet', 'edit')) {
      throw new ForbiddenException('Missing permission: timesheet:edit');
    }
    this.monthRange(month);
    const row = await this.prisma.timesheetLock.upsert({
      where: { month },
      create: {
        month,
        lockedBy: payload.employeeId ?? payload.sub,
      },
      update: {
        lockedBy: payload.employeeId ?? payload.sub,
        lockedAt: new Date(),
      },
    });
    return {
      month: row.month,
      lockedBy: row.lockedBy,
      lockedAt: row.lockedAt.toISOString(),
    };
  }

  async applyApprovalDecision(
    relatedId: string,
    status: 'approved' | 'rejected',
    actorId: string,
  ) {
    const [month, scopeKey = 'company'] = relatedId.split(':');
    if (!month) return;
    await this.prisma.timesheetApproval.updateMany({
      where: { month, scopeKey },
      data: {
        status,
        decidedBy: actorId,
        decidedAt: new Date(),
      },
    });
  }
}
