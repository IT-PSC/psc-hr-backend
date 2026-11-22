import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import {
  StartOnboardingDto,
  UpdateOnboardingCaseDto,
  UpdateOnboardingTaskDto,
  UpsertTemplateDto,
} from './dto/onboarding.dto';

const DEFAULT_TASKS = [
  { title: 'Complete personal info form', category: 'preboarding', priority: 'high', required: true, weight: 1 },
  { title: 'IT account setup', category: 'it', priority: 'high', required: true, weight: 2 },
  { title: 'Manager welcome meeting', category: 'manager', priority: 'medium', required: true, weight: 1 },
  { title: 'HR orientation', category: 'hr', priority: 'medium', required: true, weight: 1 },
];

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private mapCase(
    row: {
      id: string;
      employeeId: string;
      templateId: string | null;
      joiningDate: string;
      stage: string;
      status: string;
      progressPercent: number;
      managerId: string | null;
      departmentId: string | null;
      createdAt: Date;
    },
    tasks?: unknown[],
  ) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      templateId: row.templateId ?? undefined,
      joiningDate: row.joiningDate,
      stage: row.stage,
      status: row.status,
      progressPercent: row.progressPercent,
      managerId: row.managerId ?? undefined,
      departmentId: row.departmentId ?? undefined,
      createdAt: row.createdAt.toISOString(),
      tasks,
    };
  }

  private async recalcProgress(caseId: string) {
    const tasks = await this.prisma.onboardingTask.findMany({ where: { caseId } });
    if (!tasks.length) {
      await this.prisma.onboardingCase.update({
        where: { id: caseId },
        data: { progressPercent: 0 },
      });
      return 0;
    }
    const totalWeight = tasks.reduce((s, t) => s + t.weight, 0) || 1;
    const doneWeight = tasks
      .filter((t) => t.status === 'completed' || t.status === 'skipped')
      .reduce((s, t) => s + t.weight, 0);
    const progressPercent = Math.round((doneWeight / totalWeight) * 100);
    const allDone = tasks.every(
      (t) => t.status === 'completed' || t.status === 'skipped' || !t.required,
    );
    await this.prisma.onboardingCase.update({
      where: { id: caseId },
      data: {
        progressPercent,
        status: allDone
          ? 'completed'
          : progressPercent > 0
            ? 'in_progress'
            : 'not_started',
        stage: allDone ? 'completed' : undefined,
      },
    });
    return progressPercent;
  }

  async listTemplates() {
    const rows = await this.prisma.onboardingTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        nameKm: r.nameKm,
        active: r.active,
        taskDefs: r.taskDefs,
      })),
    };
  }

  async upsertTemplate(dto: UpsertTemplateDto, payload: JwtPayload, id?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'onboarding', 'create') && !can(user, 'onboarding', 'edit')) {
      throw new ForbiddenException('Missing permission: onboarding:edit');
    }
    if (id) {
      const row = await this.prisma.onboardingTemplate.update({
        where: { id },
        data: {
          name: dto.name,
          nameKm: dto.nameKm,
          active: dto.active ?? true,
          taskDefs: dto.taskDefs as Prisma.InputJsonValue,
        },
      });
      return { id: row.id, name: row.name, active: row.active };
    }
    const row = await this.prisma.onboardingTemplate.create({
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        active: dto.active ?? true,
        taskDefs: dto.taskDefs as Prisma.InputJsonValue,
      },
    });
    return { id: row.id, name: row.name, active: row.active };
  }

  async listCases(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'onboarding', 'view')) return { items: [] };
    const rows = await this.prisma.onboardingCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { _count: { select: { tasks: true } } },
    });
    return {
      items: filterByScope(
        user,
        'onboarding',
        'view',
        rows.map((r) => ({
          ...this.mapCase(r),
          taskCount: r._count.tasks,
        })),
      ),
    };
  }

  async getCase(id: string, payload: JwtPayload) {
    const row = await this.prisma.onboardingCase.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) throw new NotFoundException('Onboarding case not found');
    const user = this.toCurrentUser(payload);
    if (!can(user, 'onboarding', 'view', { employeeId: row.employeeId })) {
      throw new ForbiddenException('Cannot view this onboarding case');
    }
    return this.mapCase(
      row,
      row.tasks.map((t) => ({
        id: t.id,
        caseId: t.caseId,
        title: t.title,
        category: t.category,
        assigneeId: t.assigneeId,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
        required: t.required,
        weight: t.weight,
        completedAt: t.completedAt?.toISOString(),
      })),
    );
  }

  async start(dto: StartOnboardingDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'onboarding', 'create') && !can(user, 'onboarding', 'edit')) {
      throw new ForbiddenException('Missing permission: onboarding:create');
    }
    let taskDefs = DEFAULT_TASKS as Array<Record<string, unknown>>;
    if (dto.templateId) {
      const tmpl = await this.prisma.onboardingTemplate.findUnique({
        where: { id: dto.templateId },
      });
      if (tmpl && Array.isArray(tmpl.taskDefs)) {
        taskDefs = tmpl.taskDefs as Array<Record<string, unknown>>;
      }
    }

    const emp = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    const created = await this.prisma.$transaction(async (tx) => {
      const cse = await tx.onboardingCase.create({
        data: {
          employeeId: dto.employeeId,
          templateId: dto.templateId,
          joiningDate: dto.joiningDate,
          managerId: dto.managerId ?? emp.managerId,
          departmentId: dto.departmentId ?? emp.departmentId,
          status: 'in_progress',
          stage: 'preboarding',
        },
      });
      for (const def of taskDefs) {
        await tx.onboardingTask.create({
          data: {
            caseId: cse.id,
            title: String(def.title ?? 'Task'),
            category: String(def.category ?? 'hr'),
            priority: String(def.priority ?? 'medium'),
            required: def.required !== false,
            weight: Number(def.weight ?? 1),
            status: 'pending',
          },
        });
      }
      return cse;
    });
    return this.getCase(created.id, payload);
  }

  async updateCase(
    id: string,
    dto: UpdateOnboardingCaseDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'onboarding', 'edit')) {
      throw new ForbiddenException('Missing permission: onboarding:edit');
    }
    const existing = await this.prisma.onboardingCase.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Onboarding case not found');
    const row = await this.prisma.onboardingCase.update({
      where: { id },
      data: { stage: dto.stage, status: dto.status },
    });
    return this.mapCase(row);
  }

  async updateTask(
    id: string,
    dto: UpdateOnboardingTaskDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    const task = await this.prisma.onboardingTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    const cse = await this.prisma.onboardingCase.findUnique({
      where: { id: task.caseId },
    });
    const isAssignee = task.assigneeId === payload.employeeId;
    const isOwner = cse?.employeeId === payload.employeeId;
    if (
      !can(user, 'onboarding', 'edit') &&
      !isAssignee &&
      !isOwner
    ) {
      throw new ForbiddenException('Cannot update this task');
    }
    const completed =
      dto.status === 'completed' || dto.status === 'skipped'
        ? new Date()
        : dto.status
          ? null
          : undefined;
    const row = await this.prisma.onboardingTask.update({
      where: { id },
      data: {
        status: dto.status,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate,
        completedAt: completed,
      },
    });
    await this.recalcProgress(task.caseId);
    return {
      id: row.id,
      status: row.status,
      completedAt: row.completedAt?.toISOString(),
    };
  }
}
