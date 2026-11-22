import { Module } from '@nestjs/common';
import { ArCustomersController, ArInvoicesController, ArReceiptsController } from './ar.controller';
import { ArService } from './ar.service';
import { CashierService } from './cashier.service';
import { CollectionsService } from './collections.service';
import { FinanceBridgeService } from './finance-bridge.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceSetupService, InventoryService, TaxService } from './inventory-tax.service';
import {
  LedgerAccountsController,
  LedgerJournalsController,
  LedgerPeriodsController,
} from './ledger.controller';
import { LedgerService } from './ledger.service';
import {
  BankLinesController,
  CashierController,
  CloseChecklistController,
  CollectionBatchesController,
  FinanceSetupController,
  InventoryController,
  TaxController,
  WalletsController,
} from './ops.controller';
import { WalletsService } from './wallets.service';

@Module({
  controllers: [
    FinanceController,
    LedgerAccountsController,
    LedgerPeriodsController,
    LedgerJournalsController,
    ArCustomersController,
    ArInvoicesController,
    ArReceiptsController,
    CashierController,
    CollectionBatchesController,
    BankLinesController,
    WalletsController,
    InventoryController,
    TaxController,
    FinanceSetupController,
    CloseChecklistController,
  ],
  providers: [
    FinanceService,
    FinanceBridgeService,
    LedgerService,
    ArService,
    CashierService,
    CollectionsService,
    WalletsService,
    InventoryService,
    TaxService,
    FinanceSetupService,
  ],
  exports: [FinanceService, FinanceBridgeService],
})
export class FinanceModule {}
