import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOvertimeDto {
  @ApiProperty({ example: '2026-11-20' })
  @IsString()
  date!: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0.25)
  hours!: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason!: string;

  @ApiPropertyOptional({ enum: ['normal_working_day', 'day_off', 'public_holiday'] })
  @IsOptional()
  @IsString()
  otType?: string;

  @ApiPropertyOptional({ enum: ['employee', 'manager', 'other'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hoursToPay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeInPayroll?: boolean;

  @ApiPropertyOptional({ description: 'HR creating for another employee' })
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class OvertimeListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
