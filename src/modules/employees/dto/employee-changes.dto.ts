import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProfileChangeDto {
  @ApiPropertyOptional({ description: 'Defaults to the signed-in employee' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({
    description:
      'Employee profile fields to apply on approval (bankAccount, bankName, address, idNumber, emergency*)',
  })
  @IsObject()
  fields!: Record<string, unknown>;
}

export class CreateOrgChangeDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiProperty({ enum: ['promotion', 'transfer', 'salary_change'] })
  @IsIn(['promotion', 'transfer', 'salary_change'])
  kind!: 'promotion' | 'transfer' | 'salary_change';

  @ApiProperty({ example: '2026-12-01' })
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newDepartmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newPositionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newManagerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  newBaseSalary?: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason!: string;
}

export class ChangeListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export const ORG_CHANGE_KINDS = [
  'promotion',
  'transfer',
  'salary_change',
] as const;
