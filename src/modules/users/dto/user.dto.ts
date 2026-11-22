import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const APP_ROLES = [
  'system_admin',
  'hr',
  'finance_manager',
  'manager',
  'employee',
] as const;

export class CreateUserDto {
  @ApiProperty({ example: 'new.hire@psc.com.kh' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ enum: APP_ROLES, isArray: true })
  @IsArray()
  @IsIn(APP_ROLES, { each: true })
  roles!: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ enum: APP_ROLES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(APP_ROLES, { each: true })
  roles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description:
      'Link or re-link this login to an employee (null to unlink). One user per employee.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  employeeId?: string | null;
}
