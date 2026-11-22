import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CashierService } from './cashier.service';
import { CollectionsService } from './collections.service';
import {
  CloseShiftDto,
  ConfirmBatchDto,
  CreateBankLineDto,
  CreateCloseItemDto,
  CreateCollectionBatchDto,
  CreateInventoryDto,
  CreateTaxLineDto,
  CreateWalletDto,
  MatchBankLineDto,
  OpenShiftDto,
  RemitTaxDto,
  UpdateCloseItemDto,
  UpdateSetupDto,
  UpdateTaxLineDto,
  WalletMovementDto,
} from './dto/ops.dto';
import { InventoryService, FinanceSetupService, TaxService } from './inventory-tax.service';
import { WalletsService } from './wallets.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/shifts')
export class CashierController {
  constructor(private readonly cashier: CashierService) {}

  @Get()
  @RequirePermission('finance_cashier', 'view')
  @ApiOperation({ summary: 'List cashier shifts' })
  list(
    @Query('status') status?: string,
    @Query('businessDate') businessDate?: string,
  ) {
    return this.cashier.listShifts(status, businessDate);
  }

  @Post()
  @RequirePermission('finance_cashier', 'create')
  @ApiOperation({ summary: 'Open a cashier shift' })
  open(@Body() dto: OpenShiftDto, @CurrentUser() user: JwtPayload) {
    return this.cashier.openShift(dto, user.employeeId ?? user.sub);
  }

  @Post(':id/close')
  @RequirePermission('finance_cashier', 'edit')
  @ApiOperation({ summary: 'Close shift and record cash variance' })
  close(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.cashier.closeShift(id, dto);
  }

  @Post(':id/review')
  @RequirePermission('finance_cashier', 'approve')
  @ApiOperation({ summary: 'Review a closed shift' })
  review(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.cashier.reviewShift(id, user.employeeId ?? user.sub);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/collection-batches')
export class CollectionBatchesController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  @RequirePermission('finance_collections', 'view')
  @ApiOperation({ summary: 'List collection batches' })
  list(@Query('status') status?: string) {
    return this.collections.listBatches(status);
  }

  @Post()
  @RequirePermission('finance_collections', 'create')
  @ApiOperation({ summary: 'Create a collection batch' })
  create(@Body() dto: CreateCollectionBatchDto) {
    return this.collections.createBatch(dto);
  }

  @Post(':id/submit')
  @RequirePermission('finance_collections', 'edit')
  @ApiOperation({ summary: 'Submit collection batch' })
  submit(@Param('id') id: string) {
    return this.collections.submitBatch(id);
  }

  @Post(':id/confirm')
  @RequirePermission('finance_collections', 'approve')
  @ApiOperation({ summary: 'Confirm collection batch' })
  confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmBatchDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.collections.confirmBatch(id, dto, user.employeeId ?? user.sub);
  }

