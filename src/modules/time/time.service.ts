import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import {
  PHNOM_PENH_TZ,
  formatTimePhnomPenh,
  todayYmdPhnomPenh,
} from '../../common/time/phnom-penh';
import { ApprovalsService } from '../approvals/approvals.service';
import {
  CreateAttendanceCorrectionDto,
  CreateShiftSwapDto,
} from './dto/attendance-ops.dto';

@Injectable()
export class TimeService {
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

  private requireEmployeeId(payload: JwtPayload): string {
    if (!payload.employeeId) {
      throw new BadRequestException('User is not linked to an employee');
    }
    return payload.employeeId;
  }

  private mapRow(row: {
    id: string;
    employeeId: string;
    date: string;
    checkIn: Date | null;
    checkOut: Date | null;
    hoursWorked: Prisma.Decimal | null;
    overtimeHours: Prisma.Decimal | null;
    status: string;
    checkInMeta: Prisma.JsonValue | null;
    checkOutMeta: Prisma.JsonValue | null;
    timezone: string;
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      date: row.date,
      checkIn: row.checkIn?.toISOString() ?? null,
      checkOut: row.checkOut?.toISOString() ?? null,
      hoursWorked: row.hoursWorked != null ? Number(row.hoursWorked) : 0,
      overtimeHours: row.overtimeHours != null ? Number(row.overtimeHours) : 0,
      status: row.status,
      checkInMeta: row.checkInMeta,
      checkOutMeta: row.checkOutMeta,
      timezone: row.timezone,
    };
  }

  private calcHours(checkIn: Date, checkOut: Date): number {
    const ms = checkOut.getTime() - checkIn.getTime();
    return Math.round((ms / 3_600_000) * 100) / 100;
  }

