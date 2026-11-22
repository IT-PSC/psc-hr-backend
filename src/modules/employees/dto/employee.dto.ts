import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateRelatedUserDto } from './related-user.dto';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'PSC-011' })
  @IsString()
  @MinLength(2)
  employeeCode!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

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

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nssfNumber?: string;

  @ApiPropertyOptional({
    description: '{ name, relationship, phone }',
  })
  @IsOptional()
  @IsObject()
  emergencyContact?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastWorkingDay?: string;

  @ApiPropertyOptional({
    description: 'Optional stable id (SPA persona ids). Auto-generated if omitted.',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    type: CreateRelatedUserDto,
    description:
      'Odoo-style related user: create login + roles linked to this employee in the same request.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRelatedUserDto)
  relatedUser?: CreateRelatedUserDto;
}

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['relatedUser'] as const),
) {}
