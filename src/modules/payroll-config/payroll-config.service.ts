import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateContractAdvantageTemplateDto,
  CreateContributionRegisterDto,
  CreateIncentiveAwardDto,
  CreateSalaryIncreaseRequestDto,
  CreateSalaryRuleDto,
  CreateSalaryStructureDto,
  PatchPayrollConfigSettingsDto,
  UpdateContractAdvantageTemplateDto,
  UpdateContributionRegisterDto,
  UpdateIncentiveAwardDto,
  UpdateSalaryIncreaseRequestDto,
  UpdateSalaryRuleDto,
  UpdateSalaryStructureDto,
} from './dto/payroll-config.dto';

const SETTINGS_ID = 'default';

const EMPLOYEE_BRIEF = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
} as const;

const DEFAULT_SETTINGS = {
  taxOnSalaryRate: 0.05,
  nssfEmployeeRate: 0.02,
  nssfEmployerRate: 0.04,
  otMultiplier: 1.5,
  workingDaysPerMonth: 22,
  seniorityPerYear: 15,
  seniorityMaxYears: 5,
  probationMonths: 3,
  sampleDisclaimer: 'Sample values — verify with accountant before real use',
};

type RuleRow = {
  id: string;
  name: string;
  nameKm: string | null;
  code: string;
  category: string;
  sequence: number | null;
  active: boolean;
  appearsOnPayslip: boolean;
  amountType: string | null;
  amountFix: Prisma.Decimal | null;
  amountPercentage: Prisma.Decimal | null;
  percentageBasedOn: string | null;
  contributionRegister: string | null;
  description: string | null;
  childRuleIds: string[];
  meta: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

type StructureRow = {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  companyName: string;
  ruleIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PayrollConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private num(value: Prisma.Decimal | null | undefined): number | undefined {
    if (value == null) return undefined;
    return Number(value);
  }

  private mapRule(row: RuleRow) {
    return {
      id: row.id,
      name: row.name,
      nameKm: row.nameKm ?? undefined,
      code: row.code,
      category: row.category,
      sequence: row.sequence ?? undefined,
      active: row.active,
      appearsOnPayslip: row.appearsOnPayslip,
      amountType: row.amountType ?? undefined,
      amountFix: this.num(row.amountFix),
      amountPercentage: this.num(row.amountPercentage),
      percentageBasedOn: row.percentageBasedOn ?? undefined,
      contributionRegister: row.contributionRegister ?? undefined,
      description: row.description ?? undefined,
      childRuleIds: row.childRuleIds,
      meta: row.meta ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapStructure(row: StructureRow) {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      parentId: row.parentId,
      companyName: row.companyName,
      ruleIds: row.ruleIds,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private rethrowUnique(err: unknown, label: string): never {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictException(`${label} code already exists`);
    }
    throw err;
  }

  async listRules() {
    const rows = await this.prisma.salaryRule.findMany({
      orderBy: [{ sequence: 'asc' }, { code: 'asc' }],
    });
    return { items: rows.map((row) => this.mapRule(row)) };
  }

  async getRule(id: string) {
    const row = await this.prisma.salaryRule.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Salary rule not found');
    return this.mapRule(row);
  }

  async createRule(dto: CreateSalaryRuleDto) {
    try {
      const row = await this.prisma.salaryRule.create({
        data: {
          name: dto.name,
          nameKm: dto.nameKm,
          code: dto.code,
          category: dto.category,
          sequence: dto.sequence,
          active: dto.active ?? true,
          appearsOnPayslip: dto.appearsOnPayslip ?? true,
          amountType: dto.amountType,
          amountFix: dto.amountFix,
          amountPercentage: dto.amountPercentage,
          percentageBasedOn: dto.percentageBasedOn,
          contributionRegister: dto.contributionRegister,
          description: dto.description,
          childRuleIds: dto.childRuleIds ?? [],
          meta: dto.meta as Prisma.InputJsonValue | undefined,
        },
      });
      return this.mapRule(row);
    } catch (err) {
      this.rethrowUnique(err, 'Salary rule');
    }
  }

  async updateRule(id: string, dto: UpdateSalaryRuleDto) {
    await this.getRule(id);
    try {
      const row = await this.prisma.salaryRule.update({
        where: { id },
        data: {
          name: dto.name,
          nameKm: dto.nameKm,
          code: dto.code,
          category: dto.category,
          sequence: dto.sequence,
          active: dto.active,
          appearsOnPayslip: dto.appearsOnPayslip,
          amountType: dto.amountType,
          amountFix: dto.amountFix,
          amountPercentage: dto.amountPercentage,
          percentageBasedOn: dto.percentageBasedOn,
          contributionRegister: dto.contributionRegister,
          description: dto.description,
          childRuleIds: dto.childRuleIds,
          meta:
            dto.meta === undefined
              ? undefined
              : (dto.meta as Prisma.InputJsonValue),
        },
      });
      return this.mapRule(row);
    } catch (err) {
      this.rethrowUnique(err, 'Salary rule');
    }
  }

  async deleteRule(id: string) {
    await this.getRule(id);
    await this.prisma.salaryRule.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async assertParent(parentId: string | null | undefined, selfId?: string) {
    if (!parentId) return;
    if (selfId && parentId === selfId) {
      throw new BadRequestException('Structure cannot be its own parent');
    }
    const parent = await this.prisma.salaryStructure.findUnique({
      where: { id: parentId },
      select: { id: true },
    });
    if (!parent) throw new BadRequestException('Parent structure not found');
  }

  async listStructures() {
    const rows = await this.prisma.salaryStructure.findMany({
      orderBy: { name: 'asc' },
    });
    return { items: rows.map((row) => this.mapStructure(row)) };
  }

  async getStructure(id: string) {
    const row = await this.prisma.salaryStructure.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Salary structure not found');
    return this.mapStructure(row);
  }

  async createStructure(dto: CreateSalaryStructureDto) {
    await this.assertParent(dto.parentId);
    try {
      const row = await this.prisma.salaryStructure.create({
        data: {
          name: dto.name,
          code: dto.code,
          parentId: dto.parentId ?? null,
          companyName: dto.companyName,
          ruleIds: dto.ruleIds ?? [],
        },
      });
      return this.mapStructure(row);
    } catch (err) {
      this.rethrowUnique(err, 'Salary structure');
    }
  }

  async updateStructure(id: string, dto: UpdateSalaryStructureDto) {
    await this.getStructure(id);
    if (dto.parentId !== undefined) await this.assertParent(dto.parentId, id);
    try {
      const row = await this.prisma.salaryStructure.update({
        where: { id },
        data: {
          name: dto.name,
          code: dto.code,
          parentId: dto.parentId === undefined ? undefined : dto.parentId,
          companyName: dto.companyName,
          ruleIds: dto.ruleIds,
        },
      });
      return this.mapStructure(row);
    } catch (err) {
      this.rethrowUnique(err, 'Salary structure');
    }
  }

  async deleteStructure(id: string) {
    await this.getStructure(id);
    await this.prisma.$transaction([
      this.prisma.salaryStructure.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      }),
      this.prisma.salaryStructure.delete({ where: { id } }),
    ]);
    return { id, deleted: true };
  }

  private async ensureSettings() {
    return this.prisma.payrollConfigSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...DEFAULT_SETTINGS },
      update: {},
    });
  }

  private mapSettings(
    row: Awaited<ReturnType<PayrollConfigService['ensureSettings']>>,
  ) {
    return {
      id: row.id,
      taxOnSalaryRate: Number(row.taxOnSalaryRate),
      nssfEmployeeRate: Number(row.nssfEmployeeRate),
      nssfEmployerRate: Number(row.nssfEmployerRate),
      otMultiplier: Number(row.otMultiplier),
      workingDaysPerMonth: row.workingDaysPerMonth,
      seniorityPerYear: Number(row.seniorityPerYear),
      seniorityMaxYears: row.seniorityMaxYears,
      probationMonths: row.probationMonths,
      sampleDisclaimer: row.sampleDisclaimer ?? undefined,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getSettings() {
    return this.mapSettings(await this.ensureSettings());
  }

  async patchSettings(dto: PatchPayrollConfigSettingsDto) {
    await this.ensureSettings();
    const data: Prisma.PayrollConfigSettingsUpdateInput = {};
    if (dto.taxOnSalaryRate !== undefined) data.taxOnSalaryRate = dto.taxOnSalaryRate;
    if (dto.nssfEmployeeRate !== undefined) data.nssfEmployeeRate = dto.nssfEmployeeRate;
    if (dto.nssfEmployerRate !== undefined) data.nssfEmployerRate = dto.nssfEmployerRate;
    if (dto.otMultiplier !== undefined) data.otMultiplier = dto.otMultiplier;
    if (dto.workingDaysPerMonth !== undefined) {
      data.workingDaysPerMonth = dto.workingDaysPerMonth;
    }
    if (dto.seniorityPerYear !== undefined) data.seniorityPerYear = dto.seniorityPerYear;
    if (dto.seniorityMaxYears !== undefined) data.seniorityMaxYears = dto.seniorityMaxYears;
    if (dto.probationMonths !== undefined) data.probationMonths = dto.probationMonths;
    if (dto.sampleDisclaimer !== undefined) data.sampleDisclaimer = dto.sampleDisclaimer;
    const row = await this.prisma.payrollConfigSettings.update({
      where: { id: SETTINGS_ID },
      data,
    });
    return this.mapSettings(row);
  }

  private mapEmployeeBrief(employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  }) {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      name: `${employee.firstName} ${employee.lastName}`,
    };
  }

  private async assertEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
  }

  private resolvePct(current: number, proposed: number, pct?: number) {
    if (pct !== undefined) return pct;
    if (current === 0) return 0;
    return Math.round(((proposed - current) / current) * 10000) / 100;
  }

  private mapContribution(row: {
    id: string;
    month: string;
    fund: string;
    employees: number;
    employeeShare: Prisma.Decimal;
    employerShare: Prisma.Decimal;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      month: row.month,
      fund: row.fund,
      employees: row.employees,
      employeeShare: Number(row.employeeShare),
      employerShare: Number(row.employerShare),
      status: row.status,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listContributionRegisters() {
    const rows = await this.prisma.contributionRegister.findMany({
      orderBy: [{ month: 'desc' }, { fund: 'asc' }],
    });
    return { items: rows.map((row) => this.mapContribution(row)) };
  }

  async getContributionRegister(id: string) {
    const row = await this.prisma.contributionRegister.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Contribution register not found');
    return this.mapContribution(row);
  }

  async createContributionRegister(dto: CreateContributionRegisterDto) {
    const row = await this.prisma.contributionRegister.create({
      data: {
        month: dto.month,
        fund: dto.fund,
        employees: dto.employees,
        employeeShare: dto.employeeShare,
        employerShare: dto.employerShare,
        status: dto.status ?? 'draft',
        notes: dto.notes,
      },
    });
    return this.mapContribution(row);
  }

  async updateContributionRegister(id: string, dto: UpdateContributionRegisterDto) {
    await this.getContributionRegister(id);
    const row = await this.prisma.contributionRegister.update({
      where: { id },
      data: {
        month: dto.month,
        fund: dto.fund,
        employees: dto.employees,
        employeeShare: dto.employeeShare,
        employerShare: dto.employerShare,
        status: dto.status,
        notes: dto.notes,
      },
    });
    return this.mapContribution(row);
  }

  async deleteContributionRegister(id: string) {
    await this.getContributionRegister(id);
    await this.prisma.contributionRegister.delete({ where: { id } });
    return { id, deleted: true };
  }

  private mapAdvantage(row: {
    id: string;
    code: string;
    name: string;
    type: string;
    amount: Prisma.Decimal;
    taxable: boolean;
    active: boolean;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      amount: Number(row.amount),
      taxable: row.taxable,
      active: row.active,
      description: row.description ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listAdvantageTemplates() {
    const rows = await this.prisma.contractAdvantageTemplate.findMany({
      orderBy: { code: 'asc' },
    });
    return { items: rows.map((row) => this.mapAdvantage(row)) };
  }

  async getAdvantageTemplate(id: string) {
    const row = await this.prisma.contractAdvantageTemplate.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Contract advantage template not found');
    return this.mapAdvantage(row);
  }

  async createAdvantageTemplate(dto: CreateContractAdvantageTemplateDto) {
    try {
      const row = await this.prisma.contractAdvantageTemplate.create({
        data: {
          code: dto.code,
          name: dto.name,
          type: dto.type,
          amount: dto.amount,
          taxable: dto.taxable ?? false,
          active: dto.active ?? true,
          description: dto.description,
        },
      });
      return this.mapAdvantage(row);
    } catch (err) {
      this.rethrowUnique(err, 'Contract advantage template');
    }
  }

  async updateAdvantageTemplate(id: string, dto: UpdateContractAdvantageTemplateDto) {
    await this.getAdvantageTemplate(id);
    try {
      const row = await this.prisma.contractAdvantageTemplate.update({
        where: { id },
        data: {
          code: dto.code,
          name: dto.name,
          type: dto.type,
          amount: dto.amount,
          taxable: dto.taxable,
          active: dto.active,
          description: dto.description,
        },
      });
      return this.mapAdvantage(row);
    } catch (err) {
      this.rethrowUnique(err, 'Contract advantage template');
    }
  }

  async deleteAdvantageTemplate(id: string) {
    await this.getAdvantageTemplate(id);
    await this.prisma.contractAdvantageTemplate.delete({ where: { id } });
    return { id, deleted: true };
  }

  private mapIncentive(row: {
    id: string;
    employeeId: string;
    period: string;
    type: string;
    amount: Prisma.Decimal;
    status: string;
    paidIn: string | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    employee: {
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
    };
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      employee: this.mapEmployeeBrief(row.employee),
      period: row.period,
      type: row.type,
      amount: Number(row.amount),
      status: row.status,
      paidIn: row.paidIn ?? undefined,
      note: row.note ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listIncentives() {
    const rows = await this.prisma.incentiveAward.findMany({
      include: { employee: { select: EMPLOYEE_BRIEF } },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    });
    return { items: rows.map((row) => this.mapIncentive(row)) };
  }

  async getIncentive(id: string) {
    const row = await this.prisma.incentiveAward.findUnique({
      where: { id },
      include: { employee: { select: EMPLOYEE_BRIEF } },
    });
    if (!row) throw new NotFoundException('Incentive award not found');
    return this.mapIncentive(row);
  }

  async createIncentive(dto: CreateIncentiveAwardDto) {
    await this.assertEmployee(dto.employeeId);
    const row = await this.prisma.incentiveAward.create({
      data: {
        employeeId: dto.employeeId,
        period: dto.period,
        type: dto.type,
        amount: dto.amount,
        status: dto.status ?? 'pending',
        paidIn: dto.paidIn,
        note: dto.note,
      },
      include: { employee: { select: EMPLOYEE_BRIEF } },
    });
    return this.mapIncentive(row);
  }

  async updateIncentive(id: string, dto: UpdateIncentiveAwardDto) {
    await this.getIncentive(id);
    if (dto.employeeId) await this.assertEmployee(dto.employeeId);
    const row = await this.prisma.incentiveAward.update({
      where: { id },
      data: {
        employeeId: dto.employeeId,
        period: dto.period,
        type: dto.type,
        amount: dto.amount,
        status: dto.status,
        paidIn: dto.paidIn,
        note: dto.note,
      },
      include: { employee: { select: EMPLOYEE_BRIEF } },
    });
    return this.mapIncentive(row);
  }

  async deleteIncentive(id: string) {
    await this.getIncentive(id);
    await this.prisma.incentiveAward.delete({ where: { id } });
    return { id, deleted: true };
  }

  private mapSalaryIncrease(row: {
    id: string;
    cycle: string;
    employeeId: string;
    currentSalary: Prisma.Decimal;
    proposedSalary: Prisma.Decimal;
    pct: Prisma.Decimal | null;
    status: string;
    effectiveDate: string;
    reason: string | null;
    appliedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    employee: {
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
    };
  }) {
    return {
      id: row.id,
      cycle: row.cycle,
      employeeId: row.employeeId,
      employee: this.mapEmployeeBrief(row.employee),
      currentSalary: Number(row.currentSalary),
      proposedSalary: Number(row.proposedSalary),
      pct: this.num(row.pct),
      status: row.status,
      effectiveDate: row.effectiveDate,
      reason: row.reason ?? undefined,
      appliedAt: row.appliedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listSalaryIncreases() {
    const rows = await this.prisma.salaryIncreaseRequest.findMany({
      include: { employee: { select: EMPLOYEE_BRIEF } },
      orderBy: [{ cycle: 'asc' }, { createdAt: 'desc' }],
    });
    return { items: rows.map((row) => this.mapSalaryIncrease(row)) };
  }

  async getSalaryIncrease(id: string) {
    const row = await this.prisma.salaryIncreaseRequest.findUnique({
      where: { id },
      include: { employee: { select: EMPLOYEE_BRIEF } },
    });
    if (!row) throw new NotFoundException('Salary increase request not found');
    return this.mapSalaryIncrease(row);
  }

  async createSalaryIncrease(dto: CreateSalaryIncreaseRequestDto) {
    await this.assertEmployee(dto.employeeId);
    const row = await this.prisma.salaryIncreaseRequest.create({
      data: {
        cycle: dto.cycle,
        employeeId: dto.employeeId,
        currentSalary: dto.currentSalary,
        proposedSalary: dto.proposedSalary,
        pct: this.resolvePct(dto.currentSalary, dto.proposedSalary, dto.pct),
        status: dto.status ?? 'in_review',
        effectiveDate: dto.effectiveDate,
        reason: dto.reason,
      },
      include: { employee: { select: EMPLOYEE_BRIEF } },
    });
    return this.mapSalaryIncrease(row);
  }

  async updateSalaryIncrease(id: string, dto: UpdateSalaryIncreaseRequestDto) {
    const existing = await this.prisma.salaryIncreaseRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Salary increase request not found');
    if (dto.employeeId) await this.assertEmployee(dto.employeeId);
    const current = dto.currentSalary ?? Number(existing.currentSalary);
    const proposed = dto.proposedSalary ?? Number(existing.proposedSalary);
    const pct =
      dto.pct !== undefined
        ? dto.pct
        : dto.currentSalary !== undefined || dto.proposedSalary !== undefined
          ? this.resolvePct(current, proposed)
          : undefined;
    const row = await this.prisma.salaryIncreaseRequest.update({
      where: { id },
      data: {
        cycle: dto.cycle,
        employeeId: dto.employeeId,
        currentSalary: dto.currentSalary,
        proposedSalary: dto.proposedSalary,
        pct,
        status: dto.status,
        effectiveDate: dto.effectiveDate,
        reason: dto.reason,
      },
      include: { employee: { select: EMPLOYEE_BRIEF } },
    });
    return this.mapSalaryIncrease(row);
  }

  async applySalaryIncrease(id: string) {
    const existing = await this.prisma.salaryIncreaseRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Salary increase request not found');
    if (existing.status !== 'approved' && existing.status !== 'applied') {
      throw new BadRequestException(
        'Salary increase can be applied only when status is approved',
      );
    }
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: existing.employeeId },
        data: { baseSalary: existing.proposedSalary },
      });
      return tx.salaryIncreaseRequest.update({
        where: { id },
        data: {
          status: 'applied',
          appliedAt: existing.appliedAt ?? new Date(),
        },
        include: { employee: { select: EMPLOYEE_BRIEF } },
      });
    });
    return this.mapSalaryIncrease(row);
  }

  async deleteSalaryIncrease(id: string) {
    await this.getSalaryIncrease(id);
    await this.prisma.salaryIncreaseRequest.delete({ where: { id } });
    return { id, deleted: true };
  }
}
