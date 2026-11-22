import { Module, forwardRef } from '@nestjs/common';
import { LeaveModule } from '../leave/leave.module';
import { LifecycleModule } from '../lifecycle/lifecycle.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OvertimeModule } from '../overtime/overtime.module';
import { TimesheetModule } from '../timesheet/timesheet.module';
import { WorkplaceModule } from '../workplace/workplace.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [
    forwardRef(() => LeaveModule),
    forwardRef(() => OvertimeModule),
    forwardRef(() => TimesheetModule),
    forwardRef(() => LifecycleModule),
    forwardRef(() => WorkplaceModule),
    NotificationsModule,
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
