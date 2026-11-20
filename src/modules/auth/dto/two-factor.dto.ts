import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class TwoFactorVerifyDto {
  @ApiProperty({ description: 'Challenge token from login when requires2FA=true' })
  @IsString()
  challengeToken!: string;

  @ApiProperty({ example: '123456', description: 'Demo OTP — replace with TOTP in production' })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiPropertyOptional({ description: 'Remember this device for 30 days' })
  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}
