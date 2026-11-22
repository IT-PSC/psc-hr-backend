import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateApDocumentDto, DecisionNoteDto } from './dto/ap.dto';
import { AccountsPayableService } from './accounts-payable.service';

@ApiTags('Accounts Payable')
@ApiBearerAuth()
@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private readonly ap: AccountsPayableService) {}

  @Get('requests')
  @RequirePermission('accounts_payable', 'view')
  @ApiOperation({ summary: 'List A/P documents (optional ?status=)' })
  requests(@Query('status') status?: string) {
    return this.ap.requests(status);
  }

  @Get('requests/:id')
  @RequirePermission('accounts_payable', 'view')
  @ApiOperation({ summary: 'Get A/P document with lines' })
  getOne(@Param('id') id: string) {
    return this.ap.getOne(id);
  }

  @Post('requests')
  @RequirePermission('accounts_payable', 'create')
  @ApiOperation({ summary: 'Create draft A/P document (optional lines)' })
  create(
    @Body() dto: CreateApDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ap.createDraft(dto, user.employeeId ?? user.sub);
  }

  @Post('requests/:id/submit')
  @RequirePermission('accounts_payable', 'edit')
  @ApiOperation({ summary: 'Submit draft → awaiting_checking' })
  submit(@Param('id') id: string) {
    return this.ap.submit(id);
  }

  @Post('requests/:id/check')
  @RequirePermission('accounts_payable', 'approve')
  @ApiOperation({ summary: 'Check → awaiting_approval' })
  check(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ap.check(id, user.employeeId ?? user.sub);
  }

  @Post('requests/:id/return')
  @RequirePermission('accounts_payable', 'approve')
  @ApiOperation({ summary: 'Return for edits' })
  returnDoc(@Param('id') id: string, @Body() dto: DecisionNoteDto) {
    return this.ap.returnDoc(id, dto.note);
  }

  @Post('requests/:id/cancel')
  @RequirePermission('accounts_payable', 'edit')
  @ApiOperation({ summary: 'Cancel draft/returned/awaiting_checking doc' })
  cancel(@Param('id') id: string) {
    return this.ap.cancel(id);
  }

  @Post('requests/:id/approve')
  @RequirePermission('accounts_payable', 'approve')
  @ApiOperation({
    summary:
      'Approve → emit ap.document.approved → Finance payment proposal (USD)',
  })
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ap.approve(id, user.employeeId ?? user.sub);
  }

  @Post('requests/:id/mark-paid')
  @RequirePermission('accounts_payable', 'edit')
  @ApiOperation({ summary: 'Mark approved document as paid' })
  markPaid(@Param('id') id: string) {
    return this.ap.markPaid(id);
  }
}
