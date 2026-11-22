import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { ApprovalsService } from '../approvals/approvals.service';
import { CreateExpenseClaimDto } from './dto/expenses.dto';

type ClaimRow = {
  id: string;
  employeeId: string;
  category: string;
  title: string;
  amount: Prisma.Decimal;
  date: string;
  status: string;
  submittedAt: Date;
  decidedAt: Date | null;
  decidedById: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: { departmentId: string | null; managerId: string | null };
};

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
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

  private map(row: ClaimRow) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      category: row.category,
      title: row.title,
      amount: Number(row.amount),
      date: row.date,
      status: row.status,
      submittedAt: row.submittedAt.toISOString(),
      decidedAt: row.decidedAt?.toISOString(),
      decidedById: row.decidedById ?? undefined,
      note: row.note ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'benefits', 'view')) return { items: [] };
    const rows = await this.prisma.expenseClaim.findMany({
      include: { employee: { select: { departmentId: true, managerId: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 200,
    });
    const mapped = rows.map((row) => ({
      ...this.map(row),
      departmentId: row.employee.departmentId ?? undefined,
      managerId: row.employee.managerId,
    }));
    return {
      items: filterByScope(user, 'benefits', 'view', mapped),
    };
  }

  async create(dto: CreateExpenseClaimDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const employeeId = dto.employeeId ?? payload.employeeId;
    if (!employeeId) throw new BadRequestException('employeeId is required');
    const isSelf = employeeId === payload.employeeId;
    if (isSelf && !can(user, 'benefits', 'view', { employeeId })) {
      throw new ForbiddenException('Missing permission: benefits:view');
    }
    if (!isSelf && !can(user, 'benefits', 'edit', { employeeId })) {
      throw new ForbiddenException('Missing permission: benefits:edit');
    }
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const claim = await this.prisma.$transaction(async (tx) => {
      const created = await tx.expenseClaim.create({
        data: {
          employeeId,
          category: dto.category,
          title: dto.title,
          amount: dto.amount,
          date: dto.date,
          note: dto.note,
          status: 'pending',
        },
      });
      await this.approvals.createInTx(tx, {
        type: 'expense',
        requesterId: payload.employeeId ?? payload.sub,
        summary: `${dto.title} (${dto.amount})`,
        relatedId: created.id,
        relatedType: 'expense',
      });
      return created;
    });
    return this.map(claim);
  }

  async cancel(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.expenseClaim.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Expense claim not found');
    const isOwner = row.employeeId === payload.employeeId;
    if (
      !isOwner &&
      !can(user, 'benefits', 'edit', { employeeId: row.employeeId })
    ) {
      throw new ForbiddenException('Cannot cancel this expense claim');
    }
    if (isOwner && !can(user, 'benefits', 'view', { employeeId: row.employeeId })) {
      throw new ForbiddenException('Cannot cancel this expense claim');
    }
    if (row.status !== 'pending' && row.status !== 'returned') {
      throw new BadRequestException('Only pending or returned claims can be cancelled');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.expenseClaim.update({
        where: { id },
        data: {
          status: 'cancelled',
          decidedAt: new Date(),
          decidedById: payload.employeeId ?? payload.sub,
          note: row.note ?? 'Cancelled',
        },
      });
      await tx.approvalRequest.updateMany({
        where: { type: 'expense', relatedId: id, status: 'pending' },
        data: {
          status: 'returned',
          note: 'Cancelled by requester',
          decidedAt: new Date(),
          decidedById: payload.employeeId ?? payload.sub,
        },
      });
      return claim;
    });
    return this.map(updated);
  }
}
