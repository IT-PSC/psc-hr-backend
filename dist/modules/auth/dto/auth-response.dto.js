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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginChallengeDto = exports.LoginSuccessDto = exports.AuthUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuthUserDto {
    id;
    email;
    employeeId;
    roles;
    firstName;
    lastName;
}
exports.AuthUserDto = AuthUserDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuthUserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AuthUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true }),
    __metadata("design:type", Object)
], AuthUserDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], AuthUserDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true }),
    __metadata("design:type", Object)
], AuthUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true }),
    __metadata("design:type", Object)
], AuthUserDto.prototype, "lastName", void 0);
class LoginSuccessDto {
    requires2FA;
    accessToken;
    refreshToken;
    user;
}
exports.LoginSuccessDto = LoginSuccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], LoginSuccessDto.prototype, "requires2FA", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], LoginSuccessDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], LoginSuccessDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: AuthUserDto }),
    __metadata("design:type", AuthUserDto)
], LoginSuccessDto.prototype, "user", void 0);
class LoginChallengeDto {
    requires2FA;
    challengeToken;
    demoCodeHint;
}
exports.LoginChallengeDto = LoginChallengeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], LoginChallengeDto.prototype, "requires2FA", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pass to POST /auth/2fa/verify' }),
    __metadata("design:type", String)
], LoginChallengeDto.prototype, "challengeToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', description: 'Demo code for Swagger testing' }),
    __metadata("design:type", String)
], LoginChallengeDto.prototype, "demoCodeHint", void 0);
//# sourceMappingURL=auth-response.dto.js.map