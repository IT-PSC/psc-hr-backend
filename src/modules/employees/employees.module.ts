import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsModule } from '../approvals/approvals.module';
import { EmployeeChangesController } from './employee-changes.controller';
import { EmployeeChangesService } from './employee-changes.service';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  imports: [forwardRef(() => ApprovalsModule)],
  controllers: [EmployeeChangesController, EmployeesController],
  providers: [EmployeesService, EmployeeChangesService],
})
export class EmployeesModule {}
