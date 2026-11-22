import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PatchPlatformSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyNameKm?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  workStart?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  workEnd?: string;

  @ApiPropertyOptional({ example: 'Asia/Phnom_Penh' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  checkInAllowButton?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  checkInAllowQr?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  checkInAllowLocation?: boolean;

  @ApiPropertyOptional({ example: 'allow_with_reason' })
  @IsOptional()
  @IsString()
  outsidePolicy?: string;

  @ApiPropertyOptional({ example: 'flag' })
  @IsOptional()
  @IsString()
  locationRequired?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  idleTimeoutMinutesDefault?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  idleTimeoutMinutesPrivileged?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  twoStepRoles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maskPhoneByDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payroll?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  welcomeTemplate?: Record<string, unknown>;
}

export class CreateOfficeLocationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiProperty({ example: 11.5564 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 104.9282 })
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  radiusMetres?: number;
}

export class UpdateOfficeLocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  radiusMetres?: number;
}

export class ApprovalStepDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty({ example: 'manager' })
  @IsString()
  @MinLength(1)
  role!: string;

  @ApiPropertyOptional({ example: 'any' })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;
}

export class UpsertApprovalChainDto {
  @ApiProperty({ example: 'leave' })
  @IsString()
  @MinLength(1)
  requestType!: string;

  @ApiProperty({ type: [ApprovalStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  steps!: ApprovalStepDto[];
}

export class CreateLetterTemplateDto {
  @ApiProperty({ example: 'employment_certificate' })
  @IsString()
  @MinLength(1)
  kind!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  bodyEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyKm?: string;

  @ApiPropertyOptional({ default: 'both' })
  @IsOptional()
  @IsString()
  defaultLang?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  useKhmerNumerals?: boolean;
}

export class UpdateLetterTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  kind?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  bodyEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyKm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultLang?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useKhmerNumerals?: boolean;
}

export class PatchWelcomeTemplateDto {
  @ApiProperty({ description: 'Stored on PlatformSettings.welcomeTemplate' })
  @IsObject()
  welcomeTemplate!: Record<string, unknown>;
}
