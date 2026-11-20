"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const DEMO_2FA_CODE = '123456';
const ROLES_REQUIRING_2FA = [
    'system_admin',
    'hr',
    'finance_manager',
];
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async login(dto) {
        const user = await this.findActiveUserByEmail(dto.email);
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid email or password');
        const roles = user.roles.map((r) => r.role);
        const needs2fa = user.twoFactorEnabled ||
            roles.some((r) => ROLES_REQUIRING_2FA.includes(r));
        if (needs2fa && !dto.deviceToken) {
            const challengeToken = await this.jwt.signAsync({ sub: user.id, purpose: '2fa' }, {
                secret: this.config.getOrThrow('JWT_SECRET'),
                expiresIn: '10m',
            });
            return {
                requires2FA: true,
                challengeToken,
                demoCodeHint: DEMO_2FA_CODE,
            };
        }
        return this.issueTokens(user.id);
    }
    async verify2fa(dto) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(dto.challengeToken, {
                secret: this.config.getOrThrow('JWT_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired challenge');
        }
        if (payload.purpose !== '2fa') {
            throw new common_1.BadRequestException('Invalid challenge token');
        }
        if (dto.code.trim() !== DEMO_2FA_CODE) {
            throw new common_1.UnauthorizedException('Invalid verification code');
        }
        return this.issueTokens(payload.sub, dto.rememberDevice === true);
    }
    async refresh(refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const row = await this.prisma.refreshToken.findFirst({
            where: { tokenHash, expiresAt: { gt: new Date() } },
        });
        if (!row)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        await this.prisma.refreshToken.delete({ where: { id: row.id } });
        return this.issueTokens(row.userId);
    }
    async logout(refreshToken, userId) {
        if (refreshToken) {
            const tokenHash = this.hashToken(refreshToken);
            await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
        }
        else if (userId) {
            await this.prisma.refreshToken.deleteMany({ where: { userId } });
        }
        return { ok: true };
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: true, employee: true },
        });
        if (!user || !user.active) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.toUserDto(user);
    }
    async setup2fa(userId) {
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
    async issueTokens(userId, _rememberDevice = false) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: true,
                employee: { include: { reports: { select: { id: true } } } },
            },
        });
        if (!user || !user.active) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const roles = user.roles.map((r) => r.role);
        const teamIds = user.employee?.reports.map((r) => r.id) ?? [];
        const payload = {
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
            secret: this.config.getOrThrow('JWT_SECRET'),
            expiresIn: (this.config.get('JWT_EXPIRES_IN') ?? '8h'),
        });
        const refreshToken = (0, crypto_1.randomBytes)(48).toString('hex');
        const days = Number(this.config.get('JWT_REFRESH_DAYS') ?? 30);
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: this.hashToken(refreshToken),
                expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
            },
        });
        return {
            requires2FA: false,
            accessToken,
            refreshToken,
            user: this.toUserDto(user),
        };
    }
    async findActiveUserByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                roles: true,
                employee: { include: { reports: { select: { id: true } } } },
            },
        });
        if (!user || !user.active) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return user;
    }
    toUserDto(user) {
        return {
            id: user.id,
            email: user.email,
            employeeId: user.employeeId,
            roles: user.roles.map((r) => r.role),
            firstName: user.employee?.firstName ?? null,
            lastName: user.employee?.lastName ?? null,
        };
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map