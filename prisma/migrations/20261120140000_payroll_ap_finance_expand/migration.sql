-- Expand PscPayrollRun
ALTER TABLE "PscPayrollRun" ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE "PscPayrollRun" ADD COLUMN IF NOT EXISTS "branchCode" TEXT;
ALTER TABLE "PscPayrollRun" ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PscPayrollRun" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "PscPayrollRun" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "PscPayrollRun" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PscPayrollLine" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "employeeId" TEXT,
    "personLabel" TEXT,
    "taxOnly" BOOLEAN NOT NULL DEFAULT false,
    "gross" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employeeTax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "companyTax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PscPayrollLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PscPayrollLine_runId_idx" ON "PscPayrollLine"("runId");
CREATE INDEX IF NOT EXISTS "PscPayrollLine_employeeId_idx" ON "PscPayrollLine"("employeeId");
DO $$ BEGIN
  ALTER TABLE "PscPayrollLine" ADD CONSTRAINT "PscPayrollLine_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PscPayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Expand ApDocument
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "docType" TEXT NOT NULL DEFAULT 'PR';
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "purpose" TEXT;
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "preparerId" TEXT;
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "checkerId" TEXT;
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "approverId" TEXT;
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "checkedAt" TIMESTAMP(3);
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "returnReason" TEXT;
ALTER TABLE "ApDocument" ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "ApDocument_docType_idx" ON "ApDocument"("docType");

CREATE TABLE IF NOT EXISTS "ApLine" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(14,2) NOT NULL,
    "invoiceRef" TEXT,
    "invoiceDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ApLine_documentId_idx" ON "ApLine"("documentId");
DO $$ BEGIN
  ALTER TABLE "ApLine" ADD CONSTRAINT "ApLine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ApDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Expand finance tables
ALTER TABLE "FinPayrollPosting" ADD COLUMN IF NOT EXISTS "periodYm" TEXT;
ALTER TABLE "FinPayrollPosting" ADD COLUMN IF NOT EXISTS "postedAt" TIMESTAMP(3);
ALTER TABLE "FinPayrollPosting" ADD COLUMN IF NOT EXISTS "postedById" TEXT;
ALTER TABLE "FinPayrollPosting" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "FinPayrollPosting_status_idx" ON "FinPayrollPosting"("status");
CREATE INDEX IF NOT EXISTS "FinPayrollPosting_payrollRunId_idx" ON "FinPayrollPosting"("payrollRunId");

ALTER TABLE "FinApPaymentProposal" ADD COLUMN IF NOT EXISTS "postedAt" TIMESTAMP(3);
ALTER TABLE "FinApPaymentProposal" ADD COLUMN IF NOT EXISTS "postedById" TEXT;
ALTER TABLE "FinApPaymentProposal" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "FinApPaymentProposal" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "FinApPaymentProposal_status_idx" ON "FinApPaymentProposal"("status");
CREATE INDEX IF NOT EXISTS "FinApPaymentProposal_apDocumentId_idx" ON "FinApPaymentProposal"("apDocumentId");
