import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsModule } from '../approvals/approvals.module';
import { TimeController } from './time.controller';
import { TimeService } from './time.service';

@Module({
  imports: [forwardRef(() => ApprovalsModule)],
  controllers: [TimeController],
  providers: [TimeService],
})
export class TimeModule {}
