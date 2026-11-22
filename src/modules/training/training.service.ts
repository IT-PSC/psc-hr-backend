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
  CreateCourseDto,
  EnrollDto,
  EnrollmentListQueryDto,
  UpdateCourseDto,
  UpdateEnrollmentDto,
} from './dto/training.dto';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private mapCourse(row: {
    id: string;
    title: string;
    titleKm: string | null;
    category: string | null;
    durationHours: Prisma.Decimal | null;
    status: string;
    startDate: string | null;
    trainer: string | null;
    seats: number | null;
    mandatory: boolean;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      title: row.title,
      titleKm: row.titleKm ?? undefined,
      category: row.category ?? undefined,
      durationHours:
        row.durationHours != null ? Number(row.durationHours) : undefined,
      status: row.status,
      startDate: row.startDate ?? undefined,
      trainer: row.trainer ?? undefined,
      seats: row.seats ?? undefined,
      mandatory: row.mandatory,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapEnrollment(row: {
    id: string;
    courseId: string;
    employeeId: string;
    status: string;
    progress: number;
    mandatory: boolean;
    dueDate: string | null;
    assignedBy: string | null;
    completedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      courseId: row.courseId,
      employeeId: row.employeeId,
      status: row.status,
      progress: row.progress,
      mandatory: row.mandatory,
      dueDate: row.dueDate ?? undefined,
      assignedBy: row.assignedBy ?? undefined,
      completedAt: row.completedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listCourses(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'training', 'view')) return { items: [] };
    const rows = await this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { items: rows.map((r) => this.mapCourse(r)) };
  }

  async createCourse(dto: CreateCourseDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'training', 'create') && !can(user, 'training', 'edit')) {
      throw new ForbiddenException('Missing permission: training:create');
    }
    const row = await this.prisma.course.create({
      data: {
        title: dto.title,
        titleKm: dto.titleKm,
        category: dto.category,
        durationHours: dto.durationHours,
        startDate: dto.startDate,
        trainer: dto.trainer,
        seats: dto.seats,
        mandatory: dto.mandatory ?? false,
        status: 'draft',
      },
    });
    return this.mapCourse(row);
  }

  async updateCourse(id: string, dto: UpdateCourseDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'training', 'edit')) {
      throw new ForbiddenException('Missing permission: training:edit');
    }
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');
    const row = await this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        titleKm: dto.titleKm === undefined ? undefined : dto.titleKm,
        category: dto.category === undefined ? undefined : dto.category,
        status: dto.status,
        durationHours: dto.durationHours,
        startDate: dto.startDate === undefined ? undefined : dto.startDate,
        trainer: dto.trainer === undefined ? undefined : dto.trainer,
        seats: dto.seats === undefined ? undefined : dto.seats,
        mandatory: dto.mandatory,
      },
    });
    return this.mapCourse(row);
  }

  async listEnrollments(payload: JwtPayload, query: EnrollmentListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'training', 'view')) return { items: [] };
    const where: Prisma.CourseEnrollmentWhereInput = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.employeeId) where.employeeId = query.employeeId;
    const rows = await this.prisma.courseEnrollment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'training',
        'view',
        rows.map((r) => this.mapEnrollment(r)),
      ),
    };
  }

  async enroll(dto: EnrollDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'training', 'create') &&
      !can(user, 'training', 'edit') &&
      dto.employeeId !== payload.employeeId
    ) {
      throw new ForbiddenException('Missing permission: training:create');
    }
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    const row = await this.prisma.courseEnrollment.create({
      data: {
        courseId: dto.courseId,
        employeeId: dto.employeeId,
        mandatory: dto.mandatory ?? course.mandatory,
        dueDate: dto.dueDate,
        assignedBy: payload.employeeId ?? payload.sub,
        status: 'enrolled',
      },
    });
    return this.mapEnrollment(row);
  }

  async updateEnrollment(
    id: string,
    dto: UpdateEnrollmentDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Enrollment not found');
    const isOwner = existing.employeeId === payload.employeeId;
    if (
      !isOwner &&
      !can(user, 'training', 'edit') &&
      !can(user, 'training', 'approve')
    ) {
      throw new ForbiddenException('Cannot update this enrollment');
    }
    const status =
      dto.status ??
      (dto.progress != null && dto.progress >= 100
        ? 'completed'
        : dto.progress != null && dto.progress > 0
          ? 'in_progress'
          : undefined);
    const row = await this.prisma.courseEnrollment.update({
      where: { id },
      data: {
        progress: dto.progress,
        status,
        completedAt:
          status === 'completed' || (dto.progress != null && dto.progress >= 100)
            ? new Date()
            : undefined,
      },
    });
    return this.mapEnrollment(row);
  }
}
