import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './common/events/events.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { PrismaModule } from './common/prisma/prisma.module';
import { AccountsPayableModule } from './modules/accounts-payable/accounts-payable.module';
import { ApSpecialtyModule } from './modules/ap-specialty/ap-specialty.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BenefitsAssetsModule } from './modules/benefits-assets/benefits-assets.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DataQualityModule } from './modules/data-quality/data-quality.module';
import { EmployeeRelationsModule } from './modules/employee-relations/employee-relations.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { FilesModule } from './modules/files/files.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HelpdeskModule } from './modules/helpdesk/helpdesk.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { LeaveModule } from './modules/leave/leave.module';
import { LifecycleModule } from './modules/lifecycle/lifecycle.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { OrgModule } from './modules/org/org.module';
import { OvertimeModule } from './modules/overtime/overtime.module';
import { PayrollPscModule } from './modules/payroll-psc/payroll-psc.module';
import { PayrollConfigModule } from './modules/payroll-config/payroll-config.module';
import { PayslipsModule } from './modules/payslips/payslips.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ProbationModule } from './modules/probation/probation.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RosterModule } from './modules/roster/roster.module';
import { TimeModule } from './modules/time/time.module';
import { TimesheetModule } from './modules/timesheet/timesheet.module';
import { TrainingModule } from './modules/training/training.module';
import { UsersModule } from './modules/users/users.module';
import { WorkplaceModule } from './modules/workplace/workplace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EventsModule,
    AuthModule,
    UsersModule,
    RbacModule,
    SettingsModule,
    OrgModule,
    EmployeesModule,
    TimeModule,
    TimesheetModule,
    OvertimeModule,
    LeaveModule,
    ApprovalsModule,
    RosterModule,
    CalendarModule,
    PayslipsModule,
    AnnouncementsModule,
    PoliciesModule,
    ContractsModule,
    ProbationModule,
    PayrollPscModule,
    PayrollConfigModule,
    AccountsPayableModule,
    ApSpecialtyModule,
    FinanceModule,
    DashboardModule,
    ReportsModule,
    ComplianceModule,
    DataQualityModule,
    RecruitmentModule,
    OnboardingModule,
    LifecycleModule,
    EmployeeRelationsModule,
    PerformanceModule,
    TrainingModule,
    HelpdeskModule,
    WorkplaceModule,
    BenefitsAssetsModule,
    ExpensesModule,
    NotificationsModule,
    AuditModule,
    FilesModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
