import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class StartOnboardingDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ example: '2026-12-01' })
  @IsString()
  joiningDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class UpdateOnboardingCaseDto {
  @ApiPropertyOptional({
    enum: [
      'preboarding',
      'first_day',
      'first_week',
      'day30',
      'day60',
      'day90',
      'completed',
    ],
  })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional({
    enum: ['not_started', 'in_progress', 'completed', 'overdue'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateOnboardingTaskDto {
  @ApiPropertyOptional({
    enum: ['pending', 'in_progress', 'completed', 'overdue', 'skipped'],
  })
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
  dueDate?: string;
}

export class UpsertTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({
    type: 'array',
    description: 'Task definitions [{title, category, priority, required, weight}]',
  })
  @IsArray()
  taskDefs!: Array<Record<string, unknown>>;
}
