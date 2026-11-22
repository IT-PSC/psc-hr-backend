import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsModule } from '../approvals/approvals.module';
import { LifecycleService } from './lifecycle.service';
import { OffboardingController } from './offboarding.controller';
import { ResignationsController } from './resignations.controller';

@Module({
  imports: [forwardRef(() => ApprovalsModule)],
  controllers: [ResignationsController, OffboardingController],
  providers: [LifecycleService],
  exports: [LifecycleService],
})
export class LifecycleModule {}
