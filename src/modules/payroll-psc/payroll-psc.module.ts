import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { PayrollPscController } from './payroll-psc.controller';
import { PayrollPscService } from './payroll-psc.service';

@Module({
  imports: [FinanceModule],
  controllers: [PayrollPscController],
  providers: [PayrollPscService],
  exports: [PayrollPscService],
})
export class PayrollPscModule {}
