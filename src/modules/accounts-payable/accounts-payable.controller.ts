import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateApDocumentDto } from './dto/ap.dto';
import { AccountsPayableService } from './accounts-payable.service';

@ApiTags('AP')
@ApiBearerAuth()
@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private readonly ap: AccountsPayableService) {}

  @Get('requests')
  @RequirePermission('accounts_payable', 'view')
  @ApiOperation({ summary: 'List A/P documents' })
  requests() {
    return this.ap.requests();
  }

  @Post('requests')
  @RequirePermission('accounts_payable', 'create')
  @ApiOperation({ summary: 'Create draft A/P document' })
  create(@Body() dto: CreateApDocumentDto) {
    return this.ap.createDraft(dto);
  }

  @Post('requests/:id/approve')
  @RequirePermission('accounts_payable', 'approve')
  @ApiOperation({
    summary: 'Approve A/P → emit ap.document.approved → Finance payment proposal (USD)',
  })
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ap.approve(id, user.sub);
  }
}
