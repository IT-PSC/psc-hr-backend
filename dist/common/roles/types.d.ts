export type AppRole = 'system_admin' | 'hr' | 'finance_manager' | 'manager' | 'employee';
export type Role = AppRole;
export type Module = 'dashboard' | 'employees' | 'organization' | 'recruitment' | 'onboarding' | 'offboarding' | 'attendance' | 'timesheet' | 'overtime' | 'leave' | 'roster' | 'payroll' | 'payslip' | 'contracts' | 'documents' | 'probation' | 'performance' | 'training' | 'benefits' | 'assets' | 'helpdesk' | 'announcements' | 'policies' | 'reports' | 'approvals' | 'users' | 'roles' | 'settings' | 'audit_log' | 'compliance' | 'data_quality' | 'profile' | 'notifications' | 'letters' | 'recognition' | 'surveys' | 'suggestions' | 'employee_relations' | 'team_calendar' | 'resignation' | 'accounts_payable' | 'ap_inbox' | 'ap_requests' | 'ap_payments' | 'ap_ingredients' | 'ap_petty_cash' | 'ap_setup' | 'finance' | 'finance_ledger' | 'finance_ar' | 'finance_cashier' | 'finance_collections' | 'finance_wallets' | 'finance_payments' | 'finance_inventory' | 'finance_payroll' | 'finance_tax' | 'finance_reports' | 'finance_setup';
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'manage_settings';
export type Scope = 'own' | 'team' | 'department' | 'company';
export interface Permission {
    module: Module;
    action: Action;
    scope: Scope;
}
export interface CurrentUser {
    employeeId: string;
    roles: AppRole[];
    departmentId?: string | null;
    teamIds?: string[];
}
export interface PermissionTarget {
    employeeId?: string;
    departmentId?: string;
    managerId?: string | null;
}
export interface JwtPayload {
    sub: string;
    email: string;
    employeeId: string | null;
    roles: AppRole[];
    firstName?: string;
    lastName?: string;
    departmentId?: string | null;
    teamIds?: string[];
}
