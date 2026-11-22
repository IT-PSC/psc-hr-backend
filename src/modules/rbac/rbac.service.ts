import { Injectable, NotFoundException } from '@nestjs/common';
import { Action, AppRole, Scope } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ROLE_PERMISSIONS } from '../../common/roles/matrix';
import type { AppRole as RoleName, Permission } from '../../common/roles/types';
import { PermissionItemDto } from './dto/rbac.dto';

const ROLES: RoleName[] = [
  'system_admin',
  'hr',
  'finance_manager',
  'manager',
  'employee',
];

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles() {
    const grouped = await this.prisma.permissionGrant.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
    const counts = new Map(grouped.map((row) => [row.role, row._count._all]));
    return ROLES.map((role) => {
      const dbCount = counts.get(role as AppRole) ?? 0;
      return {
        role,
        permissionCount: dbCount > 0 ? dbCount : (ROLE_PERMISSIONS[role]?.length ?? 0),
      };
    });
  }

  async permissionsForRole(role: string) {
    this.assertRole(role);
    const rows = await this.prisma.permissionGrant.findMany({
      where: { role: role as AppRole },
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
    if (rows.length) return rows.map((row) => this.toPermission(row));
    return ROLE_PERMISSIONS[role as RoleName];
  }

  async matrix() {
    const rows = await this.prisma.permissionGrant.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
    const byRole = new Map<RoleName, Permission[]>();
    for (const row of rows) {
      const role = row.role as RoleName;
      const list = byRole.get(role) ?? [];
      list.push(this.toPermission(row));
      byRole.set(role, list);
    }
    const out = {} as Record<RoleName, Permission[]>;
    for (const role of ROLES) {
      const saved = byRole.get(role);
      out[role] = saved && saved.length ? saved : ROLE_PERMISSIONS[role];
    }
    return out;
  }

  async replacePermissions(role: string, items: PermissionItemDto[]) {
    this.assertRole(role);
    const deduped = new Map<string, PermissionItemDto>();
    for (const item of items) {
      deduped.set(`${item.module}:${item.action}`, item);
    }
    const data = [...deduped.values()].map((item) => ({
      role: role as AppRole,
      module: item.module,
      action: item.action as Action,
      scope: item.scope as Scope,
    }));
    await this.prisma.$transaction([
      this.prisma.permissionGrant.deleteMany({ where: { role: role as AppRole } }),
      ...(data.length
        ? [this.prisma.permissionGrant.createMany({ data })]
        : []),
    ]);
    return data.map((row) => this.toPermission(row));
  }

  private assertRole(role: string): asserts role is RoleName {
    if (!ROLES.includes(role as RoleName)) {
      throw new NotFoundException(`Unknown role: ${role}`);
    }
  }

  private toPermission(row: {
    module: string;
    action: Action | Permission['action'];
    scope: Scope | Permission['scope'];
  }): Permission {
    return {
      module: row.module as Permission['module'],
      action: row.action as Permission['action'],
      scope: row.scope as Permission['scope'],
    };
  }
}
