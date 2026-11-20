-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "IntegrationEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationEvent_eventId_key" ON "IntegrationEvent"("eventId");
CREATE INDEX IF NOT EXISTS "IntegrationEvent_type_idx" ON "IntegrationEvent"("type");
CREATE INDEX IF NOT EXISTS "IntegrationEvent_status_idx" ON "IntegrationEvent"("status");
CREATE INDEX IF NOT EXISTS "IntegrationEvent_sourceId_idx" ON "IntegrationEvent"("sourceId");

CREATE TABLE IF NOT EXISTS "PscPayrollRun" (
    "id" TEXT NOT NULL,
    "periodYm" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PscPayrollRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PscPayrollRun_status_idx" ON "PscPayrollRun"("status");
CREATE INDEX IF NOT EXISTS "PscPayrollRun_periodYm_idx" ON "PscPayrollRun"("periodYm");

CREATE TABLE IF NOT EXISTS "ApDocument" (
    "id" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(14,2) NOT NULL,
    "openBalance" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApDocument_docNumber_key" ON "ApDocument"("docNumber");
CREATE INDEX IF NOT EXISTS "ApDocument_status_idx" ON "ApDocument"("status");

CREATE TABLE IF NOT EXISTS "FinPayrollPosting" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinPayrollPosting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinPayrollPosting_eventId_key" ON "FinPayrollPosting"("eventId");

CREATE TABLE IF NOT EXISTS "FinApPaymentProposal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "apDocumentId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinApPaymentProposal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinApPaymentProposal_eventId_key" ON "FinApPaymentProposal"("eventId");
