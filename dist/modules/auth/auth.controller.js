"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const two_factor_dto_1 = require("./dto/two-factor.dto");
const auth_response_dto_1 = require("./dto/auth-response.dto");
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    login(dto) {
        return this.auth.login(dto);
    }
    verify2fa(dto) {
        return this.auth.verify2fa(dto);
    }
    refresh(dto) {
        return this.auth.refresh(dto.refreshToken);
    }
    logout(user, body) {
        return this.auth.logout(body.refreshToken, user.sub);
    }
    me(user) {
        return this.auth.me(user.sub);
    }
    setup2fa(user) {
        return this.auth.setup2fa(user.sub);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({
        summary: 'Email/password login',
        description: 'Returns tokens, or a 2FA challenge for privileged roles (demo OTP 123456).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tokens or 2FA challenge' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('2fa/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete login after 2FA challenge' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.LoginSuccessDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [two_factor_dto_1.TwoFactorVerifyDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verify2fa", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({ summary: 'Rotate refresh token → new access + refresh' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [two_factor_dto_1.RefreshDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiOperation)({ summary: 'Invalidate refresh token(s)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Current user profile (JWT)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('2fa/setup'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable 2FA flag on account (demo)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "setup2fa", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map