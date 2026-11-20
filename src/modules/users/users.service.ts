import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AppRole } from '../../common/roles/types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, employee: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      roles: user.roles.map((r) => r.role as AppRole),
      firstName: user.employee?.firstName ?? null,
      lastName: user.employee?.lastName ?? null,
      active: user.active,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { roles: true, employee: true },
      orderBy: { email: 'asc' },
    });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      roles: user.roles.map((r) => r.role as AppRole),
      firstName: user.employee?.firstName ?? null,
      lastName: user.employee?.lastName ?? null,
      active: user.active,
    }));
  }
}
