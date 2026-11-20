"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollPscModule = void 0;
const common_1 = require("@nestjs/common");
const finance_module_1 = require("../finance/finance.module");
const payroll_psc_controller_1 = require("./payroll-psc.controller");
const payroll_psc_service_1 = require("./payroll-psc.service");
let PayrollPscModule = class PayrollPscModule {
};
exports.PayrollPscModule = PayrollPscModule;
exports.PayrollPscModule = PayrollPscModule = __decorate([
    (0, common_1.Module)({
        imports: [finance_module_1.FinanceModule],
        controllers: [payroll_psc_controller_1.PayrollPscController],
        providers: [payroll_psc_service_1.PayrollPscService],
        exports: [payroll_psc_service_1.PayrollPscService],
    })
], PayrollPscModule);
//# sourceMappingURL=payroll-psc.module.js.map