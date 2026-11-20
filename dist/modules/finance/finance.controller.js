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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const finance_service_1 = require("./finance.service");
let FinanceController = class FinanceController {
    finance;
    constructor(finance) {
        this.finance = finance;
    }
    summary() {
        return this.finance.summary();
    }
    payrollPostings() {
        return this.finance.payrollPostings();
    }
    apProposals() {
        return this.finance.apPaymentProposals();
    }
    events() {
        return this.finance.events();
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.RequirePermission)('finance', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'Finance dashboard summary' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('payroll-postings'),
    (0, roles_decorator_1.RequirePermission)('finance_payroll', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'Draft payroll postings from PSC approvals' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "payrollPostings", null);
__decorate([
    (0, common_1.Get)('ap-payment-proposals'),
    (0, roles_decorator_1.RequirePermission)('finance_payments', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'AP payment proposals from approved A/P docs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "apProposals", null);
__decorate([
    (0, common_1.Get)('integration-events'),
    (0, roles_decorator_1.RequirePermission)('finance', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'Recent integration events (idempotent bridge log)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "events", null);
exports.FinanceController = FinanceController = __decorate([
    (0, swagger_1.ApiTags)('Finance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('finance'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map