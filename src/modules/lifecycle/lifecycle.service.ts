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
import { ApprovalsService } from '../approvals/approvals.service';
import {
  CreateResignationDto,
  ExitInterviewDto,
  StartOffboardingDto,
  UpdateOffboardingTaskDto,
} from './dto/lifecycle.dto';

const DEFAULT_OFFBOARDING_TASKS = [
  { label: 'Return company assets', ownerRole: 'hr', kind: 'assets' },
  { label: 'Revoke system access', ownerRole: 'it', kind: 'it' },
  { label: 'Final payroll & entitlements', ownerRole: 'finance', kind: 'payroll' },
  { label: 'Exit interview', ownerRole: 'hr', kind: 'exit_interview' },
  { label: 'Knowledge handover', ownerRole: 'manager', kind: 'handover' },
];

@Injectable()
export class LifecycleService {
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

  private mapResignation(row: {
    id: string;
    employeeId: string;
    lastWorkingDay: string;
    reason: string;
    status: string;
    offboardingCaseId: string | null;
    approvalId: string | null;
    rejectComment: string | null;
    submittedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      lastWorkingDay: row.lastWorkingDay,
      reason: row.reason,
      status: row.status,
      offboardingCaseId: row.offboardingCaseId ?? undefined,
      approvalId: row.approvalId ?? undefined,
      rejectComment: row.rejectComment ?? undefined,
      submittedAt: row.submittedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapOffboardingCase(
    row: {
      id: string;
      employeeId: string;
      startDate: string;
      lastWorkingDay: string;
      status: string;
      progressPercent: number;
      exitInterview: Prisma.JsonValue | null;
      createdAt: Date;
    },
    tasks?: unknown[],
  ) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      startDate: row.startDate,
      lastWorkingDay: row.lastWorkingDay,
      status: row.status,
      progressPercent: row.progressPercent,
      exitInterview: row.exitInterview ?? undefined,
      createdAt: row.createdAt.toISOString(),
      tasks,
    };
  }

  // ── Resignations ──────────────────────────────────────────────

  async listResignations(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'resignation', 'create') && !can(user, 'offboarding', 'view')) {
      return { items: [] };
    }
    const rows = await this.prisma.resignationRequest.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 200,
    });
    const mapped = rows.map((r) => this.mapResignation(r));
    if (can(user, 'offboarding', 'view')) {
      return { items: mapped };
    }
    return {
      items: filterByScope(user, 'resignation', 'create', mapped),
    };
  }

  async createResignation(dto: CreateResignationDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'resignation', 'create')) {
      throw new ForbiddenException('Missing permission: resignation:create');
    }
    const employeeId = dto.employeeId ?? payload.employeeId;
    if (!employeeId) throw new BadRequestException('employeeId required');
    if (
      dto.employeeId &&
      dto.employeeId !== payload.employeeId &&
      !can(user, 'offboarding', 'edit')
    ) {
      throw new ForbiddenException('Cannot submit resignation for this employee');
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.resignationRequest.create({
        data: {
          employeeId,
          lastWorkingDay: dto.lastWorkingDay,
          reason: dto.reason,
          status: 'pending',
        },
      });
      const approval = await this.approvals.createInTx(tx, {
        type: 'resignation',
        requesterId: employeeId,
        summary: `Resignation — last day ${dto.lastWorkingDay}`,
        relatedId: row.id,
        relatedType: 'resignation',
      });
      const updated = await tx.resignationRequest.update({
        where: { id: row.id },
        data: { approvalId: approval.id },
      });
      return this.mapResignation(updated);
    });
  }

  async cancelResignation(id: string, payload: JwtPayload) {
    const row = await this.prisma.resignationRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Resignation request not found');
    const user = this.toCurrentUser(payload);
    const isOwner = row.employeeId === payload.employeeId;
    if (!isOwner && !can(user, 'offboarding', 'edit')) {
      throw new ForbiddenException('Cannot cancel this resignation');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException(`Cannot cancel ${row.status} request`);
    }
    const updated = await this.prisma.resignationRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    if (row.approvalId) {
      await this.prisma.approvalRequest.updateMany({
        where: { id: row.approvalId, status: 'pending' },
        data: { status: 'returned', note: 'Cancelled by requester' },
      });
    }
    return this.mapResignation(updated);
  }

  /** Called from ApprovalsService after approve/reject */
  async applyApprovalDecision(
    id: string,
    status: 'approved' | 'rejected',
    _actorId: string,
    note?: string,
  ) {
    const row = await this.prisma.resignationRequest.findUnique({ where: { id } });
    if (!row) return;
    if (row.status !== 'pending') return;

    if (status === 'rejected') {
      await this.prisma.resignationRequest.update({
        where: { id },
        data: { status: 'rejected', rejectComment: note },
      });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    await this.prisma.$transaction(async (tx) => {
      const offCase = await this.createOffboardingCaseInTx(tx, {
        employeeId: row.employeeId,
        startDate: today,
        lastWorkingDay: row.lastWorkingDay,
      });
      await tx.resignationRequest.update({
        where: { id },
        data: {
          status: 'approved',
          offboardingCaseId: offCase.id,
        },
      });
    });
  }

  // ── Offboarding ───────────────────────────────────────────────

  private async createOffboardingCaseInTx(
    tx: Prisma.TransactionClient,
    input: { employeeId: string; startDate: string; lastWorkingDay: string },
  ) {
    const offCase = await tx.offboardingCase.create({
      data: {
        employeeId: input.employeeId,
        startDate: input.startDate,
        lastWorkingDay: input.lastWorkingDay,
        status: 'in_progress',
        progressPercent: 0,
        tasks: {
          create: DEFAULT_OFFBOARDING_TASKS.map((t) => ({
            label: t.label,
            ownerRole: t.ownerRole,
            kind: t.kind,
          })),
        },
      },
      include: { tasks: true },
    });
    return offCase;
  }

  async listOffboardingCases(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'offboarding', 'view')) return { items: [] };
    const rows = await this.prisma.offboardingCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { _count: { select: { tasks: true } } },
    });
    return {
      items: filterByScope(
        user,
        'offboarding',
        'view',
        rows.map((r) => ({
          ...this.mapOffboardingCase(r),
          taskCount: r._count.tasks,
        })),
      ),
    };
  }

  async getOffboardingCase(id: string, payload: JwtPayload) {
    const row = await this.prisma.offboardingCase.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) throw new NotFoundException('Offboarding case not found');
    const user = this.toCurrentUser(payload);
    if (!can(user, 'offboarding', 'view', { employeeId: row.employeeId })) {
      throw new ForbiddenException('Cannot view this offboarding case');
    }
    return this.mapOffboardingCase(
      row,
      row.tasks.map((t) => ({
        id: t.id,
        caseId: t.caseId,
        label: t.label,
        ownerRole: t.ownerRole,
        kind: t.kind ?? undefined,
        done: t.done,
        completedAt: t.completedAt?.toISOString(),
      })),
    );
  }

  async startOffboarding(dto: StartOffboardingDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'offboarding', 'edit')) {
      throw new ForbiddenException('Missing permission: offboarding:edit');
    }
    const offCase = await this.prisma.$transaction((tx) =>
      this.createOffboardingCaseInTx(tx, dto),
    );
    return this.mapOffboardingCase(
      offCase,
      offCase.tasks.map((t) => ({
        id: t.id,
        caseId: t.caseId,
        label: t.label,
        ownerRole: t.ownerRole,
        kind: t.kind ?? undefined,
        done: t.done,
      })),
    );
  }

  private async recalcOffboardingProgress(caseId: string) {
    const tasks = await this.prisma.offboardingTask.findMany({ where: { caseId } });
    if (!tasks.length) {
      await this.prisma.offboardingCase.update({
        where: { id: caseId },
        data: { progressPercent: 0 },
      });
      return;
    }
    const done = tasks.filter((t) => t.done).length;
    const progressPercent = Math.round((done / tasks.length) * 100);
    await this.prisma.offboardingCase.update({
      where: { id: caseId },
      data: {
        progressPercent,
        status: progressPercent >= 100 ? 'completed' : 'in_progress',
      },
    });
  }

  async updateOffboardingTask(
    id: string,
    dto: UpdateOffboardingTaskDto,
    payload: JwtPayload,
  ) {
    const task = await this.prisma.offboardingTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Offboarding task not found');
    const user = this.toCurrentUser(payload);
    if (!can(user, 'offboarding', 'view') && !can(user, 'offboarding', 'edit')) {
      throw new ForbiddenException('Missing permission: offboarding');
    }
    const updated = await this.prisma.offboardingTask.update({
      where: { id },
      data: {
        done: dto.done,
        completedAt: dto.done ? new Date() : null,
      },
    });
    await this.recalcOffboardingProgress(task.caseId);
    return {
      id: updated.id,
      caseId: updated.caseId,
      label: updated.label,
      done: updated.done,
      completedAt: updated.completedAt?.toISOString(),
    };
  }

  async submitExitInterview(
    caseId: string,
    dto: ExitInterviewDto,
    payload: JwtPayload,
  ) {
    const row = await this.prisma.offboardingCase.findUnique({ where: { id: caseId } });
    if (!row) throw new NotFoundException('Offboarding case not found');
    const user = this.toCurrentUser(payload);
    const isOwner = row.employeeId === payload.employeeId;
    if (!isOwner && !can(user, 'offboarding', 'edit')) {
      throw new ForbiddenException('Cannot submit exit interview');
    }
    const updated = await this.prisma.offboardingCase.update({
      where: { id: caseId },
      data: {
        exitInterview: {
          reason: dto.reason,
          rating: dto.rating,
          feedback: dto.feedback,
          wouldRejoin: dto.wouldRejoin,
          submittedAt: new Date().toISOString(),
        },
      },
    });
    return this.mapOffboardingCase(updated);
  }
}
