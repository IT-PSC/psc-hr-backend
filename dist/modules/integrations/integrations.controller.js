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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const integrations_service_1 = require("./integrations.service");
let IntegrationsController = class IntegrationsController {
    integrations;
    constructor(integrations) {
        this.integrations = integrations;
    }
    health() {
        return this.integrations.health();
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.RequirePermission)('settings', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'Integrations health stub' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "health", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, swagger_1.ApiTags)('integrations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('integrations'),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map