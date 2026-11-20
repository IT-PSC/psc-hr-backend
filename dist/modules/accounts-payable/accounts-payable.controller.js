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
exports.AccountsPayableController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const ap_dto_1 = require("./dto/ap.dto");
const accounts_payable_service_1 = require("./accounts-payable.service");
let AccountsPayableController = class AccountsPayableController {
    ap;
    constructor(ap) {
        this.ap = ap;
    }
    requests() {
        return this.ap.requests();
    }
    create(dto) {
        return this.ap.createDraft(dto);
    }
    approve(id, user) {
        return this.ap.approve(id, user.sub);
    }
};
exports.AccountsPayableController = AccountsPayableController;
__decorate([
    (0, common_1.Get)('requests'),
    (0, roles_decorator_1.RequirePermission)('accounts_payable', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'List A/P documents' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AccountsPayableController.prototype, "requests", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, roles_decorator_1.RequirePermission)('accounts_payable', 'create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create draft A/P document' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ap_dto_1.CreateApDocumentDto]),
    __metadata("design:returntype", void 0)
], AccountsPayableController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('requests/:id/approve'),
    (0, roles_decorator_1.RequirePermission)('accounts_payable', 'approve'),
    (0, swagger_1.ApiOperation)({
        summary: 'Approve A/P → emit ap.document.approved → Finance payment proposal (USD)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AccountsPayableController.prototype, "approve", null);
exports.AccountsPayableController = AccountsPayableController = __decorate([
    (0, swagger_1.ApiTags)('AP'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('accounts-payable'),
    __metadata("design:paramtypes", [accounts_payable_service_1.AccountsPayableService])
], AccountsPayableController);
//# sourceMappingURL=accounts-payable.controller.js.map