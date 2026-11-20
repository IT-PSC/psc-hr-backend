"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MATRIX_ACTIONS = exports.MATRIX_MODULES = exports.MATRIX_MODULE_GROUPS = exports.ROLE_PERMISSIONS = exports.AP_FUNCTION_MODULES = exports.FINANCE_FUNCTION_MODULES = void 0;
exports.scopeRank = scopeRank;
exports.cloneDefaultRolePermissions = cloneDefaultRolePermissions;
exports.migrateRolePermissions = migrateRolePermissions;
exports.isSensitiveSystemAdminGrant = isSensitiveSystemAdminGrant;
function p(module, action, scope) {
    return { module, action, scope };
}
exports.FINANCE_FUNCTION_MODULES = [
    'finance_ledger',
    'finance_ar',
    'finance_cashier',
    'finance_collections',
    'finance_wallets',
    'finance_payments',
    'finance_inventory',
    'finance_payroll',
    'finance_tax',
    'finance_reports',
    'finance_setup',
];
exports.AP_FUNCTION_MODULES = [
    'ap_inbox',
    'ap_requests',
    'ap_payments',
    'ap_ingredients',
    'ap_petty_cash',
    'ap_setup',
];
function functionPerms(modules, actions, scope) {
    const out = [];
    for (const module of modules) {
        for (const action of actions) {
            out.push(p(module, action, scope));
        }
    }
    return out;
}
const FINANCE_ACTIONS = ['view', 'create', 'edit', 'approve', 'export'];
const AP_ACTIONS = ['view', 'create', 'edit', 'approve', 'export'];
const SCOPE_RANK = {
    own: 1,
    team: 2,
    department: 3,
    company: 4,
};
function scopeRank(scope) {
    return SCOPE_RANK[scope];
}
function mergePerms(...lists) {
    const map = new Map();
    for (const list of lists) {
        for (const perm of list) {
            const key = `${perm.module}:${perm.action}`;
            const prev = map.get(key);
            if (!prev || scopeRank(perm.scope) > scopeRank(prev.scope)) {
                map.set(key, { ...perm });
            }
        }
    }
    return [...map.values()];
}
const employeePerms = [
    p('dashboard', 'view', 'own'),
    p('employees', 'view', 'own'),
    p('profile', 'view', 'own'),
    p('profile', 'edit', 'own'),
    p('attendance', 'view', 'own'),
    p('attendance', 'create', 'own'),
    p('timesheet', 'view', 'own'),
    p('overtime', 'create', 'own'),
    p('overtime', 'view', 'own'),
    p('leave', 'create', 'own'),
    p('leave', 'view', 'own'),
    p('roster', 'view', 'own'),
    p('payslip', 'view', 'own'),
    p('contracts', 'view', 'own'),
    p('documents', 'view', 'own'),
    p('probation', 'view', 'own'),
    p('performance', 'view', 'own'),
    p('performance', 'edit', 'own'),
    p('training', 'view', 'own'),
    p('training', 'create', 'own'),
    p('benefits', 'view', 'own'),
    p('assets', 'view', 'own'),
    p('helpdesk', 'create', 'own'),
    p('helpdesk', 'view', 'own'),
    p('announcements', 'view', 'own'),
    p('policies', 'view', 'own'),
    p('approvals', 'view', 'own'),
    p('notifications', 'view', 'own'),
    p('letters', 'view', 'own'),
    p('letters', 'create', 'own'),
    p('recognition', 'view', 'own'),
    p('recognition', 'create', 'own'),
    p('surveys', 'view', 'own'),
    p('suggestions', 'view', 'own'),
    p('suggestions', 'create', 'own'),
    p('onboarding', 'view', 'own'),
    p('onboarding', 'edit', 'own'),
    p('resignation', 'create', 'own'),
];
const managerPerms = [
    ...employeePerms,
    p('dashboard', 'view', 'team'),
    p('employees', 'view', 'team'),
    p('employees', 'edit', 'team'),
    p('attendance', 'view', 'team'),
    p('attendance', 'approve', 'team'),
    p('timesheet', 'view', 'team'),
    p('timesheet', 'approve', 'team'),
    p('overtime', 'approve', 'team'),
    p('leave', 'view', 'team'),
    p('leave', 'approve', 'team'),
    p('roster', 'view', 'team'),
    p('roster', 'edit', 'team'),
    p('probation', 'view', 'team'),
    p('probation', 'edit', 'team'),
    p('recruitment', 'create', 'team'),
    p('recruitment', 'view', 'team'),
    p('onboarding', 'view', 'team'),
    p('onboarding', 'edit', 'team'),
    p('performance', 'edit', 'team'),
    p('performance', 'approve', 'team'),
    p('training', 'approve', 'team'),
    p('reports', 'view', 'team'),
    p('reports', 'export', 'team'),
    p('approvals', 'view', 'team'),
    p('approvals', 'approve', 'team'),
    p('team_calendar', 'view', 'team'),
    p('employee_relations', 'view', 'own'),
    p('employee_relations', 'view', 'team'),
    p('employee_relations', 'create', 'team'),
    p('recognition', 'view', 'company'),
    p('recognition', 'create', 'company'),
];
const financeManagerPerms = [
    ...employeePerms,
    p('dashboard', 'view', 'company'),
    p('employees', 'view', 'company'),
    p('organization', 'view', 'company'),
    p('attendance', 'view', 'company'),
    p('leave', 'view', 'company'),
    p('payroll', 'view', 'company'),
    p('payslip', 'view', 'company'),
    p('finance', 'view', 'company'),
    p('finance', 'create', 'company'),
    p('finance', 'edit', 'company'),
    p('finance', 'approve', 'company'),
    p('finance', 'export', 'company'),
    ...functionPerms(exports.FINANCE_FUNCTION_MODULES, FINANCE_ACTIONS, 'company'),
    p('accounts_payable', 'view', 'company'),
    p('accounts_payable', 'create', 'company'),
    p('accounts_payable', 'edit', 'company'),
    p('accounts_payable', 'approve', 'company'),
    p('accounts_payable', 'export', 'company'),
    ...functionPerms(exports.AP_FUNCTION_MODULES, AP_ACTIONS, 'company'),
    p('reports', 'view', 'company'),
    p('reports', 'export', 'company'),
    p('approvals', 'view', 'company'),
    p('approvals', 'approve', 'company'),
    p('team_calendar', 'view', 'company'),
    p('contracts', 'view', 'company'),
    p('documents', 'view', 'company'),
];
const hrPerms = [
    ...employeePerms,
    p('dashboard', 'view', 'company'),
    p('employees', 'view', 'company'),
    p('employees', 'create', 'company'),
    p('employees', 'edit', 'company'),
    p('employees', 'delete', 'company'),
    p('employees', 'export', 'company'),
    p('organization', 'view', 'company'),
    p('recruitment', 'view', 'company'),
    p('recruitment', 'create', 'company'),
    p('recruitment', 'edit', 'company'),
    p('onboarding', 'view', 'company'),
    p('onboarding', 'create', 'company'),
    p('onboarding', 'edit', 'company'),
    p('offboarding', 'view', 'company'),
    p('offboarding', 'edit', 'company'),
    p('attendance', 'view', 'company'),
    p('attendance', 'create', 'company'),
    p('attendance', 'edit', 'company'),
    p('attendance', 'approve', 'company'),
    p('timesheet', 'view', 'company'),
    p('timesheet', 'edit', 'company'),
    p('overtime', 'view', 'company'),
    p('overtime', 'approve', 'company'),
    p('leave', 'view', 'company'),
    p('leave', 'create', 'company'),
    p('leave', 'edit', 'company'),
    p('leave', 'approve', 'company'),
    p('roster', 'view', 'company'),
    p('roster', 'edit', 'company'),
    p('roster', 'create', 'company'),
    p('payroll', 'view', 'company'),
    p('payroll', 'create', 'company'),
    p('payroll', 'edit', 'company'),
    p('payslip', 'view', 'company'),
    p('contracts', 'view', 'company'),
    p('contracts', 'create', 'company'),
    p('contracts', 'edit', 'company'),
    p('documents', 'view', 'company'),
    p('documents', 'create', 'company'),
    p('documents', 'edit', 'company'),
    p('probation', 'view', 'company'),
    p('probation', 'edit', 'company'),
    p('performance', 'view', 'company'),
    p('performance', 'create', 'company'),
    p('performance', 'edit', 'company'),
    p('training', 'view', 'company'),
    p('training', 'create', 'company'),
    p('training', 'edit', 'company'),
    p('benefits', 'view', 'company'),
    p('benefits', 'edit', 'company'),
    p('assets', 'view', 'company'),
    p('assets', 'edit', 'company'),
    p('helpdesk', 'view', 'company'),
    p('helpdesk', 'edit', 'company'),
    p('announcements', 'view', 'company'),
    p('announcements', 'create', 'company'),
    p('announcements', 'edit', 'company'),
    p('policies', 'view', 'company'),
    p('policies', 'create', 'company'),
    p('policies', 'edit', 'company'),
    p('reports', 'view', 'company'),
    p('reports', 'export', 'company'),
    p('approvals', 'view', 'company'),
    p('approvals', 'approve', 'company'),
    p('compliance', 'view', 'company'),
    p('compliance', 'edit', 'company'),
    p('compliance', 'export', 'company'),
    p('data_quality', 'view', 'company'),
    p('data_quality', 'export', 'company'),
    p('letters', 'view', 'company'),
    p('letters', 'create', 'company'),
    p('letters', 'approve', 'company'),
    p('letters', 'edit', 'company'),
    p('recognition', 'view', 'company'),
    p('recognition', 'create', 'company'),
    p('recognition', 'edit', 'company'),
    p('surveys', 'view', 'company'),
    p('surveys', 'create', 'company'),
    p('surveys', 'edit', 'company'),
    p('surveys', 'export', 'company'),
    p('suggestions', 'view', 'company'),
    p('suggestions', 'create', 'company'),
    p('suggestions', 'edit', 'company'),
    p('settings', 'manage_settings', 'company'),
    p('audit_log', 'view', 'company'),
    p('team_calendar', 'view', 'company'),
    p('employee_relations', 'view', 'company'),
    p('employee_relations', 'create', 'company'),
    p('employee_relations', 'edit', 'company'),
    p('employee_relations', 'delete', 'company'),
    p('employee_relations', 'export', 'company'),
    p('accounts_payable', 'view', 'company'),
    p('accounts_payable', 'create', 'company'),
    p('accounts_payable', 'edit', 'company'),
    p('accounts_payable', 'approve', 'company'),
    p('accounts_payable', 'export', 'company'),
    ...functionPerms(exports.AP_FUNCTION_MODULES, AP_ACTIONS, 'company'),
    p('finance', 'view', 'company'),
    p('finance', 'create', 'company'),
    p('finance', 'edit', 'company'),
    p('finance', 'approve', 'company'),
    p('finance', 'export', 'company'),
    ...functionPerms(exports.FINANCE_FUNCTION_MODULES, FINANCE_ACTIONS, 'company'),
];
const executivePerms = [
    p('dashboard', 'view', 'company'),
    p('employees', 'view', 'company'),
    p('organization', 'view', 'company'),
    p('attendance', 'view', 'company'),
    p('overtime', 'view', 'company'),
    p('leave', 'view', 'company'),
    p('leave', 'approve', 'company'),
    p('roster', 'view', 'company'),
    p('payroll', 'view', 'company'),
    p('payroll', 'approve', 'company'),
    p('payslip', 'view', 'company'),
    p('contracts', 'view', 'company'),
    p('documents', 'view', 'company'),
    p('probation', 'view', 'company'),
    p('recruitment', 'view', 'company'),
    p('recruitment', 'approve', 'company'),
    p('performance', 'view', 'company'),
    p('training', 'view', 'company'),
    p('announcements', 'view', 'company'),
    p('announcements', 'create', 'company'),
    p('policies', 'view', 'company'),
    p('reports', 'view', 'company'),
    p('reports', 'export', 'company'),
    p('approvals', 'view', 'company'),
    p('approvals', 'approve', 'company'),
    p('compliance', 'view', 'company'),
    p('data_quality', 'view', 'company'),
    p('recognition', 'view', 'company'),
    p('surveys', 'view', 'company'),
    p('surveys', 'export', 'company'),
    p('suggestions', 'view', 'company'),
    p('audit_log', 'view', 'company'),
    p('helpdesk', 'create', 'own'),
    p('helpdesk', 'view', 'own'),
    p('team_calendar', 'view', 'company'),
    p('employee_relations', 'view', 'company'),
    p('finance', 'view', 'company'),
    ...functionPerms(exports.FINANCE_FUNCTION_MODULES, ['view'], 'company'),
    p('accounts_payable', 'view', 'company'),
    ...functionPerms(exports.AP_FUNCTION_MODULES, ['view'], 'company'),
];
const platformAdminPerms = [
    p('users', 'view', 'company'),
    p('users', 'create', 'company'),
    p('users', 'edit', 'company'),
    p('users', 'delete', 'company'),
    p('roles', 'view', 'company'),
    p('roles', 'edit', 'company'),
    p('settings', 'view', 'company'),
    p('settings', 'manage_settings', 'company'),
    p('leave', 'manage_settings', 'company'),
    p('helpdesk', 'view', 'company'),
];
const systemAdminPerms = mergePerms(employeePerms, managerPerms, financeManagerPerms, hrPerms, executivePerms, platformAdminPerms, [p('employee_relations', 'view', 'own')]);
const FINANCE_MODULE_SET = new Set([
    'finance',
    'accounts_payable',
    ...exports.FINANCE_FUNCTION_MODULES,
    ...exports.AP_FUNCTION_MODULES,
]);
function withoutFinanceModules(perms) {
    return perms.filter((perm) => !FINANCE_MODULE_SET.has(perm.module));
}
exports.ROLE_PERMISSIONS = {
    system_admin: systemAdminPerms,
    hr: hrPerms,
    finance_manager: financeManagerPerms,
    manager: managerPerms,
    employee: employeePerms,
};
function cloneDefaultRolePermissions() {
    const roles = Object.keys(exports.ROLE_PERMISSIONS);
    const out = {};
    for (const r of roles) {
        out[r] = exports.ROLE_PERMISSIONS[r].map((perm) => ({ ...perm }));
    }
    return out;
}
function migrateRolePermissions(raw) {
    const base = cloneDefaultRolePermissions();
    if (!raw || typeof raw !== 'object')
        return base;
    for (const role of Object.keys(base)) {
        if (Array.isArray(raw[role]) && raw[role].length > 0) {
            let saved = raw[role].map((perm) => ({ ...perm }));
            if (role === 'manager') {
                saved = withoutFinanceModules(saved);
            }
            const savedModules = new Set(saved.map((p) => p.module));
            for (const def of exports.ROLE_PERMISSIONS[role]) {
                if (!savedModules.has(def.module)) {
                    saved.push({ ...def });
                }
            }
            base[role] = saved;
        }
    }
    if (!Array.isArray(raw.finance_manager) || raw.finance_manager.length === 0) {
        base.finance_manager = exports.ROLE_PERMISSIONS.finance_manager.map((perm) => ({
            ...perm,
        }));
    }
    return base;
}
exports.MATRIX_MODULE_GROUPS = [
    {
        id: 'core',
        labelKey: 'settings.permGroup.core',
        modules: [
            'dashboard',
            'employees',
            'organization',
            'profile',
            'notifications',
        ],
    },
    {
        id: 'people',
        labelKey: 'settings.permGroup.people',
        modules: [
            'recruitment',
            'onboarding',
            'offboarding',
            'probation',
            'contracts',
            'documents',
            'resignation',
            'employee_relations',
        ],
    },
    {
        id: 'time',
        labelKey: 'settings.permGroup.time',
        modules: [
            'attendance',
            'timesheet',
            'overtime',
            'leave',
            'roster',
            'team_calendar',
        ],
    },
    {
        id: 'payroll',
        labelKey: 'settings.permGroup.payroll',
        modules: ['payroll', 'payslip', 'benefits', 'assets'],
    },
    {
        id: 'ap',
        labelKey: 'settings.permGroup.accountsPayable',
        modules: ['accounts_payable', ...exports.AP_FUNCTION_MODULES],
    },
    {
        id: 'finance',
        labelKey: 'settings.permGroup.finance',
        modules: ['finance', ...exports.FINANCE_FUNCTION_MODULES],
    },
    {
        id: 'talent',
        labelKey: 'settings.permGroup.talent',
        modules: [
            'performance',
            'training',
            'recognition',
            'surveys',
            'suggestions',
        ],
    },
    {
        id: 'comms',
        labelKey: 'settings.permGroup.comms',
        modules: [
            'helpdesk',
            'announcements',
            'policies',
            'letters',
            'approvals',
        ],
    },
    {
        id: 'admin',
        labelKey: 'settings.permGroup.admin',
        modules: [
            'reports',
            'compliance',
            'data_quality',
            'users',
            'roles',
            'settings',
            'audit_log',
        ],
    },
];
exports.MATRIX_MODULES = exports.MATRIX_MODULE_GROUPS.flatMap((g) => g.modules);
exports.MATRIX_ACTIONS = [
    'view',
    'create',
    'edit',
    'delete',
    'approve',
    'export',
    'manage_settings',
];
function isSensitiveSystemAdminGrant(module, action) {
    if (module === 'payroll' && (action === 'approve' || action === 'edit' || action === 'create')) {
        return true;
    }
    if (module === 'payslip' && (action === 'view' || action === 'export'))
        return true;
    if ((module === 'finance' || exports.FINANCE_FUNCTION_MODULES.includes(module)) &&
        (action === 'approve' || action === 'edit' || action === 'create')) {
        return true;
    }
    return false;
}
//# sourceMappingURL=matrix.js.map