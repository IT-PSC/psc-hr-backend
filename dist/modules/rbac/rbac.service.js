"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const matrix_1 = require("../../common/roles/matrix");
const ROLES = [
    'system_admin',
    'hr',
    'finance_manager',
    'manager',
    'employee',
];
let RbacService = class RbacService {
    listRoles() {
        return ROLES.map((role) => ({
            role,
            permissionCount: matrix_1.ROLE_PERMISSIONS[role]?.length ?? 0,
        }));
    }
    permissionsForRole(role) {
        if (!ROLES.includes(role)) {
            throw new common_1.NotFoundException(`Unknown role: ${role}`);
        }
        return matrix_1.ROLE_PERMISSIONS[role];
    }
    matrix() {
        return matrix_1.ROLE_PERMISSIONS;
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)()
], RbacService);
//# sourceMappingURL=rbac.service.js.map