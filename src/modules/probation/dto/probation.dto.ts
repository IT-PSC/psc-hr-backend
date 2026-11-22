import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProbationCaseDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiProperty()
  @IsString()
  startDate!: string;

  @ApiProperty()
  @IsString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  durationMonths?: number;
}

export class UpdateProbationCaseDto {
  @ApiPropertyOptional({ enum: ['month1', 'month2', 'month3'] })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  progressPercent?: number;
}

export class DecideProbationDto {
  @ApiProperty({ enum: ['confirm', 'extend', 'terminate', 'other'] })
  @IsString()
  finalDecision!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  decisionRemarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  extensionMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpsertEvaluationDto {
  @ApiProperty({ enum: [1, 2, 3] })
  @IsInt()
  @Min(1)
  @Max(3)
  month!: number;

  @ApiProperty({ enum: ['self', 'supervisor'] })
  @IsString()
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  answers?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightedScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ enum: ['draft', 'submitted'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpsertPipDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  improvementArea!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  performanceIssue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedImprovement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requiredActions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsiblePersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class PatchProbationSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  defaultDurationMonths?: number;

  @ApiPropertyOptional({ type: [Number], example: [30, 60, 90] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  reviewDays?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  categories?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  ratingLabels?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  selfQuestions?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  reminderDaysBefore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  scoreBands?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalWorkflow?: string;
}
