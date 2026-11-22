import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope, getScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { ApprovalsService } from '../approvals/approvals.service';
import {
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  LeaveListQueryDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';

@Injectable()
export class LeaveService {
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

  private mapRequest(
    r: Prisma.LeaveRequestGetPayload<{ include: { leaveType: true } }>,
  ) {
    return {
      id: r.id,
      employeeId: r.employeeId,
      leaveTypeId: r.leaveTypeId,
      leaveType: r.leaveType
        ? {
            id: r.leaveType.id,
            name: r.leaveType.name,
            nameKm: r.leaveType.nameKm,
            daysPerYear: Number(r.leaveType.daysPerYear),
            paid: r.leaveType.paid,
            requiresHrApproval: r.leaveType.requiresHrApproval,
          }
        : undefined,
      startDate: r.startDate.toISOString().slice(0, 10),
      endDate: r.endDate.toISOString().slice(0, 10),
      halfDay: r.halfDay,
      halfDayPeriod: r.halfDayPeriod,
      days: Number(r.days),
      reason: r.reason,
      status: r.status,
      approverId: r.approverId,
      submittedAt: r.submittedAt.toISOString(),
      submittedById: r.submittedById,
      rejectComment: r.rejectComment,
      attachmentName: r.attachmentName,
      approvalId: r.approvalId,
    };
  }

  types() {
    return this.prisma.leaveType.findMany({ orderBy: { name: 'asc' } }).then(
      (rows) =>
        rows.map((t) => ({
          ...t,
          daysPerYear: Number(t.daysPerYear),
          monthlyAccrual:
            t.monthlyAccrual != null ? Number(t.monthlyAccrual) : null,
          maxCarryOver:
            t.maxCarryOver != null ? Number(t.maxCarryOver) : null,
        })),
    );
  }

  async balances(payload: JwtPayload, employeeId?: string) {
    const user = this.toCurrentUser(payload);
    const targetId = employeeId ?? payload.employeeId;
    if (!targetId) throw new BadRequestException('employeeId required');
    if (
      !can(user, 'leave', 'view', {
        employeeId: targetId,
      })
    ) {
      throw new ForbiddenException('Missing permission: leave:view');
    }
    const year = new Date().getFullYear();
    const rows = await this.prisma.leaveBalance.findMany({
      where: { employeeId: targetId, year },
      include: { leaveType: true },
    });
    return rows.map((b) => ({
      employeeId: b.employeeId,
      leaveTypeId: b.leaveTypeId,
      year: b.year,
      used: Number(b.used),
      remaining: Number(b.remaining),
      total: Number(b.total),
      carryForward:
        b.carryForward != null ? Number(b.carryForward) : undefined,
      leaveTypeName: b.leaveType.name,
    }));
  }

  async list(payload: JwtPayload, query: LeaveListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'leave', 'view')) return { items: [] };

    const where: Prisma.LeaveRequestWhereInput = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;

    const rows = await this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: { select: { id: true, departmentId: true, managerId: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    const mapped = rows.map((r) => ({
      ...this.mapRequest(r),
      departmentId: r.employee.departmentId ?? undefined,
      managerId: r.employee.managerId,
    }));
    return { items: filterByScope(user, 'leave', 'view', mapped) };
  }

  async getOne(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        leaveType: true,
        employee: { select: { id: true, departmentId: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Leave request not found');
    if (
      !can(user, 'leave', 'view', {
        employeeId: row.employeeId,
        departmentId: row.employee.departmentId ?? undefined,
        managerId: row.employee.managerId,
      })
    ) {
      throw new NotFoundException('Leave request not found');
    }
    return this.mapRequest(row);
  }

  async create(dto: CreateLeaveRequestDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const targetEmployeeId = dto.employeeId ?? payload.employeeId;
    if (!targetEmployeeId) {
      throw new BadRequestException('employeeId required');
    }
    if (
      !can(user, 'leave', 'create', {
        employeeId: targetEmployeeId,
      })
    ) {
      throw new ForbiddenException('Missing permission: leave:create');
    }
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be on/after startDate');
    }

    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: dto.leaveTypeId },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const year = new Date(dto.startDate).getFullYear();
    const balance = await this.ensureBalance(
      targetEmployeeId,
      dto.leaveTypeId,
      year,
      Number(leaveType.daysPerYear),
    );
    if (Number(balance.remaining) < dto.days) {
      throw new BadRequestException('Insufficient leave balance');
    }

    const emp = await this.prisma.employee.findUnique({
      where: { id: targetEmployeeId },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          employeeId: targetEmployeeId,
          leaveTypeId: dto.leaveTypeId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          halfDay: dto.halfDay ?? false,
          halfDayPeriod: dto.halfDayPeriod,
          days: dto.days,
          reason: dto.reason,
          status: 'pending',
          submittedById: payload.employeeId ?? payload.sub,
          attachmentName: dto.attachmentName,
        },
        include: { leaveType: true },
      });

      const approval = await this.approvals.createInTx(tx, {
        type: 'leave',
        requesterId: targetEmployeeId,
        summary: `${leaveType.name}: ${dto.startDate} → ${dto.endDate} (${dto.days}d)`,
        relatedId: request.id,
        relatedType: 'leave_request',
      });

      const linked = await tx.leaveRequest.update({
        where: { id: request.id },
        data: { approvalId: approval.id },
        include: { leaveType: true },
      });

      return this.mapRequest(linked);
    });
  }

  async cancel(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Leave request not found');
    if (
      !can(user, 'leave', 'edit', { employeeId: row.employeeId }) &&
      row.employeeId !== payload.employeeId
    ) {
      throw new ForbiddenException('Cannot cancel this leave request');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { leaveType: true },
      });
      if (leave.approvalId) {
        await tx.approvalRequest.update({
          where: { id: leave.approvalId },
          data: {
            status: 'returned',
            note: 'Cancelled by requester',
            decidedAt: new Date(),
            decidedById: payload.employeeId ?? payload.sub,
          },
        });
      }
      return leave;
    });
    return this.mapRequest(updated);
  }

  /** Called from ApprovalsService after approve/reject */
  async applyApprovalDecision(
    leaveRequestId: string,
    decision: 'approved' | 'rejected',
    actorId: string,
    note?: string,
  ) {
    const row = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
    });
    if (!row) throw new NotFoundException('Leave request not found');
    if (row.status !== 'pending') {
      throw new BadRequestException(`Leave already ${row.status}`);
    }

    if (decision === 'rejected') {
      return this.prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: 'rejected',
          approverId: actorId,
          rejectComment: note,
        },
        include: { leaveType: true },
      });
    }

    const year = row.startDate.getFullYear();
    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: row.employeeId,
            leaveTypeId: row.leaveTypeId,
            year,
          },
        },
      });
      if (!balance || Number(balance.remaining) < Number(row.days)) {
        throw new BadRequestException('Insufficient leave balance at approval');
      }
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used: Number(balance.used) + Number(row.days),
          remaining: Number(balance.remaining) - Number(row.days),
        },
      });
      return tx.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: 'approved',
          approverId: actorId,
        },
        include: { leaveType: true },
      });
    });
  }

  private assertLeaveCatalog(user: CurrentUser, action: 'create' | 'edit') {
    const scope = getScope(user, 'leave', action);
    const settingsScope = getScope(user, 'leave', 'manage_settings');
    if (scope === 'company' || settingsScope === 'company') return;
    throw new ForbiddenException(
      `Missing company permission: leave:${action}`,
    );
  }

  private mapType(t: {
    id: string;
    name: string;
    nameKm: string | null;
    daysPerYear: Prisma.Decimal;
    monthlyAccrual: Prisma.Decimal | null;
    paid: boolean;
    carryOver: boolean;
    maxCarryOver: Prisma.Decimal | null;
    requiresHrApproval: boolean;
    rosterCode: string | null;
    color: string | null;
  }) {
    return {
      ...t,
      daysPerYear: Number(t.daysPerYear),
      monthlyAccrual:
        t.monthlyAccrual != null ? Number(t.monthlyAccrual) : null,
      maxCarryOver: t.maxCarryOver != null ? Number(t.maxCarryOver) : null,
    };
  }

  private leaveTypeId(name: string, requested?: string): string {
    if (requested && /^[a-z0-9-]{2,64}$/.test(requested)) return requested;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return `lt-${slug || 'type'}`;
  }

  async createType(dto: CreateLeaveTypeDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    this.assertLeaveCatalog(user, 'create');
    let id = this.leaveTypeId(dto.name, dto.id);
    const base = id;
    let n = 2;
    while (await this.prisma.leaveType.findUnique({ where: { id } })) {
      id = `${base}-${n++}`;
    }
    const row = await this.prisma.leaveType.create({
      data: {
        id,
        name: dto.name,
        nameKm: dto.nameKm,
        daysPerYear: dto.daysPerYear,
        monthlyAccrual: dto.monthlyAccrual,
        paid: dto.paid ?? true,
        carryOver: dto.carryOver ?? false,
        maxCarryOver: dto.maxCarryOver,
        requiresHrApproval: dto.requiresHrApproval ?? false,
        rosterCode: dto.rosterCode,
        color: dto.color,
      },
    });
    return this.mapType(row);
  }

  async updateType(id: string, dto: UpdateLeaveTypeDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    this.assertLeaveCatalog(user, 'edit');
    const existing = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leave type not found');
    const row = await this.prisma.leaveType.update({
      where: { id },
      data: dto,
    });
    return this.mapType(row);
  }

  async deleteType(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    this.assertLeaveCatalog(user, 'edit');
    const existing = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leave type not found');
    const [requests, balances] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { leaveTypeId: id } }),
      this.prisma.leaveBalance.count({ where: { leaveTypeId: id } }),
    ]);
    if (requests > 0 || balances > 0) {
      throw new ConflictException(
        'Leave type is in use by requests or balances',
      );
    }
    await this.prisma.leaveType.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensureBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    total: number,
  ) {
    return this.prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year },
      },
      create: {
        employeeId,
        leaveTypeId,
        year,
        total,
        remaining: total,
        used: 0,
      },
      update: {},
    });
  }
}
