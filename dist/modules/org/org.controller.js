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
exports.OrgController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const org_service_1 = require("./org.service");
let OrgController = class OrgController {
    org;
    constructor(org) {
        this.org = org;
    }
    departments() {
        return this.org.departments();
    }
    positions() {
        return this.org.positions();
    }
};
exports.OrgController = OrgController;
__decorate([
    (0, common_1.Get)('departments'),
    (0, roles_decorator_1.RequirePermission)('organization', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'List departments' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrgController.prototype, "departments", null);
__decorate([
    (0, common_1.Get)('positions'),
    (0, roles_decorator_1.RequirePermission)('organization', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'List positions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrgController.prototype, "positions", null);
exports.OrgController = OrgController = __decorate([
    (0, swagger_1.ApiTags)('Org'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('org'),
    __metadata("design:paramtypes", [org_service_1.OrgService])
], OrgController);
//# sourceMappingURL=org.controller.js.map