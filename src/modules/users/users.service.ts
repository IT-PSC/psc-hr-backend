import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AppRole as RoleName } from '../../common/roles/types';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, employee: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.map(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { roles: true, employee: true },
      orderBy: { email: 'asc' },
    });
    return users.map((user) => this.map(user));
  }

  async create(dto: CreateUserDto) {
    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });
      if (!employee) throw new NotFoundException('Employee not found');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          employeeId: dto.employeeId,
          active: dto.active ?? true,
          roles: {
            create: dto.roles.map((role) => ({ role: role as AppRole })),
          },
        },
        include: { roles: true, employee: true },
      });
      return this.map(user);
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });
      if (!employee) throw new NotFoundException('Employee not found');
    }
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        if (dto.roles) {
          await tx.userRole.deleteMany({ where: { userId: id } });
          if (dto.roles.length) {
            await tx.userRole.createMany({
              data: dto.roles.map((role) => ({
                userId: id,
                role: role as AppRole,
              })),
            });
          }
        }
        return tx.user.update({
          where: { id },
          data: {
            ...(dto.active !== undefined ? { active: dto.active } : {}),
            ...(passwordHash ? { passwordHash } : {}),
            ...(dto.employeeId !== undefined
              ? { employeeId: dto.employeeId }
              : {}),
          },
          include: { roles: true, employee: true },
        });
      });
      return this.map(user);
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  private map(user: {
    id: string;
    email: string;
    employeeId: string | null;
    active: boolean;
    roles: { role: AppRole }[];
    employee: { firstName: string; lastName: string } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      roles: user.roles.map((r) => r.role as RoleName),
      firstName: user.employee?.firstName ?? null,
      lastName: user.employee?.lastName ?? null,
      active: user.active,
    };
  }

  private rethrowUnique(e: unknown): void {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      throw new ConflictException('Email or employee is already linked to a user');
    }
  }
}
