// NOTE: Backend must enforce all permissions again. Frontend checks are UX only, not security.

import { ROLE_PERMISSIONS, scopeRank } from './matrix'
import type {
  Action,
  CurrentUser,
  Module,
  Permission,
  PermissionTarget,
  Role,
  Scope,
} from './types'

/** Optional override — Settings matrix editor stores this in dataStore */
let permissionsOverride: Record<Role, Permission[]> | null = null

export function setPermissionsOverride(
  matrix: Record<Role, Permission[]> | null,
): void {
  permissionsOverride = matrix
}

/**
 * Active matrix with defaults filled for any missing role
 * (prevents View As falling through to System Admin grants).
 */
export function getActiveRolePermissions(): Record<Role, Permission[]> {
  if (!permissionsOverride) return ROLE_PERMISSIONS
  const out = { ...ROLE_PERMISSIONS } as Record<Role, Permission[]>
  for (const role of Object.keys(ROLE_PERMISSIONS) as Role[]) {
    const saved = permissionsOverride[role]
    if (Array.isArray(saved) && saved.length > 0) {
      out[role] = saved
    }
  }
  return out
}

const VALID_ROLES: Role[] = [
  'system_admin',
  'hr',
  'finance_manager',
  'manager',
  'employee',
]

const ROLE_RANK: Record<Role, number> = {
  system_admin: 5,
  hr: 4,
  finance_manager: 3,
  manager: 2,
  employee: 1,
}

export function normalizeRole(raw?: string | null, fallback: Role = 'employee'): Role {
  if (!raw) return fallback
  const s = String(raw).toLowerCase().trim()
  if (s === 'ceo') return 'system_admin'
  if (s === 'finance' || s === 'fin_manager' || s === 'finance-manager') {
    return 'finance_manager'
  }
  if (VALID_ROLES.includes(s as Role)) return s as Role
  return fallback
}

export function normalizeRoles(
  roles?: string[] | null,
  fallback: Role = 'employee',
): Role[] {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return [fallback]
  const out = roles.map((r) => normalizeRole(r, fallback))
  return [...new Set(out)]
}

export function primaryRole(roles: Role[]): Role {
  if (!roles || roles.length === 0) return 'employee'
  let best = roles[0]
  for (const r of roles) {
    if ((ROLE_RANK[r] ?? 0) > (ROLE_RANK[best] ?? 0)) {
      best = r
    }
  }
  return best
}

export function collectPermissions(roles: Role[]): Permission[] {
  const matrix = getActiveRolePermissions()
  const out: Permission[] = []
  for (const role of roles) {
    const perms = matrix[role] ?? ROLE_PERMISSIONS[role] ?? []
    out.push(...perms)
  }
  return out
}

export function getScope(
  user: CurrentUser,
  module: Module,
  action: Action,
): Scope | null {
  const perms = collectPermissions(user.roles).filter(
    (p) => p.module === module && p.action === action,
  )
  if (perms.length === 0) return null
  let widest = perms[0].scope
  for (const p of perms) {
    if (scopeRank(p.scope) > scopeRank(widest)) widest = p.scope
  }
  return widest
}

function targetInScope(
  user: CurrentUser,
  scope: Scope,
  target?: PermissionTarget,
): boolean {
  if (scope === 'company') return true
  if (!target?.employeeId && !target?.departmentId) return true

  if (scope === 'own') {
    return !target.employeeId || target.employeeId === user.employeeId
  }

  if (scope === 'team') {
    if (!target.employeeId) return true
    if (target.employeeId === user.employeeId) return true
    if (user.teamIds?.includes(target.employeeId)) return true
    if (target.managerId === user.employeeId) return true
    return false
  }

  if (scope === 'department') {
    if (target.departmentId && user.departmentId) {
      return target.departmentId === user.departmentId
    }
    return true
  }

  return false
}

export function can(
  user: CurrentUser,
  module: Module,
  action: Action,
  target?: PermissionTarget,
): boolean {
  const scope = getScope(user, module, action)
  if (!scope) return false
  return targetInScope(user, scope, target)
}

function resolveEmployeeKey(item: {
  id?: string
  employeeId: string
}): string {
  if (item.employeeId.startsWith('emp-')) return item.employeeId
  if (item.id?.startsWith('emp-')) return item.id
  return item.employeeId
}

export function filterByScope<
  T extends {
    id?: string
    employeeId: string
    departmentId?: string
    managerId?: string | null
  },
>(user: CurrentUser, module: Module, action: Action, items: T[]): T[] {
  const scope = getScope(user, module, action)
  if (!scope) return []
  if (scope === 'company') return items
  return items.filter((item) =>
    targetInScope(user, scope, {
      employeeId: resolveEmployeeKey(item),
      departmentId: item.departmentId,
      managerId: item.managerId,
    }),
  )
}

export function canViewSalary(user: CurrentUser, targetEmployeeId?: string): boolean {
  if (user.roles.includes('system_admin')) {
    return can(
      user,
      'payslip',
      'view',
      targetEmployeeId ? { employeeId: targetEmployeeId } : undefined,
    )
  }
  if (targetEmployeeId && targetEmployeeId === user.employeeId) {
    return can(user, 'payslip', 'view', { employeeId: targetEmployeeId })
  }
  return false
}

export function canViewConfidentialDocs(
  user: CurrentUser,
  targetEmployeeId?: string,
): boolean {
  return can(
    user,
    'documents',
    'view',
    targetEmployeeId ? { employeeId: targetEmployeeId } : undefined,
  )
}

/**
 * Role checks for nav / legacy gates.
 * System Admin also satisfies elevated HR / Manager / Finance Manager checks.
 * Pure employee sessions do not inherit those privileges (View As demos).
 */
export function hasRole(user: CurrentUser, role: string): boolean {
  const want =
    role === 'ceo' || role === 'admin' ? 'system_admin' : role
  if (want === 'employee') {
    return user.roles.includes('employee')
  }
  if (user.roles.includes(want as Role)) return true
  if (!user.roles.includes('system_admin')) return false
  return (
    want === 'system_admin' ||
    want === 'hr' ||
    want === 'manager' ||
    want === 'finance_manager'
  )
}

export function hasAnyRole(user: CurrentUser, roles: string[]): boolean {
  return roles.some((r) => hasRole(user, r))
}