  async today(payload: JwtPayload) {
    const employeeId = this.requireEmployeeId(payload);
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'attendance', 'view', {
        employeeId,
      })
    ) {
      throw new ForbiddenException('Missing permission: attendance:view');
    }
    const date = todayYmdPhnomPenh();
    const row = await this.prisma.attendanceDay.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (!row) {
      return {
        id: null,
        employeeId,
        date,
        checkIn: null,
        checkOut: null,
        hoursWorked: 0,
        overtimeHours: 0,
        status: 'present',
        checkInMeta: null,
        checkOutMeta: null,
        timezone: PHNOM_PENH_TZ,
      };
    }
    return this.mapRow(row);
  }

  async checkIn(
    payload: JwtPayload,
    meta?: Prisma.InputJsonValue,
  ) {
    const employeeId = this.requireEmployeeId(payload);
    const user = this.toCurrentUser(payload);
    if (!can(user, 'attendance', 'create', { employeeId })) {
      throw new ForbiddenException('Missing permission: attendance:create');
    }
    const date = todayYmdPhnomPenh();
    const existing = await this.prisma.attendanceDay.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (existing?.checkIn) {
      throw new BadRequestException('Already checked in today');
    }
    const now = new Date();
    const row = await this.prisma.attendanceDay.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: {
        employeeId,
        date,
        checkIn: now,
        status: 'present',
        timezone: PHNOM_PENH_TZ,
        checkInMeta: meta,
      },
      update: {
        checkIn: now,
        checkInMeta: meta,
        status: 'present',
      },
    });
    return this.mapRow(row);
  }

  async checkOut(
    payload: JwtPayload,
    meta?: Prisma.InputJsonValue,
  ) {
    const employeeId = this.requireEmployeeId(payload);
    const user = this.toCurrentUser(payload);
    if (!can(user, 'attendance', 'create', { employeeId })) {
      throw new ForbiddenException('Missing permission: attendance:create');
    }
    const date = todayYmdPhnomPenh();
    const existing = await this.prisma.attendanceDay.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (!existing?.checkIn) {
      throw new BadRequestException('Must check in before check out');
    }
    if (existing.checkOut) {
      throw new BadRequestException('Already checked out today');
    }
    const now = new Date();
    const hoursWorked = this.calcHours(existing.checkIn, now);
    const overtimeHours = Math.max(0, Math.round((hoursWorked - 8) * 100) / 100);
    const row = await this.prisma.attendanceDay.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        checkOutMeta: meta,
        hoursWorked,
        overtimeHours,
      },
    });
    return this.mapRow(row);
  }

  async list(
    payload: JwtPayload,
    query: { from?: string; to?: string; employeeId?: string },
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'attendance', 'view')) {
      return [];
    }
    const where: Prisma.AttendanceDayWhereInput = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = query.from;
      if (query.to) where.date.lte = query.to;
    }
    const rows = await this.prisma.attendanceDay.findMany({
      where,
      orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
      take: 200,
      include: {
        employee: { select: { id: true, departmentId: true, managerId: true } },
      },
    });
    const mapped = rows.map((r) => ({
      ...this.mapRow(r),
      departmentId: r.employee.departmentId ?? undefined,
      managerId: r.employee.managerId,
    }));
    return filterByScope(user, 'attendance', 'view', mapped);
  }

  async getOne(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.attendanceDay.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, departmentId: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Attendance record not found');
    if (
      !can(user, 'attendance', 'view', {
        employeeId: row.employeeId,
        departmentId: row.employee.departmentId ?? undefined,
        managerId: row.employee.managerId,
      })
    ) {
      throw new NotFoundException('Attendance record not found');
    }
    return this.mapRow(row);
  }

  private dateOnly(iso: string): Date {
    return new Date(iso.slice(0, 10));
  }

  private ymd(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private normalizeHm(value: string | null | undefined, fallback: string): string {
    const match = (value ?? '').trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return fallback;
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  private punchHm(value: Date | null): string | null {
    if (!value) return null;
    return formatTimePhnomPenh(value).slice(0, 5);
  }

  async reconcile(
    payload: JwtPayload,
    query: { from?: string; to?: string; employeeId?: string },
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'attendance', 'view')) return { items: [] };
    const settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });
    const workStart = this.normalizeHm(settings?.workStart, '08:00');
    const workEnd = this.normalizeHm(settings?.workEnd, '17:00');
    const where: Prisma.AttendanceDayWhereInput = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = query.from;
      if (query.to) where.date.lte = query.to;
    }
    const rows = await this.prisma.attendanceDay.findMany({
      where,
      orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
      take: 200,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            managerId: true,
          },
        },
      },
    });
    const mapped = rows.map((row) => {
      const checkInHm = this.punchHm(row.checkIn);
      const checkOutHm = this.punchHm(row.checkOut);
      return {
        ...this.mapRow(row),
        employeeName: `${row.employee.firstName} ${row.employee.lastName}`.trim(),
        departmentId: row.employee.departmentId ?? undefined,
        managerId: row.employee.managerId,
        late: checkInHm != null && checkInHm > workStart,
        leftEarly: checkOutHm != null && checkOutHm < workEnd,
      };
    });
    return { items: filterByScope(user, 'attendance', 'view', mapped) };
  }

  private mapCorrection(row: {
    id: string;
    employeeId: string;
    date: Date;
    correctCheckIn: string;
    correctCheckOut: string;
    reason: string;
    status: string;
    submittedAt: Date;
    decidedAt: Date | null;
    decidedById: string | null;
    employee?: {
      departmentId: string | null;
      managerId: string | null;
      firstName?: string;
      lastName?: string;
    };
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      employeeName:
        row.employee?.firstName != null
          ? `${row.employee.firstName} ${row.employee.lastName ?? ''}`.trim()
          : undefined,
      date: this.ymd(row.date),
      correctCheckIn: row.correctCheckIn,
      correctCheckOut: row.correctCheckOut,
      reason: row.reason,
      status: row.status,
      submittedAt: row.submittedAt.toISOString(),
      decidedAt: row.decidedAt?.toISOString() ?? null,
      decidedById: row.decidedById,
      departmentId: row.employee?.departmentId ?? undefined,
      managerId: row.employee?.managerId,
    };
  }

  async listCorrections(payload: JwtPayload, status?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'attendance', 'view')) return { items: [] };
    const rows = await this.prisma.attendanceCorrection.findMany({
      where: status ? { status } : undefined,
      include: {
        employee: {
          select: {
            departmentId: true,
            managerId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });
    return {
      items: filterByScope(
        user,
        'attendance',
        'view',
        rows.map((row) => this.mapCorrection(row)),
      ),
    };
  }

  async createCorrection(dto: CreateAttendanceCorrectionDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const employeeId = dto.employeeId ?? this.requireEmployeeId(payload);
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, lastName: true, departmentId: true, managerId: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    if (
      !can(user, 'attendance', 'create', {
        employeeId,
        departmentId: emp.departmentId ?? undefined,
        managerId: emp.managerId,
      })
    ) {
      throw new ForbiddenException('Missing permission: attendance:create');
    }
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.attendanceCorrection.create({
        data: {
          employeeId,
          date: this.dateOnly(dto.date),
          correctCheckIn: dto.correctCheckIn.trim(),
          correctCheckOut: dto.correctCheckOut.trim(),
          reason: dto.reason,
          status: 'pending',
        },
        include: {
          employee: {
            select: {
              departmentId: true,
              managerId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      await this.approvals.createInTx(tx, {
        type: 'attendance_correction',
        requesterId: employeeId,
        summary: `Attendance correction ${dto.date.slice(0, 10)} for ${emp.firstName} ${emp.lastName}`,
        relatedId: row.id,
        relatedType: 'attendance_correction',
      });
      return this.mapCorrection(row);
    });
  }

  async cancelCorrection(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.attendanceCorrection.findUnique({
      where: { id },
      include: {
        employee: { select: { departmentId: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Attendance correction not found');
    const owner = row.employeeId === payload.employeeId;
    const canEdit = can(user, 'attendance', 'edit', {
      employeeId: row.employeeId,
      departmentId: row.employee.departmentId ?? undefined,
      managerId: row.employee.managerId,
    });
    if (!owner && !canEdit) {
      throw new ForbiddenException('Cannot cancel this correction');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException('Only pending corrections can be cancelled');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.attendanceCorrection.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          employee: {
            select: {
              departmentId: true,
              managerId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      await tx.approvalRequest.updateMany({
        where: {
          relatedId: id,
          type: 'attendance_correction',
          status: 'pending',
        },
        data: {
          status: 'returned',
          note: 'Cancelled by requester',
          decidedAt: new Date(),
          decidedById: payload.employeeId ?? payload.sub,
        },
      });
      return next;
    });
    return this.mapCorrection(updated);
  }

  private mapSwap(row: {
    id: string;
    periodId: string;
    requesterId: string;
    counterpartId: string;
    requesterDate: Date;
    counterpartDate: Date;
    reason: string;
    status: string;
    submittedAt: Date;
    decidedAt: Date | null;
    decidedById: string | null;
    requester?: {
      firstName: string;
      lastName: string;
      departmentId: string | null;
      managerId: string | null;
    };
    counterpart?: {
      firstName: string;
      lastName: string;
      departmentId: string | null;
      managerId: string | null;
    };
  }) {
    return {
      id: row.id,
      periodId: row.periodId,
      requesterId: row.requesterId,
      employeeId: row.requesterId,
      requesterName: row.requester
        ? `${row.requester.firstName} ${row.requester.lastName}`.trim()
        : undefined,
      counterpartId: row.counterpartId,
      counterpartName: row.counterpart
        ? `${row.counterpart.firstName} ${row.counterpart.lastName}`.trim()
        : undefined,
      requesterDate: this.ymd(row.requesterDate),
      counterpartDate: this.ymd(row.counterpartDate),
      reason: row.reason,
      status: row.status,
      submittedAt: row.submittedAt.toISOString(),
      decidedAt: row.decidedAt?.toISOString() ?? null,
      decidedById: row.decidedById,
      departmentId: row.requester?.departmentId ?? undefined,
      managerId: row.requester?.managerId,
      counterpartDepartmentId: row.counterpart?.departmentId ?? undefined,
      counterpartManagerId: row.counterpart?.managerId,
    };
  }

  async listShiftSwaps(payload: JwtPayload, status?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'attendance', 'view')) return { items: [] };
    const rows = await this.prisma.shiftSwapRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
            departmentId: true,
            managerId: true,
          },
        },
        counterpart: {
          select: {
            firstName: true,
            lastName: true,
            departmentId: true,
            managerId: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });
    const mapped = rows.map((row) => this.mapSwap(row));
    const asRequester = filterByScope(user, 'attendance', 'view', mapped);
    const asCounterpart = filterByScope(
      user,
      'attendance',
      'view',
      mapped.map((row) => ({
        ...row,
        employeeId: row.counterpartId,
        departmentId: row.counterpartDepartmentId,
        managerId: row.counterpartManagerId,
      })),
    );
    const ids = new Set(
      [...asRequester, ...asCounterpart].map((row) => row.id),
    );
    return { items: mapped.filter((row) => ids.has(row.id)) };
  }

  async createShiftSwap(dto: CreateShiftSwapDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const requesterId = this.requireEmployeeId(payload);
    if (dto.counterpartId === requesterId) {
      throw new BadRequestException('Counterpart must be a different employee');
    }
    if (!can(user, 'attendance', 'create', { employeeId: requesterId })) {
      throw new ForbiddenException('Missing permission: attendance:create');
    }
    const [period, counterpart] = await Promise.all([
      this.prisma.rosterPeriod.findUnique({ where: { id: dto.periodId } }),
      this.prisma.employee.findUnique({
        where: { id: dto.counterpartId },
        select: { id: true, firstName: true, lastName: true },
      }),
    ]);
    if (!period) throw new NotFoundException('Roster period not found');
    if (!counterpart) throw new NotFoundException('Counterpart not found');
    const requester = await this.prisma.employee.findUnique({
      where: { id: requesterId },
      select: { firstName: true, lastName: true },
    });
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.shiftSwapRequest.create({
        data: {
          periodId: dto.periodId,
          requesterId,
          counterpartId: dto.counterpartId,
          requesterDate: this.dateOnly(dto.requesterDate),
          counterpartDate: this.dateOnly(dto.counterpartDate),
          reason: dto.reason,
          status: 'pending',
        },
        include: {
          requester: {
            select: {
              firstName: true,
              lastName: true,
              departmentId: true,
              managerId: true,
            },
          },
          counterpart: {
            select: {
              firstName: true,
              lastName: true,
              departmentId: true,
              managerId: true,
            },
          },
        },
      });
      await this.approvals.createInTx(tx, {
        type: 'shift_swap',
        requesterId,
        summary: `Shift swap ${requester?.firstName ?? ''} ↔ ${counterpart.firstName}`.trim(),
        relatedId: row.id,
        relatedType: 'shift_swap',
      });
      return this.mapSwap(row);
    });
  }

  async cancelShiftSwap(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.shiftSwapRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { departmentId: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Shift swap not found');
    const owner = row.requesterId === payload.employeeId;
    const canEdit = can(user, 'attendance', 'edit', {
      employeeId: row.requesterId,
      departmentId: row.requester.departmentId ?? undefined,
      managerId: row.requester.managerId,
    });
    if (!owner && !canEdit) {
      throw new ForbiddenException('Cannot cancel this shift swap');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException('Only pending shift swaps can be cancelled');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.shiftSwapRequest.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          requester: {
            select: {
              firstName: true,
              lastName: true,
              departmentId: true,
              managerId: true,
            },
          },
          counterpart: {
            select: {
              firstName: true,
              lastName: true,
              departmentId: true,
              managerId: true,
            },
          },
        },
      });
      await tx.approvalRequest.updateMany({
        where: { relatedId: id, type: 'shift_swap', status: 'pending' },
        data: {
          status: 'returned',
          note: 'Cancelled by requester',
          decidedAt: new Date(),
          decidedById: payload.employeeId ?? payload.sub,
        },
      });
      return next;
    });
    return this.mapSwap(updated);
  }
}
