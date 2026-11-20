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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const approval_dto_1 = require("./dto/approval.dto");
const approvals_service_1 = require("./approvals.service");
let ApprovalsController = class ApprovalsController {
    approvals;
    constructor(approvals) {
        this.approvals = approvals;
    }
    list() {
        return this.approvals.list();
    }
    submit(user, body) {
        return this.approvals.submit({
            type: body.type,
            summary: body.summary,
            requesterId: user.employeeId ?? user.sub,
        });
    }
    approve(id, dto) {
        return this.approvals.approve(id, dto.note);
    }
    reject(id, dto) {
        return this.approvals.reject(id, dto.note);
    }
    returnForEdit(id, dto) {
        return this.approvals.returnForEdit(id, dto.note);
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.RequirePermission)('approvals', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'List approval requests' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.RequirePermission)('approvals', 'create'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit approval request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, roles_decorator_1.RequirePermission)('approvals', 'approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approval_dto_1.DecisionDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, roles_decorator_1.RequirePermission)('approvals', 'approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approval_dto_1.DecisionDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/return'),
    (0, roles_decorator_1.RequirePermission)('approvals', 'approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Return request for edits' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approval_dto_1.DecisionDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "returnForEdit", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, swagger_1.ApiTags)('Approvals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('approvals'),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map