import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AppRole, JwtPayload } from '../../common/roles/types';
import { LoginDto } from './dto/login.dto';
import { TwoFactorVerifyDto } from './dto/two-factor.dto';

const DEMO_2FA_CODE = '123456';
const ROLES_REQUIRING_2FA: AppRole[] = [
  'system_admin',
  'hr',
  'finance_manager',
];
const TRUSTED_DEVICE_DAYS = 30;

export interface AuthUserDto {
  id: string;
  email: string;
  employeeId: string | null;
  roles: AppRole[];
  firstName: string | null;
  lastName: string | null;
}

type LoginResult =
  | {
      requires2FA: false;
      accessToken: string;
      refreshToken: string;
      user: AuthUserDto;
      deviceToken?: string;
    }
  | {
      requires2FA: true;
      challengeToken: string;
      demoCodeHint: string;
    };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.findActiveUserByEmail(dto.email);
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    const roles = user.roles.map((r) => r.role as AppRole);
    const needs2fa =
      user.twoFactorEnabled ||
      roles.some((r) => ROLES_REQUIRING_2FA.includes(r));

    if (needs2fa) {
      const trusted = await this.isTrustedDevice(user.id, dto.deviceToken);
      if (!trusted) {
        const challengeToken = await this.jwt.signAsync(
          { sub: user.id, purpose: '2fa' },
          {
            secret: this.config.getOrThrow<string>('JWT_SECRET'),
            expiresIn: '10m' as StringValue,
          },
        );
        return {
          requires2FA: true,
          challengeToken,
          demoCodeHint: DEMO_2FA_CODE,
        };
      }
    }

    return this.issueTokens(user.id, false);
  }

  async verify2fa(dto: TwoFactorVerifyDto): Promise<LoginResult> {
    let payload: { sub: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(dto.challengeToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired challenge');
    }
    if (payload.purpose !== '2fa') {
      throw new BadRequestException('Invalid challenge token');
    }
    if (dto.code.trim() !== DEMO_2FA_CODE) {
      throw new UnauthorizedException('Invalid verification code');
    }
    return this.issueTokens(payload.sub, dto.rememberDevice === true);
  }

  async refresh(refreshToken: string): Promise<LoginResult> {
    const tokenHash = this.hashToken(refreshToken);
    const row = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!row) throw new UnauthorizedException('Invalid refresh token');
    await this.prisma.refreshToken.delete({ where: { id: row.id } });
    return this.issueTokens(row.userId, false);
  }

  async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    } else if (userId) {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return { ok: true };
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, employee: true },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('User not found');
    }
    return this.toUserDto(user);
  }

  async setup2fa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return {
      ok: true,
      message: '2FA enabled (demo OTP 123456 until TOTP is wired)',
      demoCode: DEMO_2FA_CODE,
    };
  }

  private async isTrustedDevice(
    userId: string,
    deviceToken?: string,
  ): Promise<boolean> {
    if (!deviceToken || !deviceToken.trim()) return false;
    const tokenHash = this.hashToken(deviceToken.trim());
    const row = await this.prisma.trustedDevice.findFirst({
      where: {
        userId,
        tokenHash,
        expiresAt: { gt: new Date() },
      },
    });
    return Boolean(row);
  }

  private async issueTokens(
    userId: string,
    rememberDevice = false,
  ): Promise<Extract<LoginResult, { requires2FA: false }>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        employee: { include: { reports: { select: { id: true } } } },
      },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('User not found');
    }

    const roles = user.roles.map((r) => r.role as AppRole);
    const teamIds = user.employee?.reports.map((r) => r.id) ?? [];
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      employeeId: user.employeeId,
      roles,
      firstName: user.employee?.firstName,
      lastName: user.employee?.lastName,
      departmentId: user.employee?.departmentId,
      teamIds,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ??
        '8h') as StringValue,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const days = Number(this.config.get('JWT_REFRESH_DAYS') ?? 30);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });

    let deviceToken: string | undefined;
    if (rememberDevice) {
      deviceToken = randomBytes(32).toString('hex');
      await this.prisma.trustedDevice.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(deviceToken),
          label: 'remembered-browser',
          expiresAt: new Date(
            Date.now() + TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
      });
    }

    return {
      requires2FA: false,
      accessToken,
      refreshToken,
      user: this.toUserDto(user),
      ...(deviceToken ? { deviceToken } : {}),
    };
  }

  private async findActiveUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: true,
        employee: { include: { reports: { select: { id: true } } } },
      },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  private toUserDto(user: {
    id: string;
    email: string;
    employeeId: string | null;
    roles: { role: string }[];
    employee?: { firstName: string; lastName: string } | null;
  }): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      roles: user.roles.map((r) => r.role as AppRole),
      firstName: user.employee?.firstName ?? null,
      lastName: user.employee?.lastName ?? null,
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
