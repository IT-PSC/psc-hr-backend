import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLetterDto {
  @ApiProperty({ example: 'employment_certificate' })
  @IsString()
  kind!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  copies?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class UpdateLetterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;
}

export class CreateKudosDto {
  @ApiProperty()
  @IsString()
  toEmployeeId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({ default: 'great_work' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateSurveyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ description: 'Question definitions JSON' })
  @Allow()
  questions!: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({ default: 'all' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  openDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  closeDate?: string;
}

export class UpdateSurveyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  openDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  closeDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Allow()
  questions?: Record<string, unknown> | unknown[];
}

export class SurveyResponseDto {
  @ApiProperty()
  @Allow()
  answers!: Record<string, unknown> | unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class CreateSuggestionDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}

export class UpdateSuggestionDto {
  @ApiPropertyOptional({ enum: ['new', 'reviewing', 'done', 'not_possible'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicReply?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnBoard?: boolean;
}
