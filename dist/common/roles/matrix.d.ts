import type { Module, Permission, Role } from './types';
export declare const FINANCE_FUNCTION_MODULES: Module[];
export declare const AP_FUNCTION_MODULES: Module[];
export declare function scopeRank(scope: import('./types').Scope): number;
export declare const ROLE_PERMISSIONS: Record<Role, Permission[]>;
export declare function cloneDefaultRolePermissions(): Record<Role, Permission[]>;
export declare function migrateRolePermissions(raw: Record<string, Permission[]> | null | undefined): Record<Role, Permission[]>;
export declare const MATRIX_MODULE_GROUPS: {
    id: string;
    labelKey: string;
    modules: Module[];
}[];
export declare const MATRIX_MODULES: Module[];
export declare const MATRIX_ACTIONS: import('./types').Action[];
export declare function isSensitiveSystemAdminGrant(module: import('./types').Module, action: import('./types').Action): boolean;
