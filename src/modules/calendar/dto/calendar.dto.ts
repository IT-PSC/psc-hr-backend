import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiProperty({ example: '2026-12-25' })
  @IsString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rate?: number;
}

export class CreateBlackoutDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiProperty()
  @IsString()
  startDate!: string;

  @ApiProperty()
  @IsString()
  endDate!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  departmentIds?: string[];

  @ApiPropertyOptional({ enum: ['block', 'warn'] })
  @IsOptional()
  @IsString()
  mode?: string;
}
