import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertPayslipDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiProperty({ example: '2026-11' })
  @IsString()
  month!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  allowances?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  overtime?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deductions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netPay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  workedDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tax?: number;
}

export class PayslipListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;
}
