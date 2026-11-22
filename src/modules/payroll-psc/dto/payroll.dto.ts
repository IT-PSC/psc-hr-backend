import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class PayrollLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personLabel?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  taxOnly?: boolean;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  gross!: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  employeeTax!: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  companyTax!: number;

  @ApiProperty({ example: 950 })
  @IsNumber()
  @Min(0)
  netPay!: number;

  @ApiPropertyOptional()
  @IsOptional()
  snapshot?: Record<string, unknown>;
}

export class CreatePayrollRunDto {
  @ApiProperty({ example: '2026-10' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  periodYm!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ example: 'HQ' })
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional({ type: [PayrollLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayrollLineDto)
  lines?: PayrollLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReplacePayrollLinesDto {
  @ApiProperty({ type: [PayrollLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayrollLineDto)
  lines!: PayrollLineDto[];
}

export class DecisionNoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
