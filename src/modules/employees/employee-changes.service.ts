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
import type { CurrentUser, JwtPayload, PermissionTarget } from '../../common/roles/types';
import { ApprovalsService } from '../approvals/approvals.service';
import {
  ChangeListQueryDto,
  CreateOrgChangeDto,
  CreateProfileChangeDto,
} from './dto/employee-changes.dto';

const PROFILE_COLUMNS = [
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

type ProfileColumn = (typeof PROFILE_COLUMNS)[number];

const employeeScopeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  departmentId: true,
  managerId: true,
  bankAccount: true,
  bankName: true,
  address: true,
  idNumber: true,
  phone: true,
  gender: true,
  nationality: true,
  nssfNumber: true,
  email: true,
  avatarUrl: true,
  avatarColor: true,
  dateOfBirth: true,
  emergencyContact: true,
} as const;

function ymd(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

@Injectable()
export class EmployeeChangesService {
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

  private targetOf(emp: {
    id: string;
    departmentId: string | null;
    managerId: string | null;
  }): PermissionTarget {
    return {
      employeeId: emp.id,
      departmentId: emp.departmentId ?? undefined,
      managerId: emp.managerId,
    };
  }

  private mapProfile(row: {
    id: string;
    employeeId: string;
    fields: Prisma.JsonValue;
    previousValues: Prisma.JsonValue;
    status: string;
    submittedAt: Date;
    decidedAt: Date | null;
    decidedById: string | null;
    employee?: {
      departmentId: string | null;
      managerId: string | null;
      firstName: string;
      lastName: string;
    };
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      employeeName: row.employee
        ? `${row.employee.firstName} ${row.employee.lastName}`.trim()
        : undefined,
      fields: row.fields,
      previousValues: row.previousValues,
      status: row.status,
      submittedAt: row.submittedAt.toISOString(),
      decidedAt: row.decidedAt?.toISOString() ?? null,
      decidedById: row.decidedById,
      departmentId: row.employee?.departmentId ?? undefined,
      managerId: row.employee?.managerId,
    };
  }

  private mapOrg(row: {
    id: string;
    employeeId: string;
    kind: string;
    proposedBy: string;
    effectiveDate: Date;
    newDepartmentId: string | null;
    newPositionId: string | null;
    newManagerId: string | null;
    newBaseSalary: Prisma.Decimal | null;
    reason: string;
    status: string;
    appliedAt: Date | null;
    decidedAt: Date | null;
    decidedById: string | null;
    submittedAt?: Date;
    employee?: {
      departmentId: string | null;
      managerId: string | null;
      firstName: string;
      lastName: string;
    };
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      employeeName: row.employee
        ? `${row.employee.firstName} ${row.employee.lastName}`.trim()
        : undefined,
      kind: row.kind,
      proposedBy: row.proposedBy,
      effectiveDate: ymd(row.effectiveDate),
      newDepartmentId: row.newDepartmentId,
      newPositionId: row.newPositionId,
      newManagerId: row.newManagerId,
      newBaseSalary:
        row.newBaseSalary != null ? Number(row.newBaseSalary) : null,
      reason: row.reason,
      status: row.status,
      appliedAt: row.appliedAt?.toISOString() ?? null,
      decidedAt: row.decidedAt?.toISOString() ?? null,
      decidedById: row.decidedById,
      departmentId: row.employee?.departmentId ?? undefined,
      managerId: row.employee?.managerId,
    };
  }

  async listProfile(payload: JwtPayload, query: ChangeListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employees', 'view')) return { items: [] };
    const rows = await this.prisma.profileChangeRequest.findMany({
      where: {
        status: query.status,
        employeeId: query.employeeId,
      },
      include: { employee: { select: employeeScopeSelect } },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });
    const mapped = rows.map((row) => this.mapProfile(row));
    return { items: filterByScope(user, 'employees', 'view', mapped) };
  }

  async createProfile(dto: CreateProfileChangeDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const employeeId = dto.employeeId ?? payload.employeeId;
    if (!employeeId) throw new BadRequestException('employeeId required');
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: employeeScopeSelect,
    });
    if (!emp) throw new NotFoundException('Employee not found');
    const target = this.targetOf(emp);
    if (
      !can(user, 'profile', 'edit', target) &&
      !can(user, 'employees', 'edit', target)
    ) {
      throw new ForbiddenException('Missing permission to change this profile');
    }

    const fields = dto.fields;
    const applicable = Object.keys(fields).filter(
      (key) =>
        (PROFILE_COLUMNS as readonly string[]).includes(key) ||
        key === 'dateOfBirth' ||
        key.startsWith('emergency'),
    );
    if (applicable.length === 0) {
      throw new BadRequestException(
        'No applicable profile fields. Allowed: bank/contact columns, dateOfBirth, emergency*',
      );
    }

    const previous: Record<string, unknown> = {};
    for (const key of applicable) {
      if (key === 'dateOfBirth') {
        previous.dateOfBirth = emp.dateOfBirth
          ? ymd(emp.dateOfBirth)
          : null;
      } else if (key.startsWith('emergency')) {
        previous[key] = key === 'emergencyContact'
          ? emp.emergencyContact
          : asRecord(emp.emergencyContact)[key] ?? null;
      } else {
        previous[key] = emp[key as ProfileColumn];
      }
    }

    const stored: Record<string, unknown> = {};
    for (const key of applicable) stored[key] = fields[key];

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.profileChangeRequest.create({
        data: {
          employeeId,
          fields: stored as Prisma.InputJsonValue,
          previousValues: previous as Prisma.InputJsonValue,
          status: 'pending',
        },
        include: { employee: { select: employeeScopeSelect } },
      });
      await this.approvals.createInTx(tx, {
        type: 'profile_change',
        requesterId: employeeId,
        summary: `Profile change for ${emp.firstName} ${emp.lastName}`,
        relatedId: row.id,
        relatedType: 'profile_change',
      });
      return this.mapProfile(row);
    });
  }

  async cancelProfile(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.profileChangeRequest.findUnique({
      where: { id },
      include: { employee: { select: employeeScopeSelect } },
    });
    if (!row) throw new NotFoundException('Profile change not found');
    const target = this.targetOf(row.employee);
    const owner = row.employeeId === payload.employeeId;
    if (!owner && !can(user, 'employees', 'edit', target)) {
      throw new ForbiddenException('Cannot cancel this profile change');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.profileChangeRequest.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { employee: { select: employeeScopeSelect } },
      });
      await tx.approvalRequest.updateMany({
        where: { relatedId: id, type: 'profile_change', status: 'pending' },
        data: {
          status: 'returned',
          note: 'Cancelled by requester',
          decidedAt: new Date(),
          decidedById: payload.employeeId ?? payload.sub,
        },
      });
      return next;
    });
    return this.mapProfile(updated);
  }

  async listOrg(payload: JwtPayload, query: ChangeListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employees', 'view')) return { items: [] };
    const rows = await this.prisma.orgChangeRequest.findMany({
      where: {
        status: query.status,
        employeeId: query.employeeId,
      },
      include: { employee: { select: employeeScopeSelect } },
      orderBy: { effectiveDate: 'desc' },
      take: 100,
    });
    return {
      items: filterByScope(
        user,
        'employees',
        'view',
        rows.map((row) => this.mapOrg(row)),
      ),
    };
  }

  async createOrg(dto: CreateOrgChangeDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const proposer = payload.employeeId ?? payload.sub;
    const emp = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      select: employeeScopeSelect,
    });
    if (!emp) throw new NotFoundException('Employee not found');
    if (!can(user, 'employees', 'edit', this.targetOf(emp))) {
      throw new ForbiddenException('Missing permission: employees:edit');
    }
    if (
      !dto.newDepartmentId &&
      !dto.newPositionId &&
      !dto.newManagerId &&
      dto.newBaseSalary == null
    ) {
      throw new BadRequestException('Provide at least one proposed change');
    }
    if (dto.kind === 'salary_change' && dto.newBaseSalary == null) {
      throw new BadRequestException('salary_change requires newBaseSalary');
    }
    if (dto.kind === 'transfer' && !dto.newDepartmentId) {
      throw new BadRequestException('transfer requires newDepartmentId');
    }
    if (dto.newDepartmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.newDepartmentId },
      });
      if (!dept) throw new NotFoundException('Department not found');
    }
    if (dto.newPositionId) {
      const pos = await this.prisma.position.findUnique({
        where: { id: dto.newPositionId },
      });
      if (!pos) throw new NotFoundException('Position not found');
    }
    if (dto.newManagerId) {
      const mgr = await this.prisma.employee.findUnique({
        where: { id: dto.newManagerId },
      });
      if (!mgr) throw new NotFoundException('Manager not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.orgChangeRequest.create({
        data: {
          employeeId: dto.employeeId,
          kind: dto.kind,
          proposedBy: proposer,
          effectiveDate: new Date(dto.effectiveDate.slice(0, 10)),
          newDepartmentId: dto.newDepartmentId,
          newPositionId: dto.newPositionId,
          newManagerId: dto.newManagerId,
          newBaseSalary: dto.newBaseSalary,
          reason: dto.reason,
          status: 'pending',
        },
        include: { employee: { select: employeeScopeSelect } },
      });
      await this.approvals.createInTx(tx, {
        type: 'org_change',
        requesterId: proposer,
        summary: `${dto.kind} for ${emp.firstName} ${emp.lastName}`,
        relatedId: row.id,
        relatedType: 'org_change',
      });
      return this.mapOrg(row);
    });
  }

  async cancelOrg(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.orgChangeRequest.findUnique({
      where: { id },
      include: { employee: { select: employeeScopeSelect } },
    });
    if (!row) throw new NotFoundException('Org change not found');
    const owner = row.proposedBy === (payload.employeeId ?? payload.sub);
    if (!owner && !can(user, 'employees', 'edit', this.targetOf(row.employee))) {
      throw new ForbiddenException('Cannot cancel this org change');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.orgChangeRequest.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { employee: { select: employeeScopeSelect } },
      });
      await tx.approvalRequest.updateMany({
        where: { relatedId: id, type: 'org_change', status: 'pending' },
        data: {
          status: 'returned',
          note: 'Cancelled by requester',
          decidedAt: new Date(),
          decidedById: payload.employeeId ?? payload.sub,
        },
      });
      return next;
    });
    return this.mapOrg(updated);
  }
}
