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
exports.RbacController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const rbac_service_1 = require("./rbac.service");
let RbacController = class RbacController {
    rbac;
    constructor(rbac) {
        this.rbac = rbac;
    }
    listRoles() {
        return this.rbac.listRoles();
    }
    permissions(role) {
        return this.rbac.permissionsForRole(role);
    }
    matrix() {
        return this.rbac.matrix();
    }
};
exports.RbacController = RbacController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, roles_decorator_1.RequirePermission)('roles', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'List app roles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)('permissions/:role'),
    (0, roles_decorator_1.RequirePermission)('roles', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'Permissions for a role' }),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "permissions", null);
__decorate([
    (0, common_1.Get)('matrix'),
    (0, roles_decorator_1.RequirePermission)('roles', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'Full ROLE_PERMISSIONS matrix' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "matrix", null);
exports.RbacController = RbacController = __decorate([
    (0, swagger_1.ApiTags)('rbac'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('rbac'),
    __metadata("design:paramtypes", [rbac_service_1.RbacService])
], RbacController);
//# sourceMappingURL=rbac.controller.js.map