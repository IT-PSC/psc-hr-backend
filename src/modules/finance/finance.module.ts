import { Module } from '@nestjs/common';
import { FinanceBridgeService } from './finance-bridge.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, FinanceBridgeService],
  exports: [FinanceService, FinanceBridgeService],
})
export class FinanceModule {}
