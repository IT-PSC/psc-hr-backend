import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const CONTRIBUTION_STATUSES = ['draft', 'submitted', 'paid'] as const;
const ADVANTAGE_TYPES = ['fixed', 'prorated', 'percentage'] as const;
const INCENTIVE_STATUSES = ['pending', 'approved', 'paid', 'rejected'] as const;
const INCREASE_STATUSES = ['in_review', 'approved', 'rejected', 'applied'] as const;

export class CreateSalaryRuleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sequence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  appearsOnPayslip?: boolean;

  @ApiPropertyOptional({ enum: ['fix', 'percentage'] })
  @IsOptional()
  @IsIn(['fix', 'percentage'])
  amountType?: 'fix' | 'percentage';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountFix?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  percentageBasedOn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contributionRegister?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  childRuleIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class UpdateSalaryRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sequence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  appearsOnPayslip?: boolean;

  @ApiPropertyOptional({ enum: ['fix', 'percentage'] })
  @IsOptional()
  @IsIn(['fix', 'percentage'])
  amountType?: 'fix' | 'percentage';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountFix?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amountPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  percentageBasedOn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contributionRegister?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  childRuleIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class CreateSalaryStructureDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  parentId?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  companyName!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ruleIds?: string[];
}

export class UpdateSalaryStructureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  companyName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ruleIds?: string[];
}

export class PatchPayrollConfigSettingsDto {
  @ApiPropertyOptional({ example: 0.05 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  taxOnSalaryRate?: number;

  @ApiPropertyOptional({ example: 0.02 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  nssfEmployeeRate?: number;

  @ApiPropertyOptional({ example: 0.04 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  nssfEmployerRate?: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  otMultiplier?: number;

  @ApiPropertyOptional({ example: 22 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  workingDaysPerMonth?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  seniorityPerYear?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  seniorityMaxYears?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(24)
  probationMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sampleDisclaimer?: string;
}

export class CreateContributionRegisterDto {
  @ApiProperty({ example: '2026-10' })
  @IsString()
  @Matches(MONTH)
  month!: string;

  @ApiProperty({ example: 'NSSF' })
  @IsString()
  @MinLength(1)
  fund!: string;

  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  employees!: number;

  @ApiProperty({ example: 210 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  employeeShare!: number;

  @ApiProperty({ example: 420 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  employerShare!: number;

  @ApiPropertyOptional({ enum: CONTRIBUTION_STATUSES, default: 'draft' })
  @IsOptional()
  @IsIn(CONTRIBUTION_STATUSES)
  status?: (typeof CONTRIBUTION_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContributionRegisterDto {
  @ApiPropertyOptional({ example: '2026-10' })
  @IsOptional()
  @IsString()
  @Matches(MONTH)
  month?: string;

  @ApiPropertyOptional({ example: 'NSSF' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  fund?: string;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  employees?: number;

  @ApiPropertyOptional({ example: 210 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  employeeShare?: number;

  @ApiPropertyOptional({ example: 420 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  employerShare?: number;

  @ApiPropertyOptional({ enum: CONTRIBUTION_STATUSES })
  @IsOptional()
  @IsIn(CONTRIBUTION_STATUSES)
  status?: (typeof CONTRIBUTION_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateContractAdvantageTemplateDto {
  @ApiProperty({ example: 'ADV-MEAL' })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty({ example: 'Meal allowance' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: ADVANTAGE_TYPES, example: 'fixed' })
  @IsIn(ADVANTAGE_TYPES)
  type!: (typeof ADVANTAGE_TYPES)[number];

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateContractAdvantageTemplateDto {
  @ApiPropertyOptional({ example: 'ADV-MEAL' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @ApiPropertyOptional({ example: 'Meal allowance' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: ADVANTAGE_TYPES })
  @IsOptional()
  @IsIn(ADVANTAGE_TYPES)
  type?: (typeof ADVANTAGE_TYPES)[number];

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateIncentiveAwardDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  employeeId!: string;

  @ApiProperty({ example: '2026-Q3' })
  @IsString()
  @MinLength(1)
  period!: string;

  @ApiProperty({ example: 'Performance bonus' })
  @IsString()
  @MinLength(1)
  type!: string;

  @ApiProperty({ example: 150 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ enum: INCENTIVE_STATUSES, default: 'pending' })
  @IsOptional()
  @IsIn(INCENTIVE_STATUSES)
  status?: (typeof INCENTIVE_STATUSES)[number];

  @ApiPropertyOptional({ example: '2026-10' })
  @IsOptional()
  @IsString()
  @Matches(MONTH)
  paidIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateIncentiveAwardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  employeeId?: string;

  @ApiPropertyOptional({ example: '2026-Q3' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  period?: string;

  @ApiPropertyOptional({ example: 'Performance bonus' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  type?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: INCENTIVE_STATUSES })
  @IsOptional()
  @IsIn(INCENTIVE_STATUSES)
  status?: (typeof INCENTIVE_STATUSES)[number];

  @ApiPropertyOptional({ example: '2026-10', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Matches(MONTH)
  paidIn?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateSalaryIncreaseRequestDto {
  @ApiProperty({ example: '2026 Annual' })
  @IsString()
  @MinLength(1)
  cycle!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  employeeId!: string;

  @ApiProperty({ example: 300 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentSalary!: number;

  @ApiProperty({ example: 330 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  proposedSalary!: number;

  @ApiPropertyOptional({ description: 'Percent points. Computed from salaries when omitted.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pct?: number;

  @ApiPropertyOptional({ enum: INCREASE_STATUSES, default: 'in_review' })
  @IsOptional()
  @IsIn(INCREASE_STATUSES)
  status?: (typeof INCREASE_STATUSES)[number];

  @ApiProperty({ example: '2026-01-01' })
  @IsString()
  @Matches(DAY)
  effectiveDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateSalaryIncreaseRequestDto {
  @ApiPropertyOptional({ example: '2026 Annual' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  cycle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  employeeId?: string;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentSalary?: number;

  @ApiPropertyOptional({ example: 330 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  proposedSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pct?: number;

  @ApiPropertyOptional({ enum: INCREASE_STATUSES })
  @IsOptional()
  @IsIn(INCREASE_STATUSES)
  status?: (typeof INCREASE_STATUSES)[number];

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  @Matches(DAY)
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
