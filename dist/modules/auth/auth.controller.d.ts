import type { JwtPayload } from '../../common/roles/types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto, TwoFactorVerifyDto } from './dto/two-factor.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        requires2FA: false;
        accessToken: string;
        refreshToken: string;
        user: import("./auth.service").AuthUserDto;
    } | {
        requires2FA: true;
        challengeToken: string;
        demoCodeHint: string;
    }>;
    verify2fa(dto: TwoFactorVerifyDto): Promise<{
        requires2FA: false;
        accessToken: string;
        refreshToken: string;
        user: import("./auth.service").AuthUserDto;
    } | {
        requires2FA: true;
        challengeToken: string;
        demoCodeHint: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        requires2FA: false;
        accessToken: string;
        refreshToken: string;
        user: import("./auth.service").AuthUserDto;
    } | {
        requires2FA: true;
        challengeToken: string;
        demoCodeHint: string;
    }>;
    logout(user: JwtPayload, body: Partial<RefreshDto>): Promise<{
        ok: boolean;
    }>;
    me(user: JwtPayload): Promise<import("./auth.service").AuthUserDto>;
    setup2fa(user: JwtPayload): Promise<{
        ok: boolean;
        message: string;
        demoCode: string;
    }>;
}
