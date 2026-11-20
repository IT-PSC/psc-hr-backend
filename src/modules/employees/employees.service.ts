import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';

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

  async findAll(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employees', 'view')) {
      return [];
    }
    const rows = await this.prisma.employee.findMany({
      include: {
        department: true,
        position: true,
      },
      orderBy: { employeeCode: 'asc' },
    });
    const mapped = rows.map((e) => ({
      ...e,
      employeeId: e.id,
      departmentId: e.departmentId ?? undefined,
      baseSalary: e.baseSalary != null ? Number(e.baseSalary) : null,
    }));
    return filterByScope(user, 'employees', 'view', mapped);
  }

  async findOne(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, position: true },
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
    return {
      ...emp,
      employeeId: emp.id,
      baseSalary: emp.baseSalary != null ? Number(emp.baseSalary) : null,
    };
  }
}
