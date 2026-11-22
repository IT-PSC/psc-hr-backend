import { Injectable } from '@nestjs/common';
import { dateKeyInPhnomPenh, daysBetween, todayInPhnomPenh } from '../../common/dates';
import { PrismaService } from '../../common/prisma/prisma.service';

const ACTIVE = new Set(['active', 'probation', 'on_leave']);

type Severity = 'high' | 'medium' | 'low';
type Rule =
  | 'missing_nssf'
  | 'missing_emergency'
  | 'missing_bank'
  | 'no_active_contract'
  | 'no_manager'
  | 'no_dept_position'
  | 'missing_dob'
  | 'id_expired'
  | 'duplicate_email'
  | 'duplicate_phone'
  | 'duplicate_id';

type Issue = {
  id: string;
  employeeId: string;
  employeeCode: string;
  rule: Rule;
  severity: Severity;
  tab: string;
};

@Injectable()
export class DataQualityService {
  constructor(private readonly prisma: PrismaService) {}

  async scan() {
    const today = todayInPhnomPenh();
    const [employees, contracts, documents] = await Promise.all([
      this.prisma.employee.findMany({
        select: {
          id: true,
          employeeCode: true,
          email: true,
          phone: true,
          departmentId: true,
          positionId: true,
          managerId: true,
          status: true,
          dateOfBirth: true,
          idNumber: true,
          bankAccount: true,
          nssfNumber: true,
          emergencyContact: true,
          reports: { select: { id: true }, take: 1 },
        },
      }),
      this.prisma.employmentContract.findMany({
        where: { status: { in: ['active', 'pending_signature'] } },
        select: { employeeId: true, endDate: true },
      }),
      this.prisma.storedFile.findMany({
        where: { deletedAt: null, docType: 'id_card', expiryDate: { not: null } },
        select: { id: true, employeeId: true, expiryDate: true },
      }),
    ]);

    const active = employees.filter((employee) => ACTIVE.has(employee.status));
    const issues: Issue[] = [];
    const emailMap = new Map<string, string[]>();
    const phoneMap = new Map<string, string[]>();
    const idMap = new Map<string, string[]>();

    for (const employee of active) {
      pushKey(emailMap, employee.email.trim().toLowerCase(), employee.id);
      if (employee.phone?.trim()) pushKey(phoneMap, employee.phone.trim(), employee.id);
      if (employee.idNumber?.trim()) pushKey(idMap, employee.idNumber.trim(), employee.id);
    }

    const contracted = new Set(
      contracts
        .filter((contract) => !contract.endDate || contract.endDate >= today)
        .map((contract) => contract.employeeId),
    );

    for (const employee of active) {
      const code = employee.employeeCode;
      if (!employee.nssfNumber?.trim()) {
        issues.push(issue(employee.id, code, 'missing_nssf', 'high', 'overview'));
      }
      if (emergencyMissing(employee.emergencyContact)) {
        issues.push(
          issue(employee.id, code, 'missing_emergency', 'medium', 'overview'),
        );
      }
      if (!employee.bankAccount?.trim()) {
        issues.push(issue(employee.id, code, 'missing_bank', 'high', 'overview'));
      }
      if (!contracted.has(employee.id)) {
        issues.push(
          issue(employee.id, code, 'no_active_contract', 'high', 'overview'),
        );
      }
      const isRoot =
        employee.id === 'emp-01' || (employee.reports.length > 0 && !employee.managerId);
      if (!employee.managerId && !isRoot) {
        issues.push(issue(employee.id, code, 'no_manager', 'medium', 'positionSalary'));
      }
      if (!employee.departmentId || !employee.positionId) {
        issues.push(
          issue(employee.id, code, 'no_dept_position', 'high', 'positionSalary'),
        );
      }
      if (!employee.dateOfBirth) {
        issues.push(issue(employee.id, code, 'missing_dob', 'medium', 'overview'));
      }
      const expired = documents.find((document) => {
        if (document.employeeId !== employee.id || !document.expiryDate) return false;
        return daysBetween(today, dateKeyInPhnomPenh(document.expiryDate)) < 0;
      });
      if (expired) {
        issues.push(issue(employee.id, code, 'id_expired', 'high', 'documents'));
      }
    }

    pushDuplicates(issues, active, emailMap, 'duplicate_email');
    pushDuplicates(issues, active, phoneMap, 'duplicate_phone');
    pushDuplicates(issues, active, idMap, 'duplicate_id');

    const activeCount = active.length;
    const weight: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
    const penalty = issues.reduce((sum, item) => sum + weight[item.severity], 0);
    const max = activeCount * 8;
    const score =
      activeCount <= 0
        ? 100
        : Math.max(0, Math.min(100, Math.round(100 - (penalty / max) * 100)));

    return {
      generatedAt: new Date().toISOString(),
      today,
      activeCount,
      score,
      issueCount: issues.length,
      affectedEmployees: new Set(issues.map((item) => item.employeeId)).size,
      issues,
    };
  }
}

function issue(
  employeeId: string,
  employeeCode: string,
  rule: Rule,
  severity: Severity,
  tab: string,
): Issue {
  return { id: `${employeeId}-${rule}`, employeeId, employeeCode, rule, severity, tab };
}

function pushKey(map: Map<string, string[]>, key: string, id: string) {
  if (!key) return;
  map.set(key, [...(map.get(key) ?? []), id]);
}

function emergencyMissing(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return true;
  const contact = value as { name?: unknown; phone?: unknown };
  const name = typeof contact.name === 'string' ? contact.name.trim() : '';
  const phone = typeof contact.phone === 'string' ? contact.phone.trim() : '';
  return !name || !phone;
}

function pushDuplicates(
  issues: Issue[],
  employees: { id: string; employeeCode: string }[],
  map: Map<string, string[]>,
  rule: Rule,
) {
  const codes = new Map(employees.map((employee) => [employee.id, employee.employeeCode]));
  for (const ids of map.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      issues.push(issue(id, codes.get(id) ?? id, rule, 'high', 'overview'));
    }
  }
}
