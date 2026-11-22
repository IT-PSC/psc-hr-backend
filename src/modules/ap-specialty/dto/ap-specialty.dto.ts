import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCatalogueDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  nameKm!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: 'kg' })
  @IsOptional()
  @IsString()
  purchaseUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCatalogueDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateDailyIngredientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiProperty({ example: '2026-11-20' })
  @IsString()
  purchaseDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marketBuyerId?: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsArray()
  lines!: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evidenceNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedDocumentId?: string;
}

export class UpdateDailyIngredientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evidenceNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedDocumentId?: string;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  lines?: unknown[];
}

export class CreatePettyCashDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  reference!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ example: '2026-11-20' })
  @IsString()
  paidAt!: string;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fundId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateApSetupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkerEmployeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approverEmployeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultBranchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultBranchCode?: string;
}
