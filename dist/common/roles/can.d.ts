import type { Action, CurrentUser, Module, Permission, PermissionTarget, Role, Scope } from './types';
export declare function setPermissionsOverride(matrix: Record<Role, Permission[]> | null): void;
export declare function getActiveRolePermissions(): Record<Role, Permission[]>;
export declare function normalizeRole(raw?: string | null, fallback?: Role): Role;
export declare function normalizeRoles(roles?: string[] | null, fallback?: Role): Role[];
export declare function primaryRole(roles: Role[]): Role;
export declare function collectPermissions(roles: Role[]): Permission[];
export declare function getScope(user: CurrentUser, module: Module, action: Action): Scope | null;
export declare function can(user: CurrentUser, module: Module, action: Action, target?: PermissionTarget): boolean;
export declare function filterByScope<T extends {
    id?: string;
    employeeId: string;
    departmentId?: string;
    managerId?: string | null;
}>(user: CurrentUser, module: Module, action: Action, items: T[]): T[];
export declare function canViewSalary(user: CurrentUser, targetEmployeeId?: string): boolean;
export declare function canViewConfidentialDocs(user: CurrentUser, targetEmployeeId?: string): boolean;
export declare function hasRole(user: CurrentUser, role: string): boolean;
export declare function hasAnyRole(user: CurrentUser, roles: string[]): boolean;
