import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('summary')
  @RequirePermission('finance', 'view')
  @ApiOperation({ summary: 'Finance dashboard summary' })
  summary() {
    return this.finance.summary();
  }

  @Get('payroll-postings')
  @RequirePermission('finance_payroll', 'view')
  @ApiOperation({ summary: 'Draft payroll postings from PSC approvals' })
  payrollPostings() {
    return this.finance.payrollPostings();
  }

  @Get('ap-payment-proposals')
  @RequirePermission('finance_payments', 'view')
  @ApiOperation({ summary: 'AP payment proposals from approved A/P docs' })
  apProposals() {
    return this.finance.apPaymentProposals();
  }

  @Get('integration-events')
  @RequirePermission('finance', 'view')
  @ApiOperation({ summary: 'Recent integration events (idempotent bridge log)' })
  events() {
    return this.finance.events();
  }
}
