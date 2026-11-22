-- P13: contribution registers, contract advantage templates, incentives, salary increases

CREATE TABLE IF NOT EXISTS "ContributionRegister" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "fund" TEXT NOT NULL,
    "employees" INTEGER NOT NULL,
    "employeeShare" DECIMAL(12,2) NOT NULL,
    "employerShare" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContributionRegister_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ContributionRegister_month_idx" ON "ContributionRegister"("month");
CREATE INDEX IF NOT EXISTS "ContributionRegister_fund_idx" ON "ContributionRegister"("fund");

CREATE TABLE IF NOT EXISTS "ContractAdvantageTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContractAdvantageTemplate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContractAdvantageTemplate_code_key" ON "ContractAdvantageTemplate"("code");

CREATE TABLE IF NOT EXISTS "IncentiveAward" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidIn" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IncentiveAward_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncentiveAward_employeeId_idx" ON "IncentiveAward"("employeeId");
CREATE INDEX IF NOT EXISTS "IncentiveAward_period_idx" ON "IncentiveAward"("period");
DO $$ BEGIN
  ALTER TABLE "IncentiveAward" ADD CONSTRAINT "IncentiveAward_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SalaryIncreaseRequest" (
    "id" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "currentSalary" DECIMAL(12,2) NOT NULL,
    "proposedSalary" DECIMAL(12,2) NOT NULL,
    "pct" DECIMAL(8,2),
    "status" TEXT NOT NULL DEFAULT 'in_review',
    "effectiveDate" TEXT NOT NULL,
    "reason" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalaryIncreaseRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SalaryIncreaseRequest_employeeId_idx" ON "SalaryIncreaseRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "SalaryIncreaseRequest_cycle_idx" ON "SalaryIncreaseRequest"("cycle");
DO $$ BEGIN
  ALTER TABLE "SalaryIncreaseRequest" ADD CONSTRAINT "SalaryIncreaseRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
