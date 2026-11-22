import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 'usr-demo-employee' })
  id!: string;

  @ApiProperty({ example: 'employee@psc.local' })
  email!: string;

  @ApiPropertyOptional({ example: 'emp-10', nullable: true })
  employeeId!: string | null;

  @ApiProperty({
    example: ['employee'],
    type: [String],
    description:
      'AppRole values only: system_admin, hr, finance_manager, manager, employee',
  })
  roles!: string[];

  @ApiPropertyOptional({ example: 'Ouk', nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ example: 'Chenda', nullable: true })
  lastName!: string | null;
}

export class LoginSuccessDto {
  @ApiProperty({ example: false })
  requires2FA!: false;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-access',
    description: 'Paste this value into Authorize. Short-lived JWT.',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-refresh',
    description: 'Send to POST /api/auth/refresh or POST /api/auth/logout',
  })
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiPropertyOptional({
    example: 'dev-trusted-device-token',
    description: 'Present when rememberDevice was requested on 2FA verify',
  })
  deviceToken?: string;
}

export class LoginChallengeDto {
  @ApiProperty({ example: true })
  requires2FA!: true;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-challenge',
    description: 'Pass to POST /api/auth/2fa/verify as challengeToken',
  })
  challengeToken!: string;

  @ApiProperty({
    example: '123456',
    description: 'Demo code returned by the local seed so Swagger can complete 2FA',
  })
  demoCodeHint!: string;
}
