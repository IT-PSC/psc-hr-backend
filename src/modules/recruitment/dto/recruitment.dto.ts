import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

const APP_ROLES = [
  'system_admin',
  'hr',
  'finance_manager',
  'manager',
  'employee',
] as const;

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  openings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ enum: ['draft', 'open', 'on_hold', 'closed'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateJobDto extends CreateJobDto {}

export class CreateCandidateDto {
  @ApiProperty()
  @IsString()
  jobId!: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty()
  @IsString()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCandidateDto {
  @ApiPropertyOptional({
    enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
  })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    enum: ['none', 'draft', 'sent', 'accepted', 'declined'],
  })
  @IsOptional()
  @IsString()
  offerStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offerSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offerStartDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectReason?: string;
}

export class ConvertCandidateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Create a login for the new employee' })
  @IsOptional()
  @IsBoolean()
  createUser?: boolean;

  @ApiPropertyOptional({ description: 'Defaults to Password123! when createUser is true' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;

  @ApiPropertyOptional({ enum: APP_ROLES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(APP_ROLES, { each: true })
  roles?: string[];
}

export class CreateInterviewDto {
  @ApiProperty()
  @IsString()
  candidateId!: string;

  @ApiProperty()
  @IsString()
  scheduledAt!: string;

  @ApiPropertyOptional({ enum: ['onsite', 'online'] })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interviewerId?: string;
}

export class UpdateInterviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ enum: ['scheduled', 'completed', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  score?: number;
}
