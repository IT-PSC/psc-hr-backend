import { PrismaClient, AppRole, Action, Scope } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { ROLE_PERMISSIONS } from '../src/common/roles/matrix';
import type { AppRole as RoleName } from '../src/common/roles/types';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';

async function main() {
  console.log('Seeding PSC HR…');

  await prisma.telegramOutbox.deleteMany();
  await prisma.incentiveAward.deleteMany();
  await prisma.salaryIncreaseRequest.deleteMany();
  await prisma.contributionRegister.deleteMany();
  await prisma.contractAdvantageTemplate.deleteMany();
  await prisma.expenseClaim.deleteMany();
  await prisma.erInvestigation.deleteMany();
  await prisma.erSettings.deleteMany();
  await prisma.probationSettings.deleteMany();
  await prisma.salaryStructure.updateMany({ data: { parentId: null } });
  await prisma.salaryStructure.deleteMany();
  await prisma.salaryRule.deleteMany();
  await prisma.payrollConfigSettings.deleteMany();

  await prisma.staffingRequest.deleteMany();
  await prisma.orgChangeRequest.deleteMany();
  await prisma.profileChangeRequest.deleteMany();
  await prisma.shiftSwapRequest.deleteMany();
  await prisma.attendanceCorrection.deleteMany();
  await prisma.letterTemplate.deleteMany();
  await prisma.approvalChainConfig.deleteMany();
  await prisma.officeLocation.deleteMany();
  await prisma.platformSettings.deleteMany();

  // Clean in dependency order
  await prisma.finJournalLine.deleteMany();
  await prisma.finJournal.deleteMany();
  await prisma.finReceipt.deleteMany();
  await prisma.finInvoice.deleteMany();
  await prisma.finWalletMovement.deleteMany();
  await prisma.finWallet.deleteMany();
  await prisma.finCustomer.deleteMany();
  await prisma.finShift.deleteMany();
  await prisma.finCollectionBatch.deleteMany();
  await prisma.finBankStatementLine.deleteMany();
  await prisma.finInventoryMovement.deleteMany();
  await prisma.finTaxScheduleLine.deleteMany();
  await prisma.finCloseChecklist.deleteMany();
  await prisma.finAccount.deleteMany();
  await prisma.finPeriod.deleteMany();
  await prisma.finSetupConfig.deleteMany();
  await prisma.apDailyIngredient.deleteMany();
  await prisma.apPettyCash.deleteMany();
  await prisma.apCatalogueItem.deleteMany();
  await prisma.apSetupConfig.deleteMany();
  await prisma.complianceItem.deleteMany();
  await prisma.finApPaymentProposal.deleteMany();
  await prisma.finPayrollPosting.deleteMany();
  await prisma.integrationEvent.deleteMany();
  await prisma.apLine.deleteMany();
  await prisma.apDocument.deleteMany();
  await prisma.pscPayrollLine.deleteMany();
  await prisma.pscPayrollRun.deleteMany();
  await prisma.jobRun.deleteMany();
  await prisma.storedFile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.policyDocument.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.leaveBlackout.deleteMany();
  await prisma.publicHoliday.deleteMany();
  await prisma.rosterEntry.deleteMany();
  await prisma.rosterPeriod.deleteMany();
  await prisma.shiftCode.deleteMany();
  await prisma.timesheetApproval.deleteMany();
  await prisma.timesheetLock.deleteMany();
  await prisma.overtimeRequest.deleteMany();
  await prisma.onboardingTask.deleteMany();
  await prisma.onboardingCase.deleteMany();
  await prisma.onboardingTemplate.deleteMany();
  // P8 lifecycle / talent / workplace (children before parents)
  await prisma.pulseSurveyResponse.deleteMany();
  await prisma.pulseSurvey.deleteMany();
  await prisma.suggestionItem.deleteMany();
  await prisma.kudosItem.deleteMany();
  await prisma.letterRequest.deleteMany();
  await prisma.helpdeskMessage.deleteMany();
  await prisma.helpdeskTicket.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.performanceGoal.deleteMany();
  await prisma.performanceCycle.deleteMany();
  await prisma.erCase.deleteMany();
  await prisma.offboardingTask.deleteMany();
  await prisma.resignationRequest.deleteMany();
  await prisma.offboardingCase.deleteMany();
  await prisma.benefitEnrollment.deleteMany();
  await prisma.benefitPlan.deleteMany();
  await prisma.companyAsset.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.probationPip.deleteMany();
  await prisma.probationEvaluation.deleteMany();
  await prisma.probationCase.deleteMany();
  await prisma.employmentContract.deleteMany();
  await prisma.contractTemplate.deleteMany();
  await prisma.permissionGrant.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendanceDay.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.trustedDevice.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.updateMany({ data: { parentId: null } });
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.orgBranch.deleteMany();
  await prisma.orgCompany.deleteMany();

  const company = await prisma.orgCompany.create({
    data: {
      id: 'co-psc',
      code: 'PSC',
      name: 'PSC',
      status: 'active',
    },
  });
  const hq = await prisma.orgBranch.create({
    data: {
      id: 'br-hq',
      companyId: company.id,
      code: 'HQ',
      name: 'Headquarters',
      city: 'Phnom Penh',
      status: 'active',
    },
  });

  const hr = await prisma.department.create({
    data: {
      id: 'dept-hr',
      code: 'HR',
      name: 'Human Resources',
      nameKm: 'ធនធានមនុស្ស',
      companyId: company.id,
      branchId: hq.id,
      status: 'active',
    },
  });
  const finance = await prisma.department.create({
    data: {
      id: 'dept-finance',
      code: 'FIN',
      name: 'Finance',
      nameKm: 'ហិរញ្ញវត្ថុ',
      companyId: company.id,
      branchId: hq.id,
      status: 'active',
    },
  });
  const ops = await prisma.department.create({
    data: {
      id: 'dept-ops',
      code: 'OPS',
      name: 'Operations',
      nameKm: 'ប្រតិបត្តិការ',
      companyId: company.id,
      branchId: hq.id,
      status: 'active',
    },
  });
  const it = await prisma.department.create({
    data: {
      id: 'dept-it',
      code: 'IT',
      name: 'Information Technology',
      nameKm: 'បច្ចេកវិទ្យា',
      companyId: company.id,
      branchId: hq.id,
      status: 'active',
    },
  });
  const mgmt = await prisma.department.create({
    data: {
      id: 'dept-mgmt',
      code: 'MGMT',
      name: 'Management',
      nameKm: 'គ្រប់គ្រង',
      companyId: company.id,
      branchId: hq.id,
      status: 'active',
    },
  });

  const posCeo = await prisma.position.create({
    data: {
      id: 'pos-ceo',
      code: 'CEO',
      name: 'Chief Executive Officer',
      departmentId: mgmt.id,
      companyId: company.id,
      status: 'active',
    },
  });
  const posHr = await prisma.position.create({
    data: {
      id: 'pos-hr-mgr',
      code: 'HR-MGR',
      name: 'HR Manager',
      departmentId: hr.id,
      companyId: company.id,
      status: 'active',
    },
  });
  const posFin = await prisma.position.create({
    data: {
      id: 'pos-fin-mgr',
      code: 'FIN-MGR',
      name: 'Finance Manager',
      departmentId: finance.id,
      companyId: company.id,
      status: 'active',
    },
  });
  const posItMgr = await prisma.position.create({
    data: {
      id: 'pos-it-mgr',
      code: 'IT-MGR',
      name: 'IT Manager',
      departmentId: it.id,
      companyId: company.id,
      status: 'active',
    },
  });
  const posDev = await prisma.position.create({
    data: {
      id: 'pos-dev',
      code: 'DEV',
      name: 'Developer',
      departmentId: it.id,
      companyId: company.id,
      status: 'active',
    },
  });
  await prisma.position.create({
    data: {
      id: 'pos-ops-mgr',
      code: 'OPS-MGR',
      name: 'Operations Manager',
      departmentId: ops.id,
      companyId: company.id,
      status: 'active',
    },
  });

  // Match SPA demo employee ids
  const adminEmp = await prisma.employee.create({
    data: {
      id: 'emp-01',
      employeeCode: 'PSC-001',
      firstName: 'Sok',
      lastName: 'Dara',
      email: 'sok.dara@psc.com.kh',
      phone: '+855 12 345 001',
      departmentId: mgmt.id,
      positionId: posCeo.id,
      managerId: null,
      status: 'active',
      startDate: new Date('2018-01-15'),
      baseSalary: 2500,
    },
  });

  const managerEmp = await prisma.employee.create({
    data: {
      id: 'emp-03',
      employeeCode: 'PSC-003',
      firstName: 'Heng',
      lastName: 'Visal',
      email: 'heng.visal@psc.com.kh',
      phone: '+855 12 345 003',
      departmentId: it.id,
      positionId: posItMgr.id,
      managerId: adminEmp.id,
      status: 'active',
      startDate: new Date('2019-03-01'),
      baseSalary: 1800,
    },
  });

  const hrEmp = await prisma.employee.create({
    data: {
      id: 'emp-04',
      employeeCode: 'PSC-004',
      firstName: 'Kim',
      lastName: 'Sophea',
      email: 'kim.sophea@psc.com.kh',
      phone: '+855 12 345 004',
      departmentId: hr.id,
      positionId: posHr.id,
      managerId: adminEmp.id,
      status: 'active',
      startDate: new Date('2019-08-15'),
      baseSalary: 1500,
    },
  });

  const financeEmp = await prisma.employee.create({
    data: {
      id: 'emp-06',
      employeeCode: 'PSC-006',
      firstName: 'Pich',
      lastName: 'Sreyneang',
      email: 'pich.sreyneang@psc.com.kh',
      phone: '+855 12 345 006',
      departmentId: finance.id,
      positionId: posFin.id,
      managerId: adminEmp.id,
      status: 'active',
      startDate: new Date('2020-04-01'),
      baseSalary: 1450,
    },
  });

  const employeeEmp = await prisma.employee.create({
    data: {
      id: 'emp-10',
      employeeCode: 'PSC-010',
      firstName: 'Ouk',
      lastName: 'Chenda',
      email: 'ouk.chenda@psc.com.kh',
      phone: '+855 12 345 010',
      departmentId: it.id,
      positionId: posDev.id,
      managerId: managerEmp.id,
      status: 'active',
      startDate: new Date('2022-01-10'),
      baseSalary: 850,
    },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const personas: {
    email: string;
    employeeId: string;
    roles: AppRole[];
  }[] = [
    { email: 'admin@psc.local', employeeId: adminEmp.id, roles: ['system_admin', 'employee'] },
    { email: 'hr@psc.local', employeeId: hrEmp.id, roles: ['hr', 'employee'] },
    { email: 'finance@psc.local', employeeId: financeEmp.id, roles: ['finance_manager', 'employee'] },
    { email: 'manager@psc.local', employeeId: managerEmp.id, roles: ['manager', 'employee'] },
    { email: 'employee@psc.local', employeeId: employeeEmp.id, roles: ['employee'] },
  ];

  const createdUsers: { email: string; id: string }[] = [];
  for (const p of personas) {
    const u = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash,
        employeeId: p.employeeId,
        active: true,
        roles: {
          create: p.roles.map((role) => ({ role })),
        },
      },
    });
    createdUsers.push({ email: p.email, id: u.id });
  }

  const employeeUser = createdUsers.find((u) => u.email === 'employee@psc.local');
  if (employeeUser) {
    await prisma.notification.create({
      data: {
        userId: employeeUser.id,
        title: 'Welcome to PSC HR',
        titleKm: 'សូមស្វាគមន៍មកកាន់ PSC HR',
        message: 'Your account is ready. Check attendance and leave from the sidebar.',
        messageKm: 'គណនីរបស់អ្នករួចរាល់ហើយ។',
        type: 'info',
        link: '/dashboard',
      },
    });
    await prisma.notificationPreference.create({
      data: {
        userId: employeeUser.id,
        settings: {
          contractExpiring: { id: 'contractExpiring', enabled: true, daysBefore: 30 },
          probationEnding: { id: 'probationEnding', enabled: true, daysBefore: 14 },
          documentExpiring: { id: 'documentExpiring', enabled: true, daysBefore: 30 },
          birthday: { id: 'birthday', enabled: true, daysBefore: 0 },
          anniversary: { id: 'anniversary', enabled: true, daysBefore: 0 },
          approvalStale: { id: 'approvalStale', enabled: true, daysBefore: 3 },
        },
        telegramEnabled: false,
      },
    });
  }

  // Flatten ROLE_PERMISSIONS → PermissionGrant
  const grants: {
    role: AppRole;
    module: string;
    action: Action;
    scope: Scope;
  }[] = [];

  for (const role of Object.keys(ROLE_PERMISSIONS) as RoleName[]) {
    const seen = new Set<string>();
    for (const perm of ROLE_PERMISSIONS[role]) {
      const key = `${role}:${perm.module}:${perm.action}`;
      if (seen.has(key)) continue;
      seen.add(key);
      grants.push({
        role: role as AppRole,
        module: perm.module,
        action: perm.action as Action,
        scope: perm.scope as Scope,
      });
    }
  }

  // Prisma unique is [role, module, action] — keep widest scope
  const byKey = new Map<string, (typeof grants)[0]>();
  const scopeRank: Record<string, number> = {
    own: 1,
    team: 2,
    department: 3,
    company: 4,
  };
  for (const g of grants) {
    const key = `${g.role}:${g.module}:${g.action}`;
    const prev = byKey.get(key);
    if (!prev || scopeRank[g.scope] > scopeRank[prev.scope]) {
      byKey.set(key, g);
    }
  }

  await prisma.permissionGrant.createMany({
    data: [...byKey.values()],
  });

  const leaveTypes = [
    {
      id: 'lt-annual',
      name: 'Annual Leave',
      nameKm: 'ឈប់សម្រាកប្រចាំឆ្នាំ',
      daysPerYear: 18,
      monthlyAccrual: 1.5,
      paid: true,
      carryOver: true,
      maxCarryOver: 5,
      rosterCode: 'AL',
      color: '#0E9F5A',
    },
    {
      id: 'lt-sick',
      name: 'Sick Leave',
      nameKm: 'ឈប់សម្រាកឈឺ',
      daysPerYear: 12,
      monthlyAccrual: 1,
      paid: true,
      carryOver: false,
      maxCarryOver: 0,
      rosterCode: 'SL',
      color: '#2563EB',
    },
    {
      id: 'lt-special',
      name: 'Special Leave',
      nameKm: 'ឈប់សម្រាកពិសេស',
      daysPerYear: 5,
      monthlyAccrual: 0.42,
      paid: true,
      carryOver: false,
      maxCarryOver: 0,
      requiresHrApproval: true,
      rosterCode: 'SP',
      color: '#C9A24B',
    },
    {
      id: 'lt-maternity',
      name: 'Maternity Leave',
      nameKm: 'ឈប់សម្រាកសម្រាលកូន',
      daysPerYear: 90,
      monthlyAccrual: 7.5,
      paid: true,
      carryOver: false,
      maxCarryOver: 0,
      requiresHrApproval: true,
      rosterCode: 'ML',
      color: '#DB2777',
    },
    {
      id: 'lt-unpaid',
      name: 'Unpaid Leave',
      nameKm: 'ឈប់សម្រាកមិនបង់ប្រាក់',
      daysPerYear: 30,
      monthlyAccrual: 2.5,
      paid: false,
      carryOver: false,
      maxCarryOver: 0,
      rosterCode: 'UL',
      color: '#6B7280',
    },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.create({ data: lt });
  }

  const year = new Date().getFullYear();
  const empIds = [
    adminEmp.id,
    managerEmp.id,
    hrEmp.id,
    financeEmp.id,
    employeeEmp.id,
  ];
  for (const employeeId of empIds) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId: lt.id,
          year,
          total: lt.daysPerYear,
          remaining: lt.daysPerYear,
          used: 0,
        },
      });
    }
  }

  await prisma.shiftCode.createMany({
    data: [
      {
        id: 'WD',
        label: 'Work Day',
        labelKm: 'ថ្ងៃធ្វើការ',
        timeRange: '08:00-17:00',
        color: '#0E9F5A',
        dayValue: 1,
        isOff: false,
      },
      {
        id: 'OFF',
        label: 'Day Off',
        labelKm: 'ថ្ងៃសម្រាក',
        timeRange: null,
        color: '#6B7280',
        dayValue: 0,
        isOff: true,
      },
      {
        id: 'AM',
        label: 'Morning',
        labelKm: 'ព្រឹក',
        timeRange: '08:00-12:00',
        color: '#2563EB',
        dayValue: 0.5,
        isOff: false,
      },
    ],
  });

  await prisma.publicHoliday.create({
    data: {
      name: 'Independence Day',
      nameKm: 'ទិវាឯករាជ្យ',
      date: `${year}-11-09`,
      rate: 2,
    },
  });

  const hrUser = createdUsers.find((u) => u.email === 'hr@psc.local');
  if (hrUser) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to PSC HR',
        titleKm: 'សូមស្វាគមន៍',
        body: 'Backend P6 APIs are live for time, roster, payslips, and workplace content.',
        bodyKm: 'API ថ្មីរួចរាល់ហើយ។',
        target: 'all',
        published: true,
        pinned: true,
        createdBy: hrUser.id,
        author: 'Kim Sophea',
      },
    });
    await prisma.policyDocument.create({
      data: {
        title: 'Code of Conduct',
        titleKm: 'ក្រមសីលធម៌',
        version: '1.0',
        fileName: 'code-of-conduct.pdf',
        target: 'all',
        published: true,
        uploadedBy: hrUser.id,
      },
    });
  }

  console.log(`Created ${personas.length} demo users (password: ${PASSWORD})`);
  console.log(`Created ${byKey.size} permission grants`);
  console.log(`Created ${leaveTypes.length} leave types + balances for ${year}`);
  const contractTpl = await prisma.contractTemplate.create({
    data: {
      name: 'Fixed-term employment',
      nameKm: 'កិច្ចសន្យារយៈពេលកំណត់',
      contractType: 'fixed',
      bodyEn: 'Standard fixed-term employment contract.',
      bodyKm: 'កិច្ចសន្យាការងាររយៈពេលកំណត់ស្តង់ដារ។',
    },
  });

  await prisma.employmentContract.create({
    data: {
      employeeId: employeeEmp.id,
      title: 'Developer Contract',
      contractType: 'fixed',
      startDate: '2022-01-10',
      endDate: '2027-01-09',
      status: 'active',
      signedAt: new Date('2022-01-10'),
      salary: 850,
      probationEndDate: '2022-04-10',
      templateId: contractTpl.id,
    },
  });

  const probation = await prisma.probationCase.create({
    data: {
      employeeId: employeeEmp.id,
      startDate: '2022-01-10',
      endDate: '2022-04-10',
      durationMonths: 3,
      stage: 'month3',
      status: 'confirmed',
      progressPercent: 100,
      finalDecision: 'confirm',
      overallScore: 85,
    },
  });

  const job = await prisma.jobPosting.create({
    data: {
      title: 'Junior Developer',
      titleKm: 'អ្នកអភិវឌ្ឍន៍ថ្មី',
      departmentId: it.id,
      positionId: posDev.id,
      location: 'Phnom Penh',
      employmentType: 'full_time',
      status: 'open',
      published: true,
      openings: 2,
      description: 'Join the IT team.',
      postedAt: new Date(),
    },
  });

  const candidate = await prisma.candidate.create({
    data: {
      jobId: job.id,
      firstName: 'Sophy',
      lastName: 'Chan',
      email: 'sophy.chan@example.com',
      stage: 'screening',
      source: 'referral',
    },
  });

  const onboardTpl = await prisma.onboardingTemplate.create({
    data: {
      name: 'Standard onboarding',
      nameKm: 'ការចូលធ្វើការស្តង់ដារ',
      active: true,
      taskDefs: [
        { title: 'Complete personal info form', category: 'preboarding', priority: 'high', required: true, weight: 1 },
        { title: 'IT account setup', category: 'it', priority: 'high', required: true, weight: 2 },
        { title: 'Manager welcome meeting', category: 'manager', priority: 'medium', required: true, weight: 1 },
      ],
    },
  });

  const benefitPlan = await prisma.benefitPlan.create({
    data: {
      name: 'Group Health Insurance',
      nameKm: 'ធានារ៉ាប់រងសុខភាពក្រុម',
      type: 'health',
      provider: 'Infinity Insurance',
    },
  });

  const asset = await prisma.companyAsset.create({
    data: {
      name: 'MacBook Pro 14"',
      tag: 'IT-MBP-001',
      category: 'laptop',
      status: 'available',
      purchaseDate: '2025-06-01',
    },
  });

  const course = await prisma.course.create({
    data: {
      title: 'Workplace Safety Orientation',
      titleKm: 'ការណែនាំសុវត្ថិភាពកន្លែងធ្វើការ',
      category: 'compliance',
      durationHours: 2,
      status: 'published',
      mandatory: true,
      trainer: 'HR Team',
      seats: 50,
    },
  });

  await prisma.finAccount.createMany({
    data: [
      { id: 'fin-acct-1000', code: '1000', name: 'Cash on hand', type: 'cash' },
      { id: 'fin-acct-1010', code: '1010', name: 'Bank', type: 'bank' },
      { id: 'fin-acct-1200', code: '1200', name: 'Accounts receivable', type: 'asset' },
      { id: 'fin-acct-2000', code: '2000', name: 'Accounts payable', type: 'liability' },
      { id: 'fin-acct-2100', code: '2100', name: 'Output VAT', type: 'liability' },
      { id: 'fin-acct-3000', code: '3000', name: 'Equity', type: 'equity' },
      { id: 'fin-acct-4000', code: '4000', name: 'Sales revenue', type: 'revenue' },
      { id: 'fin-acct-5000', code: '5000', name: 'Operating expense', type: 'expense' },
    ],
  });
  await prisma.finPeriod.create({
    data: { id: 'fin-period-2026-11', yearMonth: '2026-11', status: 'open' },
  });
  await prisma.finSetupConfig.create({
    data: {
      id: 'default',
      entityName: 'PSC',
      vatRatePct: 10,
      salaryTaxEnabled: true,
      reportMode: 'provisional',
      financeManagerId: financeEmp.id,
      arAccountantId: financeEmp.id,
    },
  });
  await prisma.apSetupConfig.create({
    data: {
      id: 'default',
      checkerEmployeeId: financeEmp.id,
      approverEmployeeId: adminEmp.id,
      defaultBranchCode: 'HQ',
    },
  });
  await prisma.finCustomer.create({
    data: {
      id: 'fin-cust-1',
      name: 'PSC Demo Customer',
      creditLimit: 5000,
      creditTermsDays: 30,
      active: true,
    },
  });
  await prisma.apCatalogueItem.create({
    data: {
      id: 'ap-cat-rice',
      code: 'RICE-01',
      nameKm: 'អង្ករ',
      nameEn: 'Rice',
      category: 'grain',
      purchaseUnit: 'kg',
      active: true,
    },
  });
  await prisma.complianceItem.create({
    data: {
      id: 'cmp-tax-monthly',
      title: 'Monthly tax filing',
      titleKm: 'ការប្រកាសពន្ធប្រចាំខែ',
      category: 'tax',
      dueDate: '2026-11-25',
      status: 'upcoming',
    },
  });

  console.log('Created shift codes, holiday, announcement, policy');
  console.log(`Created contract template ${contractTpl.id}, job ${job.id}, onboard tpl ${onboardTpl.id}`);
  console.log(`Created benefit ${benefitPlan.id}, asset ${asset.id}, course ${course.id}`);
  console.log('Created P9 chart of accounts, period 2026-11, finance/AP setup, customer, catalogue, compliance item');
  console.log(`Created company ${company.code} and branch ${hq.code}`);

  await prisma.platformSettings.create({
    data: {
      id: 'default',
      companyName: 'PSC',
      companyNameKm: 'ភីអេសស៊ី',
      workStart: '08:00',
      workEnd: '17:00',
      timezone: 'Asia/Phnom_Penh',
      checkInAllowButton: true,
      checkInAllowQr: true,
      checkInAllowLocation: true,
      outsidePolicy: 'allow_with_reason',
      locationRequired: 'flag',
      idleTimeoutMinutesDefault: 30,
      idleTimeoutMinutesPrivileged: 120,
      twoStepRoles: ['system_admin', 'hr'],
      maskPhoneByDefault: true,
      welcomeTemplate: {
        subject: 'Welcome to PSC',
        bodyEn: 'Welcome aboard.',
        bodyKm: 'សូមស្វាគមន៍',
      },
    },
  });
  await prisma.officeLocation.create({
    data: {
      id: 'office-hq',
      name: 'HQ',
      nameKm: 'ទីស្នាក់ការកណ្តាល',
      latitude: 11.5564,
      longitude: 104.9282,
      radiusMetres: 200,
    },
  });
  await prisma.approvalChainConfig.createMany({
    data: [
      {
        requestType: 'leave',
        steps: [
          { order: 1, role: 'manager', mode: 'any' },
          { order: 2, role: 'hr', condition: 'requiresHrApproval' },
        ],
      },
      {
        requestType: 'overtime',
        steps: [{ order: 1, role: 'manager' }],
      },
      {
        requestType: 'resignation',
        steps: [
          { order: 1, role: 'manager' },
          { order: 2, role: 'hr' },
        ],
      },
    ],
  });
  await prisma.letterTemplate.create({
    data: {
      id: 'ltpl-employment',
      kind: 'employment_certificate',
      name: 'Employment certificate',
      bodyEn:
        'This is to certify that {{employeeName}} is employed at {{companyName}}.',
      bodyKm: 'លិខិតបញ្ជាក់ការងារ',
      defaultLang: 'both',
      useKhmerNumerals: false,
    },
  });

  await prisma.attendanceDay.create({
    data: {
      employeeId: employeeEmp.id,
      date: '2026-11-18',
      checkIn: new Date('2026-11-18T01:40:00.000Z'),
      checkOut: new Date('2026-11-18T10:00:00.000Z'),
      hoursWorked: 8.33,
      status: 'present',
      timezone: 'Asia/Phnom_Penh',
    },
  });

  const roster = await prisma.rosterPeriod.create({
    data: {
      id: 'roster-nov-2026',
      title: 'IT November',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      departmentId: it.id,
      status: 'published',
    },
  });

  const correction = await prisma.attendanceCorrection.create({
    data: {
      id: 'ac-demo-1',
      employeeId: employeeEmp.id,
      date: new Date('2026-11-19'),
      correctCheckIn: '08:05',
      correctCheckOut: '17:30',
      reason: 'Forgot to punch out',
      status: 'pending',
    },
  });
  await prisma.approvalRequest.create({
    data: {
      type: 'attendance_correction',
      requesterId: employeeEmp.id,
      summary: 'Attendance correction 2026-11-19',
      relatedId: correction.id,
      relatedType: 'attendance_correction',
      status: 'pending',
    },
  });

  const swap = await prisma.shiftSwapRequest.create({
    data: {
      id: 'swap-demo-1',
      periodId: roster.id,
      requesterId: employeeEmp.id,
      counterpartId: managerEmp.id,
      requesterDate: new Date('2026-11-19'),
      counterpartDate: new Date('2026-11-20'),
      reason: 'Personal appointment',
      status: 'pending',
    },
  });
  await prisma.approvalRequest.create({
    data: {
      type: 'shift_swap',
      requesterId: employeeEmp.id,
      summary: 'Shift swap Ouk Chenda ↔ Heng Visal',
      relatedId: swap.id,
      relatedType: 'shift_swap',
      status: 'pending',
    },
  });

  const profileChange = await prisma.profileChangeRequest.create({
    data: {
      id: 'pcr-demo-1',
      employeeId: employeeEmp.id,
      fields: { phone: '+855 12 000 010' },
      previousValues: { phone: employeeEmp.phone },
      status: 'pending',
    },
  });
  await prisma.approvalRequest.create({
    data: {
      type: 'profile_change',
      requesterId: employeeEmp.id,
      summary: 'Profile change for Ouk Chenda',
      relatedId: profileChange.id,
      relatedType: 'profile_change',
      status: 'pending',
    },
  });

  const orgChange = await prisma.orgChangeRequest.create({
    data: {
      id: 'ocr-demo-1',
      employeeId: employeeEmp.id,
      kind: 'salary_change',
      proposedBy: hrEmp.id,
      effectiveDate: new Date('2026-12-01'),
      newBaseSalary: 950,
      reason: 'Annual adjustment',
      status: 'pending',
    },
  });
  await prisma.approvalRequest.create({
    data: {
      type: 'org_change',
      requesterId: hrEmp.id,
      summary: 'salary_change for Ouk Chenda',
      relatedId: orgChange.id,
      relatedType: 'org_change',
      status: 'pending',
    },
  });

  const staffing = await prisma.staffingRequest.create({
    data: {
      id: 'staff-demo-1',
      requesterId: managerEmp.id,
      positionId: posDev.id,
      departmentId: it.id,
      branchId: hq.id,
      headcount: 1,
      reason: 'Backfill developer capacity',
      status: 'pending',
    },
  });
  await prisma.approvalRequest.create({
    data: {
      type: 'staffing',
      requesterId: managerEmp.id,
      summary: 'Staffing x1 for Information Technology',
      relatedId: staffing.id,
      relatedType: 'staffing',
      status: 'pending',
    },
  });

  console.log('Created P11 settings, HQ office, approval chains, letter template, and sample requests');

  await prisma.salaryRule.createMany({
    data: [
      {
        id: 'sr-basic',
        name: 'Basic Salary',
        nameKm: 'ប្រាក់ខែមូលដ្ឋាន',
        code: 'BASIC',
        category: 'Basic',
        sequence: 1,
        active: true,
        appearsOnPayslip: true,
        amountType: 'fix',
        amountFix: 0,
        childRuleIds: [],
        meta: {
          companyName: 'PSC B2B Technology',
          conditionBasedOn: 'always_true',
        },
      },
      {
        id: 'sr-nssf',
        name: 'NSSF Employee',
        code: 'NSSF',
        category: 'Deduction',
        sequence: 160,
        active: true,
        appearsOnPayslip: true,
        amountType: 'percentage',
        amountPercentage: 2,
        percentageBasedOn: 'Basic',
        contributionRegister: 'NSSF',
        childRuleIds: [],
        meta: {
          companyName: 'PSC B2B Technology',
          conditionBasedOn: 'always_true',
        },
      },
      {
        id: 'sr-gross',
        name: 'Gross Salary',
        code: 'GROSS',
        category: 'Gross',
        sequence: 100,
        active: true,
        appearsOnPayslip: true,
        amountType: 'percentage',
        amountPercentage: 100,
        percentageBasedOn: 'Basic',
        childRuleIds: [],
        meta: {
          companyName: 'PSC B2B Technology',
          conditionBasedOn: 'always_true',
        },
      },
    ],
  });
  await prisma.salaryStructure.create({
    data: {
      id: 'ss-standard',
      name: 'Standard Structure',
      code: 'STD',
      companyName: 'PSC B2B Technology',
      ruleIds: ['sr-basic', 'sr-nssf', 'sr-gross'],
    },
  });
  await prisma.payrollConfigSettings.create({
    data: {
      id: 'default',
      taxOnSalaryRate: 0.05,
      nssfEmployeeRate: 0.02,
      nssfEmployerRate: 0.04,
      otMultiplier: 1.5,
      workingDaysPerMonth: 22,
      seniorityPerYear: 15,
      seniorityMaxYears: 5,
      probationMonths: 3,
      sampleDisclaimer: 'Sample values — verify with accountant before real use',
    },
  });

  await prisma.contributionRegister.createMany({
    data: [
      {
        id: 'cr-nssf-2026-10',
        month: '2026-10',
        fund: 'NSSF',
        employees: 42,
        employeeShare: 210,
        employerShare: 420,
        status: 'draft',
      },
      {
        id: 'cr-nssf-2026-09',
        month: '2026-09',
        fund: 'NSSF',
        employees: 41,
        employeeShare: 205,
        employerShare: 410,
        status: 'submitted',
      },
      {
        id: 'cr-nssf-2026-08',
        month: '2026-08',
        fund: 'NSSF',
        employees: 40,
        employeeShare: 200,
        employerShare: 400,
        status: 'paid',
      },
      {
        id: 'cr-health-2026-10',
        month: '2026-10',
        fund: 'Health Insurance',
        employees: 38,
        employeeShare: 190,
        employerShare: 380,
        status: 'draft',
      },
    ],
  });
  await prisma.contractAdvantageTemplate.createMany({
    data: [
      {
        id: 'adv-meal',
        code: 'ADV-MEAL',
        name: 'Meal allowance',
        type: 'fixed',
        amount: 30,
        taxable: false,
        active: true,
      },
      {
        id: 'adv-trans',
        code: 'ADV-TRANS',
        name: 'Transport allowance',
        type: 'fixed',
        amount: 50,
        taxable: false,
        active: true,
      },
      {
        id: 'adv-phone',
        code: 'ADV-PHONE',
        name: 'Phone allowance',
        type: 'fixed',
        amount: 20,
        taxable: true,
        active: true,
      },
      {
        id: 'adv-housing',
        code: 'ADV-HOUSING',
        name: 'Housing support',
        type: 'prorated',
        amount: 100,
        taxable: true,
        active: false,
      },
    ],
  });
  await prisma.incentiveAward.createMany({
    data: [
      {
        id: 'inc-1',
        employeeId: employeeEmp.id,
        period: '2026-Q3',
        type: 'Performance bonus',
        amount: 150,
        status: 'approved',
        paidIn: '2026-10',
      },
      {
        id: 'inc-2',
        employeeId: adminEmp.id,
        period: '2026-Q3',
        type: 'Sales incentive',
        amount: 220,
        status: 'approved',
        paidIn: '2026-10',
      },
    ],
  });
  await prisma.salaryIncreaseRequest.createMany({
    data: [
      {
        id: 'sir-1',
        cycle: '2026 Annual',
        employeeId: employeeEmp.id,
        currentSalary: 300,
        proposedSalary: 330,
        pct: 10,
        status: 'approved',
        effectiveDate: '2026-01-01',
        reason: 'Annual adjustment',
      },
      {
        id: 'sir-2',
        cycle: '2026 Annual',
        employeeId: adminEmp.id,
        currentSalary: 450,
        proposedSalary: 480,
        pct: 6.67,
        status: 'approved',
        effectiveDate: '2026-01-01',
        reason: 'Annual adjustment',
      },
    ],
  });

  await prisma.expenseClaim.create({
    data: {
      id: 'exp-1',
      employeeId: employeeEmp.id,
      category: 'equipment',
      title: 'USB-C hub',
      amount: 28,
      date: '2026-10-05',
      status: 'approved',
      decidedAt: new Date('2026-10-06T03:00:00.000Z'),
      decidedById: hrEmp.id,
    },
  });
  const travelClaim = await prisma.expenseClaim.create({
    data: {
      id: 'exp-2',
      employeeId: managerEmp.id,
      category: 'travel',
      title: 'Client visit — Siem Reap',
      amount: 120,
      date: '2026-10-08',
      status: 'pending',
    },
  });
  await prisma.approvalRequest.create({
    data: {
      type: 'expense',
      requesterId: managerEmp.id,
      summary: 'Client visit — Siem Reap (120)',
      relatedId: travelClaim.id,
      relatedType: 'expense',
      status: 'pending',
    },
  });

  await prisma.telegramOutbox.create({
    data: {
      id: 'tg-out-1',
      channel: 'telegram',
      eventType: 'announcement.published',
      recipient: 'psc_hr_demo',
      payload: { message: 'Welcome to PSC HR Telegram outbox.' },
      status: 'sent',
      sentAt: new Date('2026-11-01T02:00:00.000Z'),
    },
  });

  await prisma.probationSettings.create({
    data: {
      id: 'default',
      defaultDurationMonths: 3,
      reviewDays: [30, 60, 90],
      categories: [
        {
          id: 'cat-job',
          name: 'Job Knowledge & Understanding',
          nameKm: 'ចំណេះដឹងការងារ',
          weight: 15,
          questions: [
            {
              id: 'q-job-1',
              text: 'Understands core job responsibilities and role expectations',
            },
          ],
        },
        {
          id: 'cat-quality',
          name: 'Quality of Work',
          nameKm: 'គុណភាពការងារ',
          weight: 20,
          questions: [
            { id: 'q-qual-1', text: 'Delivers accurate and complete work with minimal rework' },
          ],
        },
      ],
      ratingLabels: {
        '1': 'Poor',
        '2': 'Needs Improvement',
        '3': 'Good',
        '4': 'Very Good',
        '5': 'Excellent',
      },
      selfQuestions: [
        { id: 'sq-1', text: 'How confident are you in your current role?', kind: 'rating' },
        { id: 'sq-2', text: 'Have you received adequate training for your role?', kind: 'yes_no' },
        { id: 'sq-3', text: 'What support do you still need from the company?', kind: 'text' },
      ],
      reminderDaysBefore: 7,
      remindersEnabled: true,
      scoreBands: [
        { min: 4.5, max: 5, label: 'Outstanding' },
        { min: 3.5, max: 4.49, label: 'Meets Expectations' },
        { min: 2.5, max: 3.49, label: 'Needs Improvement' },
        { min: 1, max: 2.49, label: 'Unsatisfactory' },
      ],
      approvalWorkflow: 'Supervisor → HR → Management',
    },
  });

  await prisma.erSettings.create({
    data: {
      id: 'default',
      complaintCategories: [
        'Harassment',
        'Discrimination',
        'Pay & benefits',
        'Working conditions',
        'Manager conduct',
        'Other',
      ],
      grievanceTypes: ['Unfair treatment', 'Policy dispute', 'Promotion denial', 'Workload', 'Other'],
      conflictCategories: ['Interpersonal', 'Team collaboration', 'Role clarity', 'Resource dispute', 'Other'],
      violationCategories: ['Attendance', 'Code of conduct', 'Performance', 'Safety', 'Confidentiality', 'Other'],
      disciplinaryActionTypes: ['Verbal Warning', 'Written Warning', 'Final Warning', 'Suspension', 'Other'],
      priorities: ['low', 'medium', 'high', 'urgent'],
      workflowStatuses: [
        'submitted',
        'under_review',
        'assigned',
        'in_progress',
        'management_review',
        'resolved',
        'closed',
        'rejected',
      ],
      notifyOnAssignment: true,
      notifyOnOverdue: true,
      notifyOnManagementReview: true,
    },
  });
  await prisma.erInvestigation.create({
    data: {
      id: 'eri-01',
      refNo: 'INV-2026-0001',
      relatedType: 'complaint',
      relatedId: 'seed-complaint',
      investigatorId: hrEmp.id,
      startDate: '2026-10-26',
      involvedIds: [employeeEmp.id, managerEmp.id],
      evidence: [
        {
          id: 'att-i1',
          fileName: 'chat_export.pdf',
          uploadedAt: '2026-10-26T03:00:00.000Z',
          uploadedBy: hrEmp.id,
        },
      ],
      interviewNotes: 'Complainant interview completed; respondent pending.',
      findings: '',
      recommendations: '',
      status: 'in_progress',
      priority: 'urgent',
      notes: [
        {
          id: 'n-i1',
          at: '2026-10-26T03:00:00.000Z',
          authorId: hrEmp.id,
          body: 'Preserve chat logs.',
          visibility: 'internal',
        },
      ],
      timeline: [
        {
          id: 'tl-i1',
          at: '2026-10-26T03:00:00.000Z',
          label: 'Investigation opened',
          actorId: hrEmp.id,
        },
      ],
      dueDate: '2026-11-10',
    },
  });
  await prisma.auditLog.create({
    data: {
      module: 'payroll',
      action: 'seed',
      actorId: hrEmp.id,
      detail: 'Seeded payroll config, payroll niches, expense claim, and ER investigation',
    },
  });

  console.log('Created P12 payroll config, expense claims, telegram outbox, probation settings, ER investigation');
  console.log('Created P13 contribution registers, contract advantage templates, incentives, and salary increases');

  const adminUser = createdUsers.find((u) => u.email === 'admin@psc.local');
  if (!adminUser) throw new Error('admin user missing after seed');

  const storageDir = process.env.FILE_STORAGE_DIR?.trim()
    ? resolve(process.env.FILE_STORAGE_DIR)
    : resolve(process.cwd(), 'storage');
  mkdirSync(storageDir, { recursive: true });
  const storedName = 'qa-seed-note.txt';
  const storagePath = resolve(storageDir, storedName);
  const fileBody = 'PSC HR QA sample file\n';
  writeFileSync(storagePath, fileBody);
  await prisma.storedFile.create({
    data: {
      id: 'file-seed-1',
      employeeId: employeeEmp.id,
      originalName: storedName,
      storedName,
      mimeType: 'text/plain',
      sizeBytes: Buffer.byteLength(fileBody),
      storagePath,
      docType: 'other',
      visibility: 'hr_only',
      uploadedById: adminUser.id,
    },
  });

  const onboardingCase = await prisma.onboardingCase.create({
    data: {
      id: 'onb-case-seed',
      employeeId: employeeEmp.id,
      templateId: onboardTpl.id,
      joiningDate: '2026-11-21',
      stage: 'preboarding',
      status: 'in_progress',
      managerId: managerEmp.id,
      departmentId: it.id,
    },
  });
  await prisma.onboardingTask.create({
    data: {
      id: 'onb-task-seed',
      caseId: onboardingCase.id,
      title: 'Complete personal info form',
      category: 'hr',
      assigneeId: hrEmp.id,
      dueDate: '2026-11-28',
      priority: 'high',
      status: 'pending',
      required: true,
      weight: 1,
    },
  });

  const offboardingCase = await prisma.offboardingCase.create({
    data: {
      id: 'off-case-seed',
      employeeId: employeeEmp.id,
      startDate: '2026-11-21',
      lastWorkingDay: '2026-12-31',
      status: 'in_progress',
      progressPercent: 0,
    },
  });
  await prisma.offboardingTask.create({
    data: {
      id: 'off-task-seed',
      caseId: offboardingCase.id,
      label: 'Return company assets',
      ownerRole: 'hr',
      kind: 'asset_return',
      done: false,
    },
  });

  await prisma.probationPip.create({
    data: {
      id: 'pip-seed-1',
      caseId: probation.id,
      employeeId: employeeEmp.id,
      improvementArea: 'Delivery quality',
      performanceIssue: 'Missed two sprint commitments',
      expectedImprovement: 'Hit committed scope for the next cycle',
      requiredActions: 'Weekly plan review with manager',
      responsiblePersonId: managerEmp.id,
      startDate: '2026-11-21',
      targetDate: '2026-12-21',
      status: 'not_started',
    },
  });

  await prisma.interview.create({
    data: {
      id: 'iv-seed-1',
      candidateId: candidate.id,
      interviewerId: managerEmp.id,
      scheduledAt: new Date('2026-12-01T02:00:00.000Z'),
      mode: 'onsite',
      status: 'scheduled',
    },
  });

  const cycle = await prisma.performanceCycle.create({
    data: {
      id: 'perf-cycle-seed',
      name: '2026 Annual Review',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'open',
      ratingScale: 5,
      participantIds: [employeeEmp.id],
      createdBy: adminUser.id,
    },
  });
  await prisma.performanceGoal.create({
    data: {
      id: 'perf-goal-seed',
      employeeId: employeeEmp.id,
      cycleId: cycle.id,
      title: 'Ship the HR self-service module',
      progress: 20,
      dueDate: '2026-12-31',
      status: 'on_track',
      approvalStatus: 'draft',
    },
  });
  await prisma.performanceReview.create({
    data: {
      id: 'perf-review-seed',
      employeeId: employeeEmp.id,
      reviewerId: managerEmp.id,
      cycleId: cycle.id,
      status: 'draft',
      dueDate: '2026-12-15',
    },
  });

  await prisma.courseEnrollment.create({
    data: {
      id: 'enr-course-seed',
      courseId: course.id,
      employeeId: employeeEmp.id,
      status: 'enrolled',
      progress: 0,
      mandatory: true,
      dueDate: '2026-12-31',
      assignedBy: hrEmp.id,
    },
  });
  await prisma.benefitEnrollment.create({
    data: {
      id: 'enr-benefit-seed',
      planId: benefitPlan.id,
      employeeId: employeeEmp.id,
      status: 'enrolled',
    },
  });

  const payrollRun = await prisma.pscPayrollRun.create({
    data: {
      id: 'pay-run-seed',
      periodYm: '2026-11',
      status: 'draft',
      currency: 'USD',
      totalAmount: 850,
    },
  });
  await prisma.finPayrollPosting.create({
    data: {
      id: 'fin-pay-post-seed',
      eventId: 'evt-payroll-seed',
      payrollRunId: payrollRun.id,
      amount: 850,
      currency: 'USD',
      status: 'draft',
      periodYm: '2026-11',
    },
  });

  const apDoc = await prisma.apDocument.create({
    data: {
      id: 'ap-doc-seed',
      docNumber: 'AP-SEED-001',
      docType: 'PR',
      supplier: 'QA Vendor',
      purpose: 'Seed payment proposal',
      currency: 'USD',
      amount: 40,
      openBalance: 40,
      status: 'approved',
      settlementStatus: 'unpaid',
      preparerId: financeEmp.id,
    },
  });
  await prisma.finApPaymentProposal.create({
    data: {
      id: 'ap-proposal-seed',
      eventId: 'evt-ap-seed',
      apDocumentId: apDoc.id,
      amount: 40,
      currency: 'USD',
      status: 'draft',
    },
  });

  const invoice = await prisma.finInvoice.create({
    data: {
      id: 'fin-inv-seed',
      invoiceNo: 'INV-SEED-001',
      customerId: 'fin-cust-1',
      branchId: hq.id,
      businessDate: '2026-11-20',
      status: 'posted',
      net: 100,
      outputVat: 10,
      gross: 110,
    },
  });
  await prisma.finShift.create({
    data: {
      id: 'fin-shift-seed',
      branchId: hq.id,
      terminal: 'T1',
      cashierId: financeEmp.id,
      businessDate: '2026-11-20',
      status: 'open',
      openingFloat: 100,
    },
  });
  await prisma.finReceipt.create({
    data: {
      id: 'fin-rcpt-seed',
      invoiceId: invoice.id,
      method: 'cash',
      amount: 25,
      confirmationStatus: 'pending',
    },
  });
  await prisma.finCollectionBatch.create({
    data: {
      id: 'fin-batch-seed',
      branchId: hq.id,
      sourceAccount: '1000',
      destinationAccount: '1010',
      status: 'draft',
      receiptIds: [],
      receivedAmount: 0,
    },
  });
  await prisma.finBankStatementLine.create({
    data: {
      id: 'fin-bank-seed',
      statementDate: '2026-11-20',
      description: 'Unmatched customer transfer',
      amount: 50,
      matchStatus: 'unmatched',
    },
  });
  await prisma.finInventoryMovement.create({
    data: {
      id: 'fin-inv-mov-seed',
      itemCode: 'RICE-01',
      itemName: 'Rice',
      location: 'HQ',
      type: 'receipt',
      quantity: 10,
      unitCost: 1,
      amount: 10,
      approvalStatus: 'pending',
    },
  });
  await prisma.finTaxScheduleLine.create({
    data: {
      id: 'fin-tax-seed',
      kind: 'vat_output',
      period: '2026-11',
      base: 100,
      amount: 10,
      outstanding: 10,
      ref: 'INV-SEED-001',
    },
  });
  await prisma.finCloseChecklist.create({
    data: {
      id: 'fin-close-seed',
      period: '2026-11',
      itemKey: 'bank-rec',
      label: 'Bank reconciliation',
      owner: 'finance',
      done: false,
      due: '2026-11-30',
    },
  });

  console.log('Created P14 QA fixtures (file, lifecycle tasks, performance, finance drafts)');
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
