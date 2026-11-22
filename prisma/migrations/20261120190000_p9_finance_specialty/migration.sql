-- P9: finance ledger/AR/cashier/collections/wallets/inventory/tax/setup, AP specialty, compliance

CREATE TABLE IF NOT EXISTS "FinAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinAccount_code_key" ON "FinAccount"("code");
CREATE INDEX IF NOT EXISTS "FinAccount_type_idx" ON "FinAccount"("type");

CREATE TABLE IF NOT EXISTS "FinPeriod" (
    "id" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinPeriod_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinPeriod_yearMonth_key" ON "FinPeriod"("yearMonth");

CREATE TABLE IF NOT EXISTS "FinJournal" (
    "id" TEXT NOT NULL,
    "businessDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sourceSystem" TEXT,
    "sourceDocumentId" TEXT,
    "memo" TEXT,
    "reversalOf" TEXT,
    "postedAt" TIMESTAMP(3),
    "postedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinJournal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinJournal_businessDate_idx" ON "FinJournal"("businessDate");
CREATE INDEX IF NOT EXISTS "FinJournal_status_idx" ON "FinJournal"("status");

CREATE TABLE IF NOT EXISTS "FinJournalLine" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "memo" TEXT,
    "branchId" TEXT,
    CONSTRAINT "FinJournalLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinJournalLine_journalId_idx" ON "FinJournalLine"("journalId");
CREATE INDEX IF NOT EXISTS "FinJournalLine_accountId_idx" ON "FinJournalLine"("accountId");
DO $$ BEGIN ALTER TABLE "FinJournalLine" ADD CONSTRAINT "FinJournalLine_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "FinJournal"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "FinCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creditLimit" DECIMAL(14,2),
    "creditTermsDays" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinCustomer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FinInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT,
    "businessDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "net" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outputVat" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gross" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinInvoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinInvoice_invoiceNo_key" ON "FinInvoice"("invoiceNo");
CREATE INDEX IF NOT EXISTS "FinInvoice_customerId_idx" ON "FinInvoice"("customerId");
CREATE INDEX IF NOT EXISTS "FinInvoice_status_idx" ON "FinInvoice"("status");
CREATE INDEX IF NOT EXISTS "FinInvoice_businessDate_idx" ON "FinInvoice"("businessDate");
DO $$ BEGIN ALTER TABLE "FinInvoice" ADD CONSTRAINT "FinInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "FinCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "FinReceipt" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'cash',
    "amount" DECIMAL(14,2) NOT NULL,
    "confirmationStatus" TEXT NOT NULL DEFAULT 'pending',
    "confirmedAmount" DECIMAL(14,2),
    "batchId" TEXT,
    "shiftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinReceipt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinReceipt_invoiceId_idx" ON "FinReceipt"("invoiceId");
CREATE INDEX IF NOT EXISTS "FinReceipt_batchId_idx" ON "FinReceipt"("batchId");
DO $$ BEGIN ALTER TABLE "FinReceipt" ADD CONSTRAINT "FinReceipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "FinShift" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "terminal" TEXT,
    "cashierId" TEXT,
    "businessDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openingFloat" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expectedCash" DECIMAL(14,2),
    "countedCash" DECIMAL(14,2),
    "variance" DECIMAL(14,2),
    "reviewerId" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinShift_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinShift_businessDate_idx" ON "FinShift"("businessDate");
CREATE INDEX IF NOT EXISTS "FinShift_status_idx" ON "FinShift"("status");

CREATE TABLE IF NOT EXISTS "FinCollectionBatch" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "sourceAccount" TEXT,
    "destinationAccount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "receiptIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "receivedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "confirmedAmount" DECIMAL(14,2),
    "feeAmount" DECIMAL(14,2),
    "confirmerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinCollectionBatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinCollectionBatch_status_idx" ON "FinCollectionBatch"("status");

CREATE TABLE IF NOT EXISTS "FinBankStatementLine" (
    "id" TEXT NOT NULL,
    "statementDate" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "matchStatus" TEXT NOT NULL DEFAULT 'unmatched',
    "matchedBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinBankStatementLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinBankStatementLine_statementDate_idx" ON "FinBankStatementLine"("statementDate");
CREATE INDEX IF NOT EXISTS "FinBankStatementLine_matchStatus_idx" ON "FinBankStatementLine"("matchStatus");

CREATE TABLE IF NOT EXISTS "FinWallet" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "purchasedBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "bonusBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinWallet_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinWallet_customerId_idx" ON "FinWallet"("customerId");
DO $$ BEGIN ALTER TABLE "FinWallet" ADD CONSTRAINT "FinWallet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "FinCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "FinWalletMovement" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "branchId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinWalletMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinWalletMovement_walletId_idx" ON "FinWalletMovement"("walletId");
DO $$ BEGIN ALTER TABLE "FinWalletMovement" ADD CONSTRAINT "FinWalletMovement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "FinWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "FinInventoryMovement" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "location" TEXT,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinInventoryMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinInventoryMovement_itemCode_idx" ON "FinInventoryMovement"("itemCode");
CREATE INDEX IF NOT EXISTS "FinInventoryMovement_approvalStatus_idx" ON "FinInventoryMovement"("approvalStatus");

CREATE TABLE IF NOT EXISTS "FinTaxScheduleLine" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "base" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outstanding" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinTaxScheduleLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinTaxScheduleLine_period_idx" ON "FinTaxScheduleLine"("period");
CREATE INDEX IF NOT EXISTS "FinTaxScheduleLine_kind_idx" ON "FinTaxScheduleLine"("kind");

CREATE TABLE IF NOT EXISTS "FinSetupConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "entityName" TEXT NOT NULL DEFAULT 'PSC',
    "defaultBranchId" TEXT,
    "arAccountantId" TEXT,
    "financeManagerId" TEXT,
    "vatRatePct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "salaryTaxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reportMode" TEXT NOT NULL DEFAULT 'provisional',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinSetupConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FinCloseChecklist" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "owner" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "due" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinCloseChecklist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinCloseChecklist_period_itemKey_key" ON "FinCloseChecklist"("period", "itemKey");
CREATE INDEX IF NOT EXISTS "FinCloseChecklist_period_idx" ON "FinCloseChecklist"("period");

CREATE TABLE IF NOT EXISTS "ApCatalogueItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameKm" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" TEXT,
    "purchaseUnit" TEXT NOT NULL DEFAULT 'kg',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApCatalogueItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApCatalogueItem_code_key" ON "ApCatalogueItem"("code");

CREATE TABLE IF NOT EXISTS "ApDailyIngredient" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "branchCode" TEXT,
    "purchaseDate" TEXT NOT NULL,
    "marketBuyerId" TEXT,
    "lines" JSONB NOT NULL,
    "evidenceNote" TEXT,
    "linkedDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApDailyIngredient_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ApDailyIngredient_purchaseDate_idx" ON "ApDailyIngredient"("purchaseDate");
CREATE INDEX IF NOT EXISTS "ApDailyIngredient_branchId_idx" ON "ApDailyIngredient"("branchId");

CREATE TABLE IF NOT EXISTS "ApPettyCash" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "branchId" TEXT,
    "paidAt" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(14,2) NOT NULL,
    "fundId" TEXT,
    "receiptRef" TEXT,
    "description" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApPettyCash_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApPettyCash_reference_key" ON "ApPettyCash"("reference");
CREATE INDEX IF NOT EXISTS "ApPettyCash_paidAt_idx" ON "ApPettyCash"("paidAt");
CREATE INDEX IF NOT EXISTS "ApPettyCash_branchId_idx" ON "ApPettyCash"("branchId");

CREATE TABLE IF NOT EXISTS "ApSetupConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "checkerEmployeeId" TEXT,
    "approverEmployeeId" TEXT,
    "defaultBranchId" TEXT,
    "defaultBranchCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApSetupConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ComplianceItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKm" TEXT,
    "category" TEXT NOT NULL,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ComplianceItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ComplianceItem_status_idx" ON "ComplianceItem"("status");
CREATE INDEX IF NOT EXISTS "ComplianceItem_category_idx" ON "ComplianceItem"("category");
