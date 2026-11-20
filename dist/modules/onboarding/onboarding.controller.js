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
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const onboarding_service_1 = require("./onboarding.service");
let OnboardingController = class OnboardingController {
    onboarding;
    constructor(onboarding) {
        this.onboarding = onboarding;
    }
    list() {
        return this.onboarding.list();
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.RequirePermission)('onboarding', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'Onboarding health/list stub' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "list", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, swagger_1.ApiTags)('onboarding'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('onboarding'),
    __metadata("design:paramtypes", [onboarding_service_1.OnboardingService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map