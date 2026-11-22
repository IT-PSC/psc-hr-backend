import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class TwoFactorVerifyDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-challenge',
    description:
      'challengeToken from POST /api/auth/login when requires2FA is true. Not an access token.',
  })
  @IsString()
  challengeToken!: string;

  @ApiProperty({
    example: '123456',
    description: 'Demo OTP for local seed. Privileged roles use this until TOTP is wired.',
  })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiPropertyOptional({
    example: false,
    description: 'When true, the success payload includes a deviceToken valid for 30 days',
  })
  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}

export class RefreshDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-refresh',
    description: 'Refresh token from login, 2FA verify, or a previous refresh',
  })
  @IsString()
  refreshToken!: string;
}
