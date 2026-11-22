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
import { CreateOvertimeDto, OvertimeListQueryDto } from './dto/overtime.dto';

@Injectable()
export class OvertimeService {
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

  private map(row: {
    id: string;
    employeeId: string;
    date: string;
    hours: Prisma.Decimal;
    reason: string;
    status: string;
    otType: string | null;
    category: string | null;
    hoursToPay: Prisma.Decimal | null;
    includeInPayroll: boolean;
    startAt: Date | null;
    endAt: Date | null;
    approverId: string | null;
    approvedAt: Date | null;
    approvalId: string | null;
    rejectComment: string | null;
    submittedAt: Date;
    createdById: string | null;
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      date: row.date,
      hours: Number(row.hours),
      reason: row.reason,
      status: row.status,
      otType: row.otType ?? undefined,
      category: row.category ?? undefined,
      hoursToPay: row.hoursToPay != null ? Number(row.hoursToPay) : undefined,
      includeInPayroll: row.includeInPayroll,
      startAt: row.startAt?.toISOString(),
      endAt: row.endAt?.toISOString(),
      approverId: row.approverId ?? undefined,
      approvedAt: row.approvedAt?.toISOString(),
      approvalId: row.approvalId ?? undefined,
      rejectComment: row.rejectComment ?? undefined,
      submittedAt: row.submittedAt.toISOString(),
      createdById: row.createdById ?? undefined,
    };
  }

  async list(payload: JwtPayload, query: OvertimeListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'overtime', 'view')) return { items: [] };
    const where: Prisma.OvertimeRequestWhereInput = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    const rows = await this.prisma.overtimeRequest.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'overtime',
        'view',
        rows.map((r) => this.map(r)),
      ),
    };
  }

  async create(dto: CreateOvertimeDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'overtime', 'create')) {
      throw new ForbiddenException('Missing permission: overtime:create');
    }
    const employeeId = dto.employeeId ?? payload.employeeId;
    if (!employeeId) throw new BadRequestException('employeeId required');
    if (
      dto.employeeId &&
      dto.employeeId !== payload.employeeId &&
      !can(user, 'overtime', 'create', { employeeId: dto.employeeId })
    ) {
      throw new ForbiddenException('Cannot create OT for this employee');
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.overtimeRequest.create({
        data: {
          employeeId,
          date: dto.date,
          hours: dto.hours,
          reason: dto.reason,
          otType: dto.otType,
          category: dto.category,
          hoursToPay: dto.hoursToPay ?? dto.hours,
          includeInPayroll: dto.includeInPayroll ?? true,
          status: 'pending',
          createdById: payload.employeeId ?? payload.sub,
        },
      });
      const approval = await this.approvals.createInTx(tx, {
        type: 'overtime',
        requesterId: employeeId,
        summary: `OT ${dto.hours}h on ${dto.date}`,
        relatedId: row.id,
        relatedType: 'overtime',
      });
      const updated = await tx.overtimeRequest.update({
        where: { id: row.id },
        data: { approvalId: approval.id },
      });
      return this.map(updated);
    });
  }

  async cancel(id: string, payload: JwtPayload) {
    const row = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Overtime request not found');
    const user = this.toCurrentUser(payload);
    const isOwner = row.employeeId === payload.employeeId;
    if (!isOwner && !can(user, 'overtime', 'approve')) {
      throw new ForbiddenException('Cannot cancel this request');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException(`Cannot cancel ${row.status} request`);
    }
    const updated = await this.prisma.overtimeRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    if (row.approvalId) {
      await this.prisma.approvalRequest.updateMany({
        where: { id: row.approvalId, status: 'pending' },
        data: { status: 'returned', note: 'Cancelled by requester' },
      });
    }
    return this.map(updated);
  }

  async applyApprovalDecision(
    id: string,
    status: 'approved' | 'rejected',
    actorId: string,
    note?: string,
  ) {
    const row = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!row) return;
    if (row.status !== 'pending') return;
    await this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status,
        approverId: actorId,
        approvedAt: status === 'approved' ? new Date() : undefined,
        rejectComment: status === 'rejected' ? note : undefined,
      },
    });
  }
}
