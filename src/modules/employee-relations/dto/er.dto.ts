import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class ErListQueryDto {
  @ApiPropertyOptional({ enum: ['complaint', 'grievance', 'conflict', 'disciplinary'] })
  @IsOptional()
  @IsString()
  type?: string;
}

export class CreateErCaseDto {
  @ApiProperty({ enum: ['complaint', 'grievance', 'conflict', 'disciplinary'] })
  @IsString()
  type!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: 'medium' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  involvedIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class UpdateErCaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;
}

const RELATED = ['complaint', 'grievance', 'conflict', 'disciplinary'] as const;

export class InvestigationListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: RELATED })
  @IsOptional()
  @IsIn(RELATED)
  relatedType?: string;
}

export class CreateErInvestigationDto {
  @ApiProperty({ enum: RELATED })
  @IsIn(RELATED)
  relatedType!: (typeof RELATED)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  relatedId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  investigatorId!: string;

  @ApiProperty({ example: '2026-10-26' })
  @IsString()
  startDate!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  involvedIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  evidence?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interviewNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managementDecision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  notes?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  timeline?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class UpdateErInvestigationDto {
  @ApiPropertyOptional({ enum: RELATED })
  @IsOptional()
  @IsIn(RELATED)
  relatedType?: (typeof RELATED)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  investigatorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  involvedIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  evidence?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interviewNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managementDecision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  notes?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  timeline?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class PatchErSettingsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  complaintCategories?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  grievanceTypes?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  conflictCategories?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  violationCategories?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  disciplinaryActionTypes?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  priorities?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  workflowStatuses?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnAssignment?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnOverdue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnManagementReview?: boolean;
}
