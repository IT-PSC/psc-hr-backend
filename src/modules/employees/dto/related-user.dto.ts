import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { APP_ROLES } from '../../users/dto/user.dto';

export class CreateRelatedUserDto {
  @ApiPropertyOptional({
    description: 'Login email (defaults to employee work email)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ minLength: 6, example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    enum: APP_ROLES,
    isArray: true,
    default: ['employee'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(APP_ROLES, { each: true })
  roles?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateRelatedUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: APP_ROLES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(APP_ROLES, { each: true })
  roles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class LinkRelatedUserDto {
  @ApiPropertyOptional({ description: 'Existing user id to link' })
  @ValidateIf((o: LinkRelatedUserDto) => !o.email)
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Existing user email to link' })
  @ValidateIf((o: LinkRelatedUserDto) => !o.userId)
  @IsEmail()
  email?: string;
}
