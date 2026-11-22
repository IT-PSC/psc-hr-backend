import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { PayslipListQueryDto, UpsertPayslipDto } from './dto/payslip.dto';

@Injectable()
export class PayslipsService {
  constructor(private readonly prisma: PrismaService) {}

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
    month: string;
    baseSalary: Prisma.Decimal;
    allowances: Prisma.Decimal;
    overtime: Prisma.Decimal;
    deductions: Prisma.Decimal;
    netPay: Prisma.Decimal;
    status: string;
    workedDays: Prisma.Decimal | null;
    unpaidLeaveDays: Prisma.Decimal | null;
    otHours: Prisma.Decimal | null;
    tax: Prisma.Decimal | null;
    nssfEmployee: Prisma.Decimal | null;
    nssfEmployer: Prisma.Decimal | null;
    published: boolean;
    runId: string | null;
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      month: row.month,
      baseSalary: Number(row.baseSalary),
      allowances: Number(row.allowances),
      overtime: Number(row.overtime),
      deductions: Number(row.deductions),
      netPay: Number(row.netPay),
      status: row.status,
      workedDays: row.workedDays != null ? Number(row.workedDays) : undefined,
      unpaidLeaveDays:
        row.unpaidLeaveDays != null ? Number(row.unpaidLeaveDays) : undefined,
      otHours: row.otHours != null ? Number(row.otHours) : undefined,
      tax: row.tax != null ? Number(row.tax) : undefined,
      nssfEmployee:
        row.nssfEmployee != null ? Number(row.nssfEmployee) : undefined,
      nssfEmployer:
        row.nssfEmployer != null ? Number(row.nssfEmployer) : undefined,
      published: row.published,
      runId: row.runId ?? undefined,
    };
  }

  async list(payload: JwtPayload, query: PayslipListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'payslip', 'view')) return { items: [] };
    const where: Prisma.PayslipWhereInput = {};
    if (query.month) where.month = query.month;
    if (query.employeeId) where.employeeId = query.employeeId;
    // employees only see published/paid own slips unless HR
    const company = ['hr', 'system_admin', 'finance_manager'].some((r) =>
      user.roles.includes(r as never),
    );
    if (!company) {
      where.employeeId = payload.employeeId ?? '__none__';
      where.OR = [{ published: true }, { status: 'paid' }, { status: 'published' }];
    }
    const rows = await this.prisma.payslip.findMany({
      where,
      orderBy: [{ month: 'desc' }, { employeeId: 'asc' }],
      take: 500,
    });
    return {
      items: filterByScope(
        user,
        'payslip',
        'view',
        rows.map((r) => this.map(r)),
      ),
    };
  }

  async upsert(dto: UpsertPayslipDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'payroll', 'edit') && !can(user, 'payroll', 'create')) {
      throw new ForbiddenException('Missing permission: payroll:edit');
    }
    const base = dto.baseSalary ?? 0;
    const allowances = dto.allowances ?? 0;
    const overtime = dto.overtime ?? 0;
    const deductions = dto.deductions ?? 0;
    const netPay =
      dto.netPay ?? base + allowances + overtime - deductions;
    const row = await this.prisma.payslip.upsert({
      where: {
        employeeId_month: { employeeId: dto.employeeId, month: dto.month },
      },
      create: {
        employeeId: dto.employeeId,
        month: dto.month,
        baseSalary: base,
        allowances,
        overtime,
        deductions,
        netPay,
        workedDays: dto.workedDays,
        otHours: dto.otHours,
        tax: dto.tax,
        status: 'draft',
      },
      update: {
        baseSalary: dto.baseSalary,
        allowances: dto.allowances,
        overtime: dto.overtime,
        deductions: dto.deductions,
        netPay,
        workedDays: dto.workedDays,
        otHours: dto.otHours,
        tax: dto.tax,
      },
    });
    return this.map(row);
  }

  async publishMonth(month: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'payroll', 'edit') && !can(user, 'payroll', 'approve')) {
      throw new ForbiddenException('Missing permission to publish payslips');
    }
    const result = await this.prisma.payslip.updateMany({
      where: { month },
      data: { published: true, status: 'published' },
    });
    return { month, updated: result.count };
  }

  async getOne(id: string, payload: JwtPayload) {
    const row = await this.prisma.payslip.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Payslip not found');
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'payslip', 'view', { employeeId: row.employeeId })
    ) {
      throw new ForbiddenException('Cannot view this payslip');
    }
    return this.map(row);
  }
}
