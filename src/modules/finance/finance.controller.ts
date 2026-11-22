import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('summary')
  @RequirePermission('finance', 'view')
  @ApiOperation({
    summary:
      'Finance summary: cash from posted cash/bank journals, AR from open invoices',
  })
  summary() {
    return this.finance.summary();
  }

  @Get('payroll-postings')
  @RequirePermission('finance_payroll', 'view')
  @ApiOperation({ summary: 'Payroll postings from PSC approvals' })
  payrollPostings(@Query('status') status?: string) {
    return this.finance.payrollPostings(status);
  }

  @Post('payroll-postings/:id/post')
  @RequirePermission('finance_payroll', 'approve')
  @ApiOperation({ summary: 'Post draft payroll posting' })
  postPayroll(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.finance.postPayrollPosting(id, user.employeeId ?? user.sub);
  }

  @Post('payroll-postings/:id/void')
  @RequirePermission('finance_payroll', 'edit')
  @ApiOperation({ summary: 'Void payroll posting' })
  voidPayroll(@Param('id') id: string) {
    return this.finance.voidPayrollPosting(id);
  }

  @Get('ap-payment-proposals')
  @RequirePermission('finance_payments', 'view')
  @ApiOperation({ summary: 'AP payment proposals from approved A/P docs' })
  apProposals(@Query('status') status?: string) {
    return this.finance.apPaymentProposals(status);
  }

  @Post('ap-payment-proposals/:id/post')
  @RequirePermission('finance_payments', 'approve')
  @ApiOperation({ summary: 'Post draft AP payment proposal' })
  postAp(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.finance.postApProposal(id, user.employeeId ?? user.sub);
  }

  @Post('ap-payment-proposals/:id/mark-paid')
  @RequirePermission('finance_payments', 'edit')
  @ApiOperation({ summary: 'Mark AP payment proposal paid' })
  payAp(@Param('id') id: string) {
    return this.finance.markApProposalPaid(id);
  }

  @Get('integration-events')
  @RequirePermission('finance', 'view')
  @ApiOperation({ summary: 'Recent integration events (idempotent bridge log)' })
  events() {
    return this.finance.events();
  }
}
