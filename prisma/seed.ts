import { PrismaClient, AppRole, Action, Scope } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLE_PERMISSIONS } from '../src/common/roles/matrix';
import type { AppRole as RoleName } from '../src/common/roles/types';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';

async function main() {
  console.log('Seeding PSC HR…');

  // Clean in dependency order
  await prisma.finApPaymentProposal.deleteMany();
  await prisma.finPayrollPosting.deleteMany();
  await prisma.integrationEvent.deleteMany();
  await prisma.apDocument.deleteMany();
  await prisma.pscPayrollRun.deleteMany();
  await prisma.permissionGrant.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();

  const hr = await prisma.department.create({
    data: { id: 'dept-hr', code: 'HR', name: 'Human Resources', nameKm: 'ធនធានមនុស្ស' },
  });
  const finance = await prisma.department.create({
    data: { id: 'dept-finance', code: 'FIN', name: 'Finance', nameKm: 'ហិរញ្ញវត្ថុ' },
  });
  const ops = await prisma.department.create({
    data: { id: 'dept-ops', code: 'OPS', name: 'Operations', nameKm: 'ប្រតិបត្តិការ' },
  });
  const it = await prisma.department.create({
    data: { id: 'dept-it', code: 'IT', name: 'Information Technology', nameKm: 'បច្ចេកវិទ្យា' },
  });
  const mgmt = await prisma.department.create({
    data: { id: 'dept-mgmt', code: 'MGMT', name: 'Management', nameKm: 'គ្រប់គ្រង' },
  });

  const posCeo = await prisma.position.create({
    data: { id: 'pos-ceo', code: 'CEO', name: 'Chief Executive Officer', departmentId: mgmt.id },
  });
  const posHr = await prisma.position.create({
    data: { id: 'pos-hr-mgr', code: 'HR-MGR', name: 'HR Manager', departmentId: hr.id },
  });
  const posFin = await prisma.position.create({
    data: { id: 'pos-fin-mgr', code: 'FIN-MGR', name: 'Finance Manager', departmentId: finance.id },
  });
  const posItMgr = await prisma.position.create({
    data: { id: 'pos-it-mgr', code: 'IT-MGR', name: 'IT Manager', departmentId: it.id },
  });
  const posDev = await prisma.position.create({
    data: { id: 'pos-dev', code: 'DEV', name: 'Developer', departmentId: it.id },
  });
  await prisma.position.create({
    data: { id: 'pos-ops-mgr', code: 'OPS-MGR', name: 'Operations Manager', departmentId: ops.id },
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

  for (const p of personas) {
    await prisma.user.create({
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

  console.log(`Created ${personas.length} demo users (password: ${PASSWORD})`);
  console.log(`Created ${byKey.size} permission grants`);
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
