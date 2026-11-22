import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { LeaveService } from '../leave/leave.service';
import { LifecycleService } from '../lifecycle/lifecycle.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OvertimeService } from '../overtime/overtime.service';
import { TimesheetService } from '../timesheet/timesheet.service';
import { WorkplaceService } from '../workplace/workplace.service';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => LeaveService))
    private readonly leave: LeaveService,
    @Inject(forwardRef(() => OvertimeService))
    private readonly overtime: OvertimeService,
    @Inject(forwardRef(() => TimesheetService))
    private readonly timesheets: TimesheetService,
    @Inject(forwardRef(() => LifecycleService))
    private readonly lifecycle: LifecycleService,
    @Inject(forwardRef(() => WorkplaceService))
    private readonly workplace: WorkplaceService,
    private readonly notifications: NotificationsService,
  ) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private map(row: {
    id: string;
    type: string;
    status: string;
    requesterId: string;
    summary: string | null;
    note: string | null;
    relatedId: string | null;
    relatedType: string | null;
    decidedAt: Date | null;
    decidedById: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      requesterId: row.requesterId,
      summary: row.summary ?? undefined,
      note: row.note ?? undefined,
      relatedId: row.relatedId ?? undefined,
      relatedType: row.relatedType ?? undefined,
      decidedAt: row.decidedAt?.toISOString() ?? undefined,
      decidedById: row.decidedById ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'approvals', 'view')) {
      return { items: [] };
    }
    const rows = await this.prisma.approvalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const mapped = rows.map((r) => ({
      ...this.map(r),
      employeeId: r.requesterId,
    }));
    return {
      items: filterByScope(user, 'approvals', 'view', mapped),
    };
  }

  async submit(
    payload: JwtPayload,
    input: { type: string; summary?: string; relatedId?: string },
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'approvals', 'create')) {
      throw new ForbiddenException('Missing permission: approvals:create');
    }
    const requesterId = payload.employeeId ?? payload.sub;
    const row = await this.prisma.approvalRequest.create({
      data: {
        type: input.type,
        summary: input.summary,
        requesterId,
        relatedId: input.relatedId,
        relatedType: input.relatedId ? input.type : undefined,
        status: 'pending',
      },
    });
    return this.map(row);
  }

  /** Used inside leave create transaction */
  createInTx(
    tx: Prisma.TransactionClient,
    input: {
      type: string;
      requesterId: string;
      summary?: string;
      relatedId?: string;
      relatedType?: string;
    },
  ) {
    return tx.approvalRequest.create({
      data: {
        type: input.type,
        requesterId: input.requesterId,
        summary: input.summary,
        relatedId: input.relatedId,
        relatedType: input.relatedType,
        status: 'pending',
      },
    });
  }

  async approve(id: string, payload: JwtPayload, note?: string) {
    return this.decide(id, payload, 'approved', note);
  }

  async reject(id: string, payload: JwtPayload, note?: string) {
    return this.decide(id, payload, 'rejected', note);
  }

  async returnForEdit(id: string, payload: JwtPayload, note?: string) {
    return this.decide(id, payload, 'returned', note);
  }

  private async decide(
    id: string,
    payload: JwtPayload,
    status: ApprovalStatus,
    note?: string,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'approvals', 'approve')) {
      throw new ForbiddenException('Missing permission: approvals:approve');
    }
    const row = await this.prisma.approvalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Approval not found');
    if (row.status !== 'pending') {
      throw new BadRequestException(`Approval already ${row.status}`);
    }

    const actorId = payload.employeeId ?? payload.sub;

    if (
      row.type === 'leave' &&
      row.relatedId &&
      (status === 'approved' || status === 'rejected')
    ) {
      await this.leave.applyApprovalDecision(
        row.relatedId,
        status,
        actorId,
        note,
      );
    }

    if (row.type === 'leave' && row.relatedId && status === 'returned') {
      await this.prisma.leaveRequest.updateMany({
        where: { id: row.relatedId, status: 'pending' },
        data: { status: 'cancelled', rejectComment: note ?? 'Returned' },
      });
    }

    if (
      row.type === 'overtime' &&
      row.relatedId &&
      (status === 'approved' || status === 'rejected')
    ) {
      await this.overtime.applyApprovalDecision(
        row.relatedId,
        status,
        actorId,
        note,
      );
    }

    if (row.type === 'overtime' && row.relatedId && status === 'returned') {
      await this.prisma.overtimeRequest.updateMany({
        where: { id: row.relatedId, status: 'pending' },
        data: { status: 'cancelled', rejectComment: note ?? 'Returned' },
      });
    }

    if (
      row.type === 'timesheet' &&
      row.relatedId &&
      (status === 'approved' || status === 'rejected')
    ) {
      await this.timesheets.applyApprovalDecision(
        row.relatedId,
        status,
        actorId,
      );
    }

    if (
      row.type === 'resignation' &&
      row.relatedId &&
      (status === 'approved' || status === 'rejected')
    ) {
      await this.lifecycle.applyApprovalDecision(
        row.relatedId,
        status,
        actorId,
        note,
      );
    }

    if (row.type === 'resignation' && row.relatedId && status === 'returned') {
      await this.prisma.resignationRequest.updateMany({
        where: { id: row.relatedId, status: 'pending' },
        data: { status: 'cancelled', rejectComment: note ?? 'Returned' },
      });
    }

    if (
      (row.type === 'letter_request' || row.type === 'letter') &&
      row.relatedId &&
      (status === 'approved' || status === 'rejected')
    ) {
      await this.workplace.applyLetterApprovalDecision(
        row.relatedId,
        status,
        actorId,
      );
    }

    if (
      (row.type === 'letter_request' || row.type === 'letter') &&
      row.relatedId &&
      status === 'returned'
    ) {
      await this.prisma.letterRequest.updateMany({
        where: { id: row.relatedId, status: 'pending' },
        data: { status: 'cancelled' },
      });
    }

    await this.applyP11Decision(row, status, actorId);
    if (row.type === 'expense') {
      await this.applyExpenseDecision(row.relatedId, status, actorId, note);
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id },
      data: {
        status,
        note,
        decidedAt: new Date(),
        decidedById: actorId,
      },
    });

    const statusLabel =
      status === 'approved'
        ? 'approved'
        : status === 'rejected'
          ? 'rejected'
          : 'returned';
    await this.notifications.notifyEmployee(row.requesterId, {
      title: `Approval ${statusLabel}`,
      titleKm:
        status === 'approved'
          ? 'ការអនុម័តបានអនុម័ត'
          : status === 'rejected'
            ? 'ការអនុម័តត្រូវបានបដិសេធ'
            : 'ការអនុម័តត្រូវបានត្រឡប់',
      message: row.summary
        ? `${row.summary} was ${statusLabel}.`
        : `Your ${row.type} request was ${statusLabel}.`,
      messageKm: row.summary
        ? `${row.summary} ត្រូវបាន${statusLabel}.`
        : `សំណើ ${row.type} របស់អ្នកត្រូវបាន${statusLabel}.`,
      type: status === 'approved' ? 'success' : 'warning',
      link: '/approvals',
      approvalRequestId: row.id,
    });

    return this.map(updated);
  }

  private async applyP11Decision(
    row: { type: string; relatedId: string | null },
    status: ApprovalStatus,
    actorId: string,
  ) {
    if (!row.relatedId) return;
    const id = row.relatedId;
    const decidedAt = new Date();
    if (row.type === 'attendance_correction') {
      await this.applyAttendanceCorrection(id, status, actorId, decidedAt);
    } else if (row.type === 'shift_swap') {
      await this.applyStatusOnly(
        'shiftSwapRequest',
        id,
        status,
        actorId,
        decidedAt,
      );
    } else if (row.type === 'profile_change') {
      await this.applyProfileChange(id, status, actorId, decidedAt);
    } else if (row.type === 'org_change') {
      await this.applyOrgChange(id, status, actorId, decidedAt);
    } else if (row.type === 'staffing') {
      await this.applyStatusOnly(
        'staffingRequest',
        id,
        status,
        actorId,
        decidedAt,
      );
    }
  }

  private parsePunch(ymd: string, value: string): Date {
    const trimmed = value.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return new Date(`${ymd}T${trimmed}:00+07:00`);
    }
    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return new Date(`${ymd}T${trimmed}+07:00`);
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid punch time: ${value}`);
    }
    return parsed;
  }

  private async applyAttendanceCorrection(
    id: string,
    status: ApprovalStatus,
    actorId: string,
    decidedAt: Date,
  ) {
    const correction = await this.prisma.attendanceCorrection.findUnique({
      where: { id },
    });
    if (!correction) throw new NotFoundException('Attendance correction not found');
    if (correction.status !== 'pending') {
      throw new BadRequestException(`Correction already ${correction.status}`);
    }
    if (status !== 'approved') {
      await this.prisma.attendanceCorrection.update({
        where: { id },
        data: { status, decidedAt, decidedById: actorId },
      });
      return;
    }
    const ymd = correction.date.toISOString().slice(0, 10);
    const checkIn = this.parsePunch(ymd, correction.correctCheckIn);
    const checkOut = this.parsePunch(ymd, correction.correctCheckOut);
    if (checkOut.getTime() < checkIn.getTime()) {
      throw new BadRequestException('correctCheckOut is before correctCheckIn');
    }
    const hoursWorked =
      Math.round(((checkOut.getTime() - checkIn.getTime()) / 3_600_000) * 100) /
      100;
    const overtimeHours = Math.max(0, Math.round((hoursWorked - 8) * 100) / 100);
    await this.prisma.$transaction([
      this.prisma.attendanceDay.upsert({
        where: {
          employeeId_date: { employeeId: correction.employeeId, date: ymd },
        },
        create: {
          employeeId: correction.employeeId,
          date: ymd,
          checkIn,
          checkOut,
          hoursWorked,
          overtimeHours,
          status: 'present',
          timezone: 'Asia/Phnom_Penh',
        },
        update: { checkIn, checkOut, hoursWorked, overtimeHours },
      }),
      this.prisma.attendanceCorrection.update({
        where: { id },
        data: { status: 'approved', decidedAt, decidedById: actorId },
      }),
    ]);
  }

  private async applyStatusOnly(
    model: 'shiftSwapRequest' | 'staffingRequest',
    id: string,
    status: ApprovalStatus,
    actorId: string,
    decidedAt: Date,
  ) {
    const delegate = this.prisma[model] as unknown as {
      findUnique: (args: { where: { id: string } }) => Promise<{ status: string } | null>;
      update: (args: {
        where: { id: string };
        data: { status: string; decidedAt: Date; decidedById: string };
      }) => Promise<unknown>;
    };
    const current = await delegate.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Request not found');
    if (current.status !== 'pending') {
      throw new BadRequestException(`Request already ${current.status}`);
    }
    const next =
      status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'returned';
    await delegate.update({
      where: { id },
      data: { status: next, decidedAt, decidedById: actorId },
    });
  }

  private async applyProfileChange(
    id: string,
    status: ApprovalStatus,
    actorId: string,
    decidedAt: Date,
  ) {
    const request = await this.prisma.profileChangeRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Profile change not found');
    if (request.status !== 'pending') {
      throw new BadRequestException(`Profile change already ${request.status}`);
    }
    if (status !== 'approved') {
      await this.prisma.profileChangeRequest.update({
        where: { id },
        data: { status, decidedAt, decidedById: actorId },
      });
      return;
    }
    const fields =
      request.fields && typeof request.fields === 'object' && !Array.isArray(request.fields)
        ? (request.fields as Record<string, unknown>)
        : {};
    const allowed = [
      'bankAccount',
      'bankName',
      'address',
      'idNumber',
      'phone',
      'gender',
      'nationality',
      'nssfNumber',
      'firstName',
      'lastName',
      'email',
      'avatarUrl',
      'avatarColor',
    ] as const;
    const data: Prisma.EmployeeUpdateInput = {};
    for (const key of allowed) {
      if (fields[key] != null && fields[key] !== '') {
        data[key] = String(fields[key]);
      }
    }
    if (typeof fields.dateOfBirth === 'string' && fields.dateOfBirth) {
      data.dateOfBirth = new Date(fields.dateOfBirth.slice(0, 10));
    }
    const emergencyKeys = Object.keys(fields).filter((key) =>
      key.startsWith('emergency'),
    );
    if (emergencyKeys.length > 0) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: request.employeeId },
        select: { emergencyContact: true },
      });
      const current =
        employee?.emergencyContact &&
        typeof employee.emergencyContact === 'object' &&
        !Array.isArray(employee.emergencyContact)
          ? { ...(employee.emergencyContact as Record<string, unknown>) }
          : {};
      for (const key of emergencyKeys) {
        const value = fields[key];
        if (
          key === 'emergencyContact' &&
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          Object.assign(current, value);
        } else {
          current[key] = value;
        }
      }
      data.emergencyContact = current as Prisma.InputJsonValue;
    }
    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.employee.update({
          where: { id: request.employeeId },
          data,
        });
      }
      await tx.profileChangeRequest.update({
        where: { id },
        data: { status: 'approved', decidedAt, decidedById: actorId },
      });
    });
  }

  private async applyOrgChange(
    id: string,
    status: ApprovalStatus,
    actorId: string,
    decidedAt: Date,
  ) {
    const request = await this.prisma.orgChangeRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Org change not found');
    if (request.status !== 'pending') {
      throw new BadRequestException(`Org change already ${request.status}`);
    }
    if (status !== 'approved') {
      await this.prisma.orgChangeRequest.update({
        where: { id },
        data: { status, decidedAt, decidedById: actorId },
      });
      return;
    }
    const data: Prisma.EmployeeUpdateInput = {};
    if (request.newDepartmentId) {
      data.department = { connect: { id: request.newDepartmentId } };
    }
    if (request.newPositionId) {
      data.position = { connect: { id: request.newPositionId } };
    }
    if (request.newManagerId) {
      data.manager = { connect: { id: request.newManagerId } };
    }
    if (request.newBaseSalary != null) {
      data.baseSalary = request.newBaseSalary;
    }
    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.employee.update({
          where: { id: request.employeeId },
          data,
        });
      }
      await tx.orgChangeRequest.update({
        where: { id },
        data: {
          status: 'applied',
          appliedAt: decidedAt,
          decidedAt,
          decidedById: actorId,
        },
      });
    });
  }

  private async applyExpenseDecision(
    relatedId: string | null,
    status: ApprovalStatus,
    actorId: string,
    note?: string,
  ) {
    if (!relatedId) {
      throw new BadRequestException('Expense approval is missing relatedId');
    }
    const claim = await this.prisma.expenseClaim.findUnique({
      where: { id: relatedId },
    });
    if (!claim) throw new NotFoundException('Expense claim not found');
    if (claim.status !== 'pending' && claim.status !== 'returned') {
      throw new BadRequestException(`Expense claim already ${claim.status}`);
    }
    const next =
      status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'returned';
    await this.prisma.expenseClaim.update({
      where: { id: relatedId },
      data: {
        status: next,
        decidedAt: new Date(),
        decidedById: actorId,
        note: note ?? claim.note,
      },
    });
  }
}
