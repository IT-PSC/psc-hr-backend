import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AppRole } from '../../common/roles/types';
import { LoginDto } from './dto/login.dto';
import { TwoFactorVerifyDto } from './dto/two-factor.dto';
export interface AuthUserDto {
    id: string;
    email: string;
    employeeId: string | null;
    roles: AppRole[];
    firstName: string | null;
    lastName: string | null;
}
type LoginResult = {
    requires2FA: false;
    accessToken: string;
    refreshToken: string;
    user: AuthUserDto;
} | {
    requires2FA: true;
    challengeToken: string;
    demoCodeHint: string;
};
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    login(dto: LoginDto): Promise<LoginResult>;
    verify2fa(dto: TwoFactorVerifyDto): Promise<LoginResult>;
    refresh(refreshToken: string): Promise<LoginResult>;
    logout(refreshToken?: string, userId?: string): Promise<{
        ok: boolean;
    }>;
    me(userId: string): Promise<AuthUserDto>;
    setup2fa(userId: string): Promise<{
        ok: boolean;
        message: string;
        demoCode: string;
    }>;
    private issueTokens;
    private findActiveUserByEmail;
    private toUserDto;
    private hashToken;
}
export {};
