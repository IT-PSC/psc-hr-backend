/**
 * Canonical Swagger tags, in module order.
 * UI may sort them alphabetically; this array is the source of truth for names and descriptions.
 */
export const SWAGGER_TAGS: { name: string; description: string }[] = [
  {
    name: 'Authentication & Sessions',
    description:
      'Login, demo 2FA, refresh-token rotation, logout, and the current user profile. Privileged roles receive a 2FA challenge before access tokens are issued.',
  },
  {
    name: 'Users & Roles',
    description:
      'User accounts and the role permission matrix. System administrators create users and replace the grants stored for each AppRole.',
  },
  {
    name: 'Employees',
    description:
      'Employee master data, profile edits, and requests to change a profile or org assignment. Approval of those requests is recorded under Approvals.',
  },
  {
    name: 'Organization',
    description:
      'Companies, branches, departments, positions, and the organization chart used by employee records.',
  },
  {
    name: 'Attendance',
    description:
      'Daily attendance, check-in and check-out, corrections, shift swaps, and reconciliation. Corrections and swaps are decided in Approvals.',
  },
  {
    name: 'Leave Management',
    description:
      'Leave types, balances, and leave requests. Managers and HR decide requests through the shared Approvals inbox.',
  },
  {
    name: 'Overtime',
    description:
      'Overtime requests and cancellation. Approval updates the request from the Approvals module.',
  },
  {
    name: 'Timesheet',
    description:
      'Monthly timesheet summaries, submit, and lock. Approval is handled by Approvals.',
  },
  {
    name: 'Roster',
    description:
      'Shift definitions, roster periods, cells, and publishing a draft roster.',
  },
  {
    name: 'Team Calendar',
    description:
      'Team calendar events composed with company holidays and blackout dates.',
  },
  {
    name: 'Approvals',
    description:
      'Shared approval inbox and decide actions for leave, overtime, timesheets, expenses, attendance changes, and HR requests.',
  },
  {
    name: 'Probation',
    description:
      'Probation cases, evaluations, performance-improvement plans, confirm or extend decisions, and probation settings.',
  },
  {
    name: 'Performance',
    description:
      'Performance cycles, goals, and reviews. Managers can edit and approve reviews for their team.',
  },
  {
    name: 'Recruitment',
    description:
      'Job openings, candidates, interviews, staffing requests, and converting an accepted candidate into an employee.',
  },
  {
    name: 'Onboarding',
    description:
      'Onboarding cases, task templates, and task progress for a new hire.',
  },
  {
    name: 'Lifecycle',
    description:
      'Resignation requests and offboarding cases, checklist tasks, and exit interviews.',
  },
  {
    name: 'Training',
    description:
      'Training courses and enrollments, including progress and completion.',
  },
  {
    name: 'Employee Relations',
    description:
      'Employee-relations cases, investigations, and ER settings.',
  },
  {
    name: 'Contracts',
    description:
      'Employment contracts and templates, including renewal and archive.',
  },
  {
    name: 'Payroll',
    description:
      'PSC payroll runs, payslips, salary rules and structures, contribution registers, advantages, incentives, and salary-increase requests.',
  },
  {
    name: 'Accounts Payable',
    description:
      'Accounts-payable documents plus the specialty catalogue: ingredients, petty cash, and AP setup.',
  },
  {
    name: 'Finance',
    description:
      'Ledger, accounts receivable, cashier, collections, wallets, payments, inventory, payroll postings, tax, and finance setup. All finance sub-areas use this single tag.',
  },
  {
    name: 'Expenses',
    description:
      'Employee expense claims. Decisions go through Approvals and are authorized with the benefits permission.',
  },
  {
    name: 'Benefits',
    description: 'Benefit plans and employee enrollments, including cancellation.',
  },
  {
    name: 'Assets',
    description: 'Company asset inventory, assignment to employees, and returns.',
  },
  {
    name: 'Workplace',
    description:
      'Announcements, policies and acknowledgements, HR letters, recognition, surveys, and suggestions.',
  },
  {
    name: 'Helpdesk',
    description: 'Internal support tickets and ticket messages.',
  },
  {
    name: 'Notifications',
    description:
      'In-app notifications, mark-as-read, and notification settings.',
  },
  {
    name: 'Documents',
    description:
      'Upload, list, and download files stored for employees and HR documents.',
  },
  {
    name: 'Reports & Compliance',
    description:
      'HR and finance summaries, the compliance register, data-quality scans, and the audit log.',
  },
  {
    name: 'Dashboard',
    description:
      'Role-scoped headcount and finance snapshot for the home dashboard.',
  },
  {
    name: 'System Settings',
    description:
      'Platform settings, office locations, approval chains, letter templates, and the welcome template.',
  },
  {
    name: 'Integrations',
    description:
      'Background workers (punch reminder, Telegram, exports) and the Telegram outbox integration.',
  },
  {
    name: 'System',
    description:
      'Process liveness check. This route is public and does not require a JWT.',
  },
];
