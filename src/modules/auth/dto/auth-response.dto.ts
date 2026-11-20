import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  employeeId!: string | null;

  @ApiProperty({ type: [String] })
  roles!: string[];

  @ApiPropertyOptional({ nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName!: string | null;
}

export class LoginSuccessDto {
  @ApiProperty({ example: false })
  requires2FA!: false;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

export class LoginChallengeDto {
  @ApiProperty({ example: true })
  requires2FA!: true;

  @ApiProperty({ description: 'Pass to POST /auth/2fa/verify' })
  challengeToken!: string;

  @ApiProperty({ example: '123456', description: 'Demo code for Swagger testing' })
  demoCodeHint!: string;
}
