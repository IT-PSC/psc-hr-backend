"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPermissionsOverride = setPermissionsOverride;
exports.getActiveRolePermissions = getActiveRolePermissions;
exports.normalizeRole = normalizeRole;
exports.normalizeRoles = normalizeRoles;
exports.primaryRole = primaryRole;
exports.collectPermissions = collectPermissions;
exports.getScope = getScope;
exports.can = can;
exports.filterByScope = filterByScope;
exports.canViewSalary = canViewSalary;
exports.canViewConfidentialDocs = canViewConfidentialDocs;
exports.hasRole = hasRole;
exports.hasAnyRole = hasAnyRole;
const matrix_1 = require("./matrix");
let permissionsOverride = null;
function setPermissionsOverride(matrix) {
    permissionsOverride = matrix;
}
function getActiveRolePermissions() {
    if (!permissionsOverride)
        return matrix_1.ROLE_PERMISSIONS;
    const out = { ...matrix_1.ROLE_PERMISSIONS };
    for (const role of Object.keys(matrix_1.ROLE_PERMISSIONS)) {
        const saved = permissionsOverride[role];
        if (Array.isArray(saved) && saved.length > 0) {
            out[role] = saved;
        }
    }
    return out;
}
const VALID_ROLES = [
    'system_admin',
    'hr',
    'finance_manager',
    'manager',
    'employee',
];
const ROLE_RANK = {
    system_admin: 5,
    hr: 4,
    finance_manager: 3,
    manager: 2,
    employee: 1,
};
function normalizeRole(raw, fallback = 'employee') {
    if (!raw)
        return fallback;
    const s = String(raw).toLowerCase().trim();
    if (s === 'ceo')
        return 'system_admin';
    if (s === 'finance' || s === 'fin_manager' || s === 'finance-manager') {
        return 'finance_manager';
    }
    if (VALID_ROLES.includes(s))
        return s;
    return fallback;
}
function normalizeRoles(roles, fallback = 'employee') {
    if (!roles || !Array.isArray(roles) || roles.length === 0)
        return [fallback];
    const out = roles.map((r) => normalizeRole(r, fallback));
    return [...new Set(out)];
}
function primaryRole(roles) {
    if (!roles || roles.length === 0)
        return 'employee';
    let best = roles[0];
    for (const r of roles) {
        if ((ROLE_RANK[r] ?? 0) > (ROLE_RANK[best] ?? 0)) {
            best = r;
        }
    }
    return best;
}
function collectPermissions(roles) {
    const matrix = getActiveRolePermissions();
    const out = [];
    for (const role of roles) {
        const perms = matrix[role] ?? matrix_1.ROLE_PERMISSIONS[role] ?? [];
        out.push(...perms);
    }
    return out;
}
function getScope(user, module, action) {
    const perms = collectPermissions(user.roles).filter((p) => p.module === module && p.action === action);
    if (perms.length === 0)
        return null;
    let widest = perms[0].scope;
    for (const p of perms) {
        if ((0, matrix_1.scopeRank)(p.scope) > (0, matrix_1.scopeRank)(widest))
            widest = p.scope;
    }
    return widest;
}
function targetInScope(user, scope, target) {
    if (scope === 'company')
        return true;
    if (!target?.employeeId && !target?.departmentId)
        return true;
    if (scope === 'own') {
        return !target.employeeId || target.employeeId === user.employeeId;
    }
    if (scope === 'team') {
        if (!target.employeeId)
            return true;
        if (target.employeeId === user.employeeId)
            return true;
        if (user.teamIds?.includes(target.employeeId))
            return true;
        if (target.managerId === user.employeeId)
            return true;
        return false;
    }
    if (scope === 'department') {
        if (target.departmentId && user.departmentId) {
            return target.departmentId === user.departmentId;
        }
        return true;
    }
    return false;
}
function can(user, module, action, target) {
    const scope = getScope(user, module, action);
    if (!scope)
        return false;
    return targetInScope(user, scope, target);
}
function resolveEmployeeKey(item) {
    if (item.employeeId.startsWith('emp-'))
        return item.employeeId;
    if (item.id?.startsWith('emp-'))
        return item.id;
    return item.employeeId;
}
function filterByScope(user, module, action, items) {
    const scope = getScope(user, module, action);
    if (!scope)
        return [];
    if (scope === 'company')
        return items;
    return items.filter((item) => targetInScope(user, scope, {
        employeeId: resolveEmployeeKey(item),
        departmentId: item.departmentId,
        managerId: item.managerId,
    }));
}
function canViewSalary(user, targetEmployeeId) {
    if (user.roles.includes('system_admin')) {
        return can(user, 'payslip', 'view', targetEmployeeId ? { employeeId: targetEmployeeId } : undefined);
    }
    if (targetEmployeeId && targetEmployeeId === user.employeeId) {
        return can(user, 'payslip', 'view', { employeeId: targetEmployeeId });
    }
    return false;
}
function canViewConfidentialDocs(user, targetEmployeeId) {
    return can(user, 'documents', 'view', targetEmployeeId ? { employeeId: targetEmployeeId } : undefined);
}
function hasRole(user, role) {
    const want = role === 'ceo' || role === 'admin' ? 'system_admin' : role;
    if (want === 'employee') {
        return user.roles.includes('employee');
    }
    if (user.roles.includes(want))
        return true;
    if (!user.roles.includes('system_admin'))
        return false;
    return (want === 'system_admin' ||
        want === 'hr' ||
        want === 'manager' ||
        want === 'finance_manager');
}
function hasAnyRole(user, roles) {
    return roles.some((r) => hasRole(user, r));
}
//# sourceMappingURL=can.js.map