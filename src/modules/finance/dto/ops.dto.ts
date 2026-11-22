import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class OpenShiftDto {
  @ApiProperty({ example: '2026-11-20' })
  @IsString()
  businessDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terminal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cashierId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingFloat?: number;
}

export class CloseShiftDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  countedCash!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedCash?: number;
}

export class CreateCollectionBatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationAccount?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  receiptIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  receivedAmount?: number;
}

export class ConfirmBatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  confirmedAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  feeAmount?: number;
}

export class CreateBankLineDto {
  @ApiProperty({ example: '2026-11-20' })
  @IsString()
  statementDate!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount!: number;
}

export class MatchBankLineDto {
  @ApiProperty()
  @IsString()
  matchedBatchId!: string;
}

export class CreateWalletDto {
  @ApiProperty()
  @IsString()
  customerId!: string;
}

export class WalletMovementDto {
  @ApiProperty({ enum: ['load', 'redeem', 'bonus', 'reserve', 'release'] })
  @IsIn(['load', 'redeem', 'bonus', 'reserve', 'release'])
  type!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class CreateInventoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  itemCode!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  itemName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ enum: ['receipt', 'issue', 'adjustment'] })
  @IsIn(['receipt', 'issue', 'adjustment'])
  type!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;
}

export class CreateTaxLineDto {
  @ApiProperty({ enum: ['vat_output', 'vat_input', 'salary_tax', 'other'] })
  @IsIn(['vat_output', 'vat_input', 'salary_tax', 'other'])
  kind!: string;

  @ApiProperty({ example: '2026-11' })
  @IsString()
  period!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  base?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outstanding?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ref?: string;
}

export class UpdateTaxLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  base?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outstanding?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ref?: string;
}

export class RemitTaxDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

export class UpdateSetupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultBranchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  arAccountantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  financeManagerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vatRatePct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  salaryTaxEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['provisional', 'final'] })
  @IsOptional()
  @IsIn(['provisional', 'final'])
  reportMode?: string;
}

export class CreateCloseItemDto {
  @ApiProperty({ example: '2026-11' })
  @IsString()
  period!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  itemKey!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  due?: string;
}

export class UpdateCloseItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  due?: string;
}
