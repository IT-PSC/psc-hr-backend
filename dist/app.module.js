"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const events_module_1 = require("./common/events/events.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const permissions_guard_1 = require("./common/guards/permissions.guard");
const prisma_module_1 = require("./common/prisma/prisma.module");
const accounts_payable_module_1 = require("./modules/accounts-payable/accounts-payable.module");
const approvals_module_1 = require("./modules/approvals/approvals.module");
const audit_module_1 = require("./modules/audit/audit.module");
const auth_module_1 = require("./modules/auth/auth.module");
const employees_module_1 = require("./modules/employees/employees.module");
const files_module_1 = require("./modules/files/files.module");
const finance_module_1 = require("./modules/finance/finance.module");
const integrations_module_1 = require("./modules/integrations/integrations.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const org_module_1 = require("./modules/org/org.module");
const payroll_psc_module_1 = require("./modules/payroll-psc/payroll-psc.module");
const queue_module_1 = require("./modules/queue/queue.module");
const rbac_module_1 = require("./modules/rbac/rbac.module");
const recruitment_module_1 = require("./modules/recruitment/recruitment.module");
const time_module_1 = require("./modules/time/time.module");
const users_module_1 = require("./modules/users/users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            events_module_1.EventsModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            rbac_module_1.RbacModule,
            org_module_1.OrgModule,
            employees_module_1.EmployeesModule,
            time_module_1.TimeModule,
            approvals_module_1.ApprovalsModule,
            payroll_psc_module_1.PayrollPscModule,
            accounts_payable_module_1.AccountsPayableModule,
            finance_module_1.FinanceModule,
            recruitment_module_1.RecruitmentModule,
            onboarding_module_1.OnboardingModule,
            notifications_module_1.NotificationsModule,
            audit_module_1.AuditModule,
            files_module_1.FilesModule,
            integrations_module_1.IntegrationsModule,
            queue_module_1.QueueModule.register(),
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: permissions_guard_1.PermissionsGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map