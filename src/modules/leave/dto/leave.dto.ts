import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({ example: 'lt-annual' })
  @IsString()
  leaveTypeId!: string;

  @ApiProperty({ example: '2026-12-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-12-03' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  halfDay?: boolean;

  @ApiPropertyOptional({ enum: ['am', 'pm'] })
  @IsOptional()
  @IsString()
  halfDayPeriod?: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0.5)
  days!: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason!: string;

  @ApiPropertyOptional({
    description: 'HR submitting on behalf of another employee',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentName?: string;
}

export class CreateLeaveTypeDto {
  @ApiPropertyOptional({ description: 'Defaults to lt-{slug} from name' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  daysPerYear!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyAccrual?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  carryOver?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCarryOver?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresHrApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rosterCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateLeaveTypeDto {
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
  @IsNumber()
  @Min(0)
  daysPerYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyAccrual?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  carryOver?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCarryOver?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresHrApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rosterCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}

export class LeaveListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'pending | approved | rejected | cancelled',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
