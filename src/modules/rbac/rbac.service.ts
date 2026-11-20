import { Injectable, NotFoundException } from '@nestjs/common';
import { ROLE_PERMISSIONS } from '../../common/roles/matrix';
import type { AppRole } from '../../common/roles/types';

const ROLES: AppRole[] = [
  'system_admin',
  'hr',
  'finance_manager',
  'manager',
  'employee',
];

@Injectable()
export class RbacService {
  listRoles() {
    return ROLES.map((role) => ({
      role,
      permissionCount: ROLE_PERMISSIONS[role]?.length ?? 0,
    }));
  }

  permissionsForRole(role: string) {
    if (!ROLES.includes(role as AppRole)) {
      throw new NotFoundException(`Unknown role: ${role}`);
    }
    return ROLE_PERMISSIONS[role as AppRole];
  }

  matrix() {
    return ROLE_PERMISSIONS;
  }
}
