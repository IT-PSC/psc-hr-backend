import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreateAccountDto,
  CreateJournalDto,
  CreatePeriodDto,
  UpdateAccountDto,
} from './dto/ledger.dto';
import { LedgerService } from './ledger.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/accounts')
export class LedgerAccountsController {
  constructor(private readonly ledger: LedgerService) {}

  @Get()
  @RequirePermission('finance_ledger', 'view')
  @ApiOperation({ summary: 'List chart of accounts' })
  list(@Query('type') type?: string) {
    return this.ledger.listAccounts(type);
  }

  @Post()
  @RequirePermission('finance_ledger', 'create')
  @ApiOperation({ summary: 'Create account' })
  create(@Body() dto: CreateAccountDto) {
    return this.ledger.createAccount(dto);
  }

  @Patch(':id')
  @RequirePermission('finance_ledger', 'edit')
  @ApiOperation({ summary: 'Update account' })
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.ledger.updateAccount(id, dto);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/periods')
export class LedgerPeriodsController {
  constructor(private readonly ledger: LedgerService) {}

  @Get()
  @RequirePermission('finance_ledger', 'view')
  @ApiOperation({ summary: 'List accounting periods' })
  list() {
    return this.ledger.listPeriods();
  }

  @Post()
  @RequirePermission('finance_ledger', 'create')
  @ApiOperation({ summary: 'Open an accounting period' })
  create(@Body() dto: CreatePeriodDto) {
    return this.ledger.createPeriod(dto);
  }

  @Post(':id/soft-close')
  @RequirePermission('finance_ledger', 'approve')
  @ApiOperation({ summary: 'Soft-close a period' })
  softClose(@Param('id') id: string) {
    return this.ledger.setPeriodStatus(id, 'soft_close');
  }

  @Post(':id/lock')
  @RequirePermission('finance_ledger', 'approve')
  @ApiOperation({ summary: 'Lock a period' })
  lock(@Param('id') id: string) {
    return this.ledger.setPeriodStatus(id, 'locked');
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/journals')
export class LedgerJournalsController {
  constructor(private readonly ledger: LedgerService) {}

  @Get()
  @RequirePermission('finance_ledger', 'view')
  @ApiOperation({ summary: 'List journals' })
  list(@Query('status') status?: string) {
    return this.ledger.listJournals(status);
  }

  @Get(':id')
  @RequirePermission('finance_ledger', 'view')
  @ApiOperation({ summary: 'Get journal with lines' })
  getOne(@Param('id') id: string) {
    return this.ledger.getJournal(id);
  }

  @Post()
  @RequirePermission('finance_ledger', 'create')
  @ApiOperation({ summary: 'Create draft journal' })
  create(@Body() dto: CreateJournalDto) {
    return this.ledger.createJournal(dto);
  }

  @Post(':id/post')
  @RequirePermission('finance_ledger', 'approve')
  @ApiOperation({ summary: 'Post journal when debit equals credit' })
  post(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ledger.postJournal(id, user.employeeId ?? user.sub);
  }

  @Post(':id/reverse')
  @RequirePermission('finance_ledger', 'approve')
  @ApiOperation({ summary: 'Reverse a posted journal' })
  reverse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ledger.reverseJournal(id, user.employeeId ?? user.sub);
  }
}
