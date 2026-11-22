import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ORG_STATUSES = ['active', 'inactive'] as const;

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Sales' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'SALES' })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerEmployeeId?: string | null;

  @ApiPropertyOptional({ enum: ORG_STATUSES, default: 'active' })
  @IsOptional()
  @IsIn(ORG_STATUSES)
  status?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class CreatePositionDto {
  @ApiProperty({ example: 'Sales Associate' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'SALES-ASSO' })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string | null;

  @ApiPropertyOptional({ enum: ORG_STATUSES, default: 'active' })
  @IsOptional()
  @IsIn(ORG_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;
}

export class UpdatePositionDto extends PartialType(CreatePositionDto) {}

export class CreateCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'PSC' })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty({ example: 'PSC' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ enum: ORG_STATUSES, default: 'active' })
  @IsOptional()
  @IsIn(ORG_STATUSES)
  status?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CreateBranchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  companyId!: string;

  @ApiProperty({ example: 'HQ' })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty({ example: 'Headquarters' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerEmployeeId?: string | null;

  @ApiPropertyOptional({ enum: ORG_STATUSES, default: 'active' })
  @IsOptional()
  @IsIn(ORG_STATUSES)
  status?: string;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}
