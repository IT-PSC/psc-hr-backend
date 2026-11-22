import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { CreateEmployeeDto } from './dto/employee.dto';
import { UpdateEmployeeDto } from './dto/employee.dto';
import {
  CreateRelatedUserDto,
  LinkRelatedUserDto,
  UpdateRelatedUserDto,
} from './dto/related-user.dto';

const employeeInclude = {
  department: true,
  position: true,
  user: { include: { roles: true } },
} as const;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private mapRelatedUser(
    user:
      | {
          id: string;
          email: string;
          active: boolean;
          roles: { role: AppRole }[];
        }
      | null
      | undefined,
  ) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      active: user.active,
      roles: user.roles.map((r) => r.role),
    };
  }

  private mapRow(
    e: Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }>,
  ) {
    const { user, ...rest } = e;
    return {
      ...rest,
      id: e.id,
      employeeId: e.id,
      departmentId: e.departmentId ?? undefined,
      positionId: e.positionId ?? undefined,
      managerId: e.managerId,
      baseSalary: e.baseSalary != null ? Number(e.baseSalary) : null,
      allowances: e.allowances != null ? Number(e.allowances) : null,
      deductions: e.deductions != null ? Number(e.deductions) : null,
      dateOfBirth: e.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      startDate: e.startDate?.toISOString().slice(0, 10) ?? null,
      lastWorkingDay: e.lastWorkingDay?.toISOString().slice(0, 10) ?? null,
      emergencyContact: e.emergencyContact ?? null,
      relatedUser: this.mapRelatedUser(user),
    };
  }

  private assertCanManageRelatedUser(
    actor: CurrentUser,
    employee: { id: string; departmentId: string | null; managerId: string | null },
  ) {
    if (can(actor, 'users', 'create') || can(actor, 'users', 'edit')) return;
    if (
      can(actor, 'employees', 'edit', {
        employeeId: employee.id,
        departmentId: employee.departmentId ?? undefined,
        managerId: employee.managerId,
      })
    ) {
      return;
    }
    throw new ForbiddenException(
      'Missing permission to manage related user (users:create/edit or employees:edit)',
    );
  }

  /** Non-admin actors may only assign the employee self-service role. */
  private normalizeRelatedRoles(
    actor: CurrentUser,
    roles: string[] | undefined,
  ): AppRole[] {
    const requested = (roles?.length ? roles : ['employee']) as AppRole[];
    const canAssignElevated =
      can(actor, 'users', 'create') || can(actor, 'users', 'edit');
    if (!canAssignElevated) {
      const elevated = requested.filter((r) => r !== 'employee');
      if (elevated.length) {
        throw new ForbiddenException(
          'Assigning non-employee roles requires users:create or users:edit',
        );
      }
      return ['employee'];
    }
    return requested;
  }

  async findAll(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employees', 'view')) {
      return [];
    }
    const rows = await this.prisma.employee.findMany({
      include: employeeInclude,
      orderBy: { employeeCode: 'asc' },
    });
    const mapped = rows.map((e) => this.mapRow(e));
    return filterByScope(user, 'employees', 'view', mapped);
  }

  async findOne(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: employeeInclude,
    });
    if (!emp) throw new NotFoundException('Employee not found');
    if (
      !can(user, 'employees', 'view', {
        employeeId: emp.id,
        departmentId: emp.departmentId ?? undefined,
        managerId: emp.managerId,
      })
    ) {
      throw new NotFoundException('Employee not found');
    }
    return this.mapRow(emp);
  }

  async create(dto: CreateEmployeeDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employees', 'create')) {
      throw new ForbiddenException('Missing permission: employees:create');
    }
    if (dto.relatedUser) {
      this.assertCanManageRelatedUser(user, {
        id: dto.id ?? 'new',
        departmentId: dto.departmentId ?? null,
        managerId: dto.managerId ?? null,
      });
    }
    try {
      const emp = await this.prisma.$transaction(async (tx) => {
        const created = await tx.employee.create({
          data: this.toCreateData(dto),
        });
        if (dto.relatedUser) {
          await this.createUserForEmployee(tx, created, dto.relatedUser, user);
        }
        return tx.employee.findUniqueOrThrow({
          where: { id: created.id },
          include: employeeInclude,
        });
      });
      await this.prisma.auditLog.create({
        data: {
          module: 'employees',
          action: 'create',
          actorId: payload.employeeId ?? payload.sub,
          targetId: emp.id,
          detail: dto.relatedUser
            ? `Created ${emp.employeeCode} with related user`
            : `Created ${emp.employeeCode}`,
        },
      });
      return this.mapRow(emp);
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async createRelatedUser(
    employeeId: string,
    dto: CreateRelatedUserDto,
    payload: JwtPayload,
  ) {
    const actor = this.toCurrentUser(payload);
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    this.assertCanManageRelatedUser(actor, emp);
    if (emp.user) {
      throw new ConflictException('Employee already has a related user');
    }
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await this.createUserForEmployee(tx, emp, dto, actor);
        return tx.employee.findUniqueOrThrow({
          where: { id: employeeId },
          include: employeeInclude,
        });
      });
      await this.prisma.auditLog.create({
        data: {
          module: 'users',
          action: 'create',
          actorId: payload.employeeId ?? payload.sub,
          targetId: employeeId,
          detail: `Created related user for ${emp.employeeCode}`,
        },
      });
      return this.mapRow(updated);
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async updateRelatedUser(
    employeeId: string,
    dto: UpdateRelatedUserDto,
    payload: JwtPayload,
  ) {
    const actor = this.toCurrentUser(payload);
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { include: { roles: true } } },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    this.assertCanManageRelatedUser(actor, emp);
    if (!emp.user) {
      throw new NotFoundException('No related user linked to this employee');
    }
    if (dto.roles) {
      this.normalizeRelatedRoles(actor, dto.roles);
    }
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (dto.roles) {
          const roles = this.normalizeRelatedRoles(actor, dto.roles);
          await tx.userRole.deleteMany({ where: { userId: emp.user!.id } });
          if (roles.length) {
            await tx.userRole.createMany({
              data: roles.map((role) => ({
                userId: emp.user!.id,
                role,
              })),
            });
          }
        }
        await tx.user.update({
          where: { id: emp.user!.id },
          data: {
            ...(dto.email !== undefined
              ? { email: dto.email.toLowerCase() }
              : {}),
            ...(dto.active !== undefined ? { active: dto.active } : {}),
            ...(passwordHash ? { passwordHash } : {}),
          },
        });
        return tx.employee.findUniqueOrThrow({
          where: { id: employeeId },
          include: employeeInclude,
        });
      });
      await this.prisma.auditLog.create({
        data: {
          module: 'users',
          action: 'edit',
          actorId: payload.employeeId ?? payload.sub,
          targetId: employeeId,
          detail: `Updated related user for ${emp.employeeCode}`,
        },
      });
      return this.mapRow(updated);
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async linkRelatedUser(
    employeeId: string,
    dto: LinkRelatedUserDto,
    payload: JwtPayload,
  ) {
    const actor = this.toCurrentUser(payload);
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    this.assertCanManageRelatedUser(actor, emp);
    if (emp.user) {
      throw new ConflictException('Employee already has a related user');
    }
    if (!dto.userId && !dto.email) {
      throw new BadRequestException('Provide userId or email to link');
    }
    const existingUser = await this.prisma.user.findFirst({
      where: dto.userId
        ? { id: dto.userId }
        : { email: dto.email!.toLowerCase() },
    });
    if (!existingUser) throw new NotFoundException('User not found');
    if (existingUser.employeeId && existingUser.employeeId !== employeeId) {
      throw new ConflictException('User is already linked to another employee');
    }
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { employeeId },
        });
        return tx.employee.findUniqueOrThrow({
          where: { id: employeeId },
          include: employeeInclude,
        });
      });
      await this.prisma.auditLog.create({
        data: {
          module: 'users',
          action: 'edit',
          actorId: payload.employeeId ?? payload.sub,
          targetId: employeeId,
          detail: `Linked related user ${existingUser.email} to ${emp.employeeCode}`,
        },
      });
      return this.mapRow(updated);
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async unlinkRelatedUser(employeeId: string, payload: JwtPayload) {
    const actor = this.toCurrentUser(payload);
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    this.assertCanManageRelatedUser(actor, emp);
    if (!emp.user) {
      throw new NotFoundException('No related user linked to this employee');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: emp.user!.id },
        data: { employeeId: null },
      });
      return tx.employee.findUniqueOrThrow({
        where: { id: employeeId },
        include: employeeInclude,
      });
    });
    await this.prisma.auditLog.create({
      data: {
        module: 'users',
        action: 'edit',
        actorId: payload.employeeId ?? payload.sub,
        targetId: employeeId,
        detail: `Unlinked related user from ${emp.employeeCode}`,
      },
    });
    return this.mapRow(updated);
  }

  private async createUserForEmployee(
    tx: Prisma.TransactionClient,
    employee: { id: string; email: string },
    dto: CreateRelatedUserDto,
    actor: CurrentUser,
  ) {
    const roles = this.normalizeRelatedRoles(actor, dto.roles);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await tx.user.create({
      data: {
        email: (dto.email?.trim() || employee.email).toLowerCase(),
        passwordHash,
        employeeId: employee.id,
        active: dto.active ?? true,
        roles: { create: roles.map((role) => ({ role })) },
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');
    if (
      !can(user, 'employees', 'edit', {
        employeeId: existing.id,
        departmentId: existing.departmentId ?? undefined,
        managerId: existing.managerId,
      })
    ) {
      throw new ForbiddenException('Missing permission: employees:edit');
    }
    try {
      const emp = await this.prisma.employee.update({
        where: { id },
        data: this.toUpdateData(dto),
        include: employeeInclude,
      });
      await this.prisma.auditLog.create({
        data: {
          module: 'employees',
          action: 'edit',
          actorId: payload.employeeId ?? payload.sub,
          targetId: emp.id,
          detail: `Updated ${emp.employeeCode}`,
        },
      });
      return this.mapRow(emp);
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  /** Soft-deactivate (status=inactive). Hard delete forbidden for HR history. */
  async softDelete(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');
    if (
      !can(user, 'employees', 'delete', {
        employeeId: existing.id,
        departmentId: existing.departmentId ?? undefined,
        managerId: existing.managerId,
      })
    ) {
      throw new ForbiddenException('Missing permission: employees:delete');
    }
    const emp = await this.prisma.employee.update({
      where: { id },
      data: { status: 'inactive', lastWorkingDay: new Date() },
      include: employeeInclude,
    });
    await this.prisma.auditLog.create({
      data: {
        module: 'employees',
        action: 'delete',
        actorId: payload.employeeId ?? payload.sub,
        targetId: emp.id,
        detail: `Soft-deactivated ${emp.employeeCode}`,
      },
    });
    return this.mapRow(emp);
  }

  private toCreateData(dto: CreateEmployeeDto): Prisma.EmployeeCreateInput {
    return {
      ...(dto.id ? { id: dto.id } : {}),
      employeeCode: dto.employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      status: dto.status ?? 'active',
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      baseSalary: dto.baseSalary,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      nationality: dto.nationality,
      idNumber: dto.idNumber,
      address: dto.address,
      avatarColor: dto.avatarColor,
      avatarUrl: dto.avatarUrl,
      allowances: dto.allowances,
      deductions: dto.deductions,
      bankAccount: dto.bankAccount,
      bankName: dto.bankName,
      nssfNumber: dto.nssfNumber,
      emergencyContact: dto.emergencyContact ?? undefined,
      lastWorkingDay: dto.lastWorkingDay
        ? new Date(dto.lastWorkingDay)
        : undefined,
      department: dto.departmentId
        ? { connect: { id: dto.departmentId } }
        : undefined,
      position: dto.positionId
        ? { connect: { id: dto.positionId } }
        : undefined,
      manager: dto.managerId ? { connect: { id: dto.managerId } } : undefined,
    };
  }

  private toUpdateData(dto: UpdateEmployeeDto): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};
    if (dto.employeeCode !== undefined) data.employeeCode = dto.employeeCode;
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email.toLowerCase();
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.startDate !== undefined)
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.baseSalary !== undefined) data.baseSalary = dto.baseSalary;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.dateOfBirth !== undefined)
      data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.nationality !== undefined) data.nationality = dto.nationality;
    if (dto.idNumber !== undefined) data.idNumber = dto.idNumber;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.avatarColor !== undefined) data.avatarColor = dto.avatarColor;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.allowances !== undefined) data.allowances = dto.allowances;
    if (dto.deductions !== undefined) data.deductions = dto.deductions;
    if (dto.bankAccount !== undefined) data.bankAccount = dto.bankAccount;
    if (dto.bankName !== undefined) data.bankName = dto.bankName;
    if (dto.nssfNumber !== undefined) data.nssfNumber = dto.nssfNumber;
    if (dto.emergencyContact !== undefined)
      data.emergencyContact = dto.emergencyContact;
    if (dto.lastWorkingDay !== undefined)
      data.lastWorkingDay = dto.lastWorkingDay
        ? new Date(dto.lastWorkingDay)
        : null;
    if (dto.departmentId !== undefined) {
      data.department = dto.departmentId
        ? { connect: { id: dto.departmentId } }
        : { disconnect: true };
    }
    if (dto.positionId !== undefined) {
      data.position = dto.positionId
        ? { connect: { id: dto.positionId } }
        : { disconnect: true };
    }
    if (dto.managerId !== undefined) {
      data.manager = dto.managerId
        ? { connect: { id: dto.managerId } }
        : { disconnect: true };
    }
    return data;
  }

  private rethrowUnique(e: unknown): void {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      throw new ConflictException('Employee code or email already exists');
    }
  }
}
