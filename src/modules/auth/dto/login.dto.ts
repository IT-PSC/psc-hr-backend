import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'employee@psc.local',
    description:
      'Seeded demo emails: admin@psc.local, hr@psc.local, finance@psc.local, manager@psc.local, employee@psc.local',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Local seed password for every demo user',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    example: 'dev-trusted-device-token',
    description:
      'Opaque trusted-device token from a previous 2FA verify with rememberDevice=true. Skips the 2FA challenge when it is still valid.',
  })
  @IsOptional()
  @IsString()
  deviceToken?: string;
}