  @Post(':id/reject')
  @RequirePermission('finance_collections', 'edit')
  @ApiOperation({ summary: 'Reject collection batch' })
  reject(@Param('id') id: string) {
    return this.collections.rejectBatch(id);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/bank-lines')
export class BankLinesController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  @RequirePermission('finance_collections', 'view')
  @ApiOperation({ summary: 'List bank statement lines' })
  list(@Query('matchStatus') matchStatus?: string) {
    return this.collections.listBankLines(matchStatus);
  }

  @Post()
  @RequirePermission('finance_collections', 'create')
  @ApiOperation({ summary: 'Import a bank statement line' })
  create(@Body() dto: CreateBankLineDto) {
    return this.collections.createBankLine(dto);
  }

  @Post(':id/match')
  @RequirePermission('finance_collections', 'edit')
  @ApiOperation({ summary: 'Match a bank line to a collection batch' })
  match(@Param('id') id: string, @Body() dto: MatchBankLineDto) {
    return this.collections.matchBankLine(id, dto);
  }

  @Post(':id/ignore')
  @RequirePermission('finance_collections', 'edit')
  @ApiOperation({ summary: 'Ignore an unmatched bank line' })
  ignore(@Param('id') id: string) {
    return this.collections.ignoreBankLine(id);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get()
  @RequirePermission('finance_wallets', 'view')
  @ApiOperation({ summary: 'List customer wallets' })
  list(@Query('customerId') customerId?: string) {
    return this.wallets.list(customerId);
  }

  @Post()
  @RequirePermission('finance_wallets', 'create')
  @ApiOperation({ summary: 'Open a customer wallet' })
  create(@Body() dto: CreateWalletDto) {
    return this.wallets.create(dto);
  }

  @Get(':id')
  @RequirePermission('finance_wallets', 'view')
  @ApiOperation({ summary: 'Get wallet and recent movements' })
  getOne(@Param('id') id: string) {
    return this.wallets.getOne(id);
  }

  @Post(':id/movements')
  @RequirePermission('finance_wallets', 'create')
  @ApiOperation({ summary: 'Load, redeem, bonus, reserve, or release wallet funds' })
  move(@Param('id') id: string, @Body() dto: WalletMovementDto) {
    return this.wallets.move(id, dto);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @RequirePermission('finance_inventory', 'view')
  @ApiOperation({ summary: 'List inventory movements' })
  list(
    @Query('approvalStatus') approvalStatus?: string,
    @Query('itemCode') itemCode?: string,
  ) {
    return this.inventory.list(approvalStatus, itemCode);
  }

  @Post()
  @RequirePermission('finance_inventory', 'create')
  @ApiOperation({ summary: 'Record an inventory movement' })
  create(@Body() dto: CreateInventoryDto) {
    return this.inventory.create(dto);
  }

  @Post(':id/approve')
  @RequirePermission('finance_inventory', 'approve')
  @ApiOperation({ summary: 'Approve inventory movement' })
  approve(@Param('id') id: string) {
    return this.inventory.decide(id, 'approved');
  }

  @Post(':id/reject')
  @RequirePermission('finance_inventory', 'approve')
  @ApiOperation({ summary: 'Reject inventory movement' })
  reject(@Param('id') id: string) {
    return this.inventory.decide(id, 'rejected');
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/tax')
export class TaxController {
  constructor(private readonly tax: TaxService) {}

  @Get()
  @RequirePermission('finance_tax', 'view')
  @ApiOperation({ summary: 'List tax schedule lines' })
  list(@Query('period') period?: string, @Query('kind') kind?: string) {
    return this.tax.list(period, kind);
  }

  @Post()
  @RequirePermission('finance_tax', 'create')
  @ApiOperation({ summary: 'Create tax schedule line' })
  create(@Body() dto: CreateTaxLineDto) {
    return this.tax.create(dto);
  }

  @Patch(':id')
  @RequirePermission('finance_tax', 'edit')
  @ApiOperation({ summary: 'Update tax schedule line' })
  update(@Param('id') id: string, @Body() dto: UpdateTaxLineDto) {
    return this.tax.update(id, dto);
  }

  @Post(':id/remit')
  @RequirePermission('finance_tax', 'approve')
  @ApiOperation({ summary: 'Reduce outstanding tax by a remittance' })
  remit(@Param('id') id: string, @Body() dto: RemitTaxDto) {
    return this.tax.remit(id, dto);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/setup')
export class FinanceSetupController {
  constructor(private readonly setup: FinanceSetupService) {}

  @Get()
  @RequirePermission('finance_setup', 'view')
  @ApiOperation({ summary: 'Get finance setup' })
  get() {
    return this.setup.getSetup();
  }

  @Patch()
  @RequirePermission('finance_setup', 'edit')
  @ApiOperation({ summary: 'Update finance setup' })
  update(@Body() dto: UpdateSetupDto) {
    return this.setup.updateSetup(dto);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/close-checklist')
export class CloseChecklistController {
  constructor(private readonly setup: FinanceSetupService) {}

  @Get()
  @RequirePermission('finance_setup', 'view')
  @ApiOperation({ summary: 'List period close checklist' })
  list(@Query('period') period?: string) {
    return this.setup.listChecklist(period);
  }

  @Post()
  @RequirePermission('finance_setup', 'create')
  @ApiOperation({ summary: 'Add a close-checklist item' })
  create(@Body() dto: CreateCloseItemDto) {
    return this.setup.createChecklistItem(dto);
  }

  @Patch(':id')
  @RequirePermission('finance_setup', 'edit')
  @ApiOperation({ summary: 'Update a close-checklist item' })
  update(@Param('id') id: string, @Body() dto: UpdateCloseItemDto) {
    return this.setup.updateChecklistItem(id, dto);
  }
}
