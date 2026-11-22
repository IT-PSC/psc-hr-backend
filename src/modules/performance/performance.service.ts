import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import {
  CreateCycleDto,
  CreateGoalDto,
  CreateReviewDto,
  UpdateCycleDto,
  UpdateGoalDto,
  UpdateReviewDto,
} from './dto/performance.dto';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  // ── Cycles ────────────────────────────────────────────────────

  async listCycles(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'view')) return { items: [] };
    const rows = await this.prisma.performanceCycle.findMany({
      orderBy: { startDate: 'desc' },
      take: 100,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        ratingScale: r.ratingScale,
        participantIds: r.participantIds,
        createdBy: r.createdBy,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async createCycle(dto: CreateCycleDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'create') && !can(user, 'performance', 'edit')) {
      throw new ForbiddenException('Missing permission: performance:create');
    }
    const row = await this.prisma.performanceCycle.create({
      data: {
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
        ratingScale: dto.ratingScale ?? 5,
        participantIds: dto.participantIds ?? [],
        createdBy: payload.employeeId ?? payload.sub,
        status: 'draft',
      },
    });
    return {
      id: row.id,
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      ratingScale: row.ratingScale,
      participantIds: row.participantIds,
      createdBy: row.createdBy,
    };
  }

  async updateCycle(id: string, dto: UpdateCycleDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'edit') && !can(user, 'performance', 'create')) {
      throw new ForbiddenException('Missing permission: performance:edit');
    }
    const existing = await this.prisma.performanceCycle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Performance cycle not found');
    const row = await this.prisma.performanceCycle.update({
      where: { id },
      data: {
        status: dto.status,
        name: dto.name,
        participantIds: dto.participantIds,
      },
    });
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      participantIds: row.participantIds,
    };
  }

  // ── Goals ─────────────────────────────────────────────────────

  async listGoals(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'view')) return { items: [] };
    const rows = await this.prisma.performanceGoal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'performance',
        'view',
        rows.map((r) => ({
          id: r.id,
          employeeId: r.employeeId,
          cycleId: r.cycleId ?? undefined,
          title: r.title,
          titleKm: r.titleKm ?? undefined,
          progress: r.progress,
          dueDate: r.dueDate ?? undefined,
          status: r.status,
          approvalStatus: r.approvalStatus,
          createdAt: r.createdAt.toISOString(),
        })),
      ),
    };
  }

  async createGoal(dto: CreateGoalDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'edit') && !can(user, 'performance', 'create')) {
      throw new ForbiddenException('Missing permission: performance:edit');
    }
    const row = await this.prisma.performanceGoal.create({
      data: {
        employeeId: dto.employeeId,
        title: dto.title,
        titleKm: dto.titleKm,
        cycleId: dto.cycleId,
        dueDate: dto.dueDate,
      },
    });
    return {
      id: row.id,
      employeeId: row.employeeId,
      title: row.title,
      progress: row.progress,
      status: row.status,
      cycleId: row.cycleId ?? undefined,
    };
  }

  async updateGoal(id: string, dto: UpdateGoalDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'edit')) {
      throw new ForbiddenException('Missing permission: performance:edit');
    }
    const existing = await this.prisma.performanceGoal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Goal not found');
    const row = await this.prisma.performanceGoal.update({
      where: { id },
      data: {
        title: dto.title,
        progress: dto.progress,
        status: dto.status,
        approvalStatus: dto.approvalStatus,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate,
      },
    });
    return {
      id: row.id,
      employeeId: row.employeeId,
      title: row.title,
      progress: row.progress,
      status: row.status,
      approvalStatus: row.approvalStatus,
    };
  }

  // ── Reviews ───────────────────────────────────────────────────

  async listReviews(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'view')) return { items: [] };
    const rows = await this.prisma.performanceReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'performance',
        'view',
        rows.map((r) => ({
          id: r.id,
          employeeId: r.employeeId,
          reviewerId: r.reviewerId ?? undefined,
          cycleId: r.cycleId ?? undefined,
          rating: r.rating ?? undefined,
          selfRating: r.selfRating ?? undefined,
          selfComment: r.selfComment ?? undefined,
          managerComment: r.managerComment ?? undefined,
          status: r.status,
          dueDate: r.dueDate ?? undefined,
          acknowledgedAt: r.acknowledgedAt?.toISOString(),
          createdAt: r.createdAt.toISOString(),
        })),
      ),
    };
  }

  async createReview(dto: CreateReviewDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'edit') && !can(user, 'performance', 'create')) {
      throw new ForbiddenException('Missing permission: performance:edit');
    }
    const row = await this.prisma.performanceReview.create({
      data: {
        employeeId: dto.employeeId,
        reviewerId: dto.reviewerId,
        cycleId: dto.cycleId,
        dueDate: dto.dueDate,
        status: 'draft',
      },
    });
    return {
      id: row.id,
      employeeId: row.employeeId,
      reviewerId: row.reviewerId ?? undefined,
      cycleId: row.cycleId ?? undefined,
      status: row.status,
    };
  }

  async updateReview(id: string, dto: UpdateReviewDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'performance', 'edit')) {
      throw new ForbiddenException('Missing permission: performance:edit');
    }
    const existing = await this.prisma.performanceReview.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Review not found');
    const data: Record<string, unknown> = {
      rating: dto.rating,
      selfRating: dto.selfRating,
      selfComment: dto.selfComment === undefined ? undefined : dto.selfComment,
      managerComment:
        dto.managerComment === undefined ? undefined : dto.managerComment,
      status: dto.status,
      dueDate: dto.dueDate === undefined ? undefined : dto.dueDate,
    };
    if (dto.status === 'acknowledged' && !existing.acknowledgedAt) {
      data.acknowledgedAt = new Date();
    }
    const row = await this.prisma.performanceReview.update({
      where: { id },
      data,
    });
    return {
      id: row.id,
      employeeId: row.employeeId,
      rating: row.rating ?? undefined,
      selfRating: row.selfRating ?? undefined,
      status: row.status,
      managerComment: row.managerComment ?? undefined,
      selfComment: row.selfComment ?? undefined,
    };
  }
}
