import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateResignationDto {
  @ApiProperty({ example: '2026-12-31' })
  @IsString()
  lastWorkingDay!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason!: string;

  @ApiPropertyOptional({ description: 'HR creating for another employee' })
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class StartOffboardingDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiProperty({ example: '2026-12-01' })
  @IsString()
  startDate!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsString()
  lastWorkingDay!: string;
}

export class UpdateOffboardingTaskDto {
  @ApiProperty()
  @IsBoolean()
  done!: boolean;
}

export class ExitInterviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  wouldRejoin?: boolean;
}
