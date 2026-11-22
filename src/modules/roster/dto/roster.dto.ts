import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRosterPeriodDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleKm?: string;

  @ApiProperty({ example: '2026-11-01' })
  @IsString()
  startDate!: string;

  @ApiProperty({ example: '2026-11-30' })
  @IsString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class RosterCellDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiProperty()
  @IsString()
  date!: string;

  @ApiProperty()
  @IsString()
  shiftCode!: string;
}

export class UpsertRosterCellsDto {
  @ApiProperty({ type: [RosterCellDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RosterCellDto)
  cells!: RosterCellDto[];
}

export class UpsertShiftCodeDto {
  @ApiProperty({ example: 'WD' })
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labelKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timeRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dayValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOff?: boolean;
}
