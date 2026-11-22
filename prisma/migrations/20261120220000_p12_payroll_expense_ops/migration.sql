-- P12: payroll config, expense claims, telegram outbox, probation settings, ER investigations

CREATE TABLE IF NOT EXISTS "SalaryRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKm" TEXT,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sequence" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "appearsOnPayslip" BOOLEAN NOT NULL DEFAULT true,
    "amountType" TEXT,
    "amountFix" DECIMAL(12,2),
    "amountPercentage" DECIMAL(8,4),
    "percentageBasedOn" TEXT,
    "contributionRegister" TEXT,
    "description" TEXT,
    "childRuleIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalaryRule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SalaryRule_code_key" ON "SalaryRule"("code");
CREATE INDEX IF NOT EXISTS "SalaryRule_category_idx" ON "SalaryRule"("category");
CREATE INDEX IF NOT EXISTS "SalaryRule_active_idx" ON "SalaryRule"("active");

CREATE TABLE IF NOT EXISTS "SalaryStructure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "companyName" TEXT NOT NULL,
    "ruleIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SalaryStructure_code_key" ON "SalaryStructure"("code");
CREATE INDEX IF NOT EXISTS "SalaryStructure_parentId_idx" ON "SalaryStructure"("parentId");

CREATE TABLE IF NOT EXISTS "PayrollConfigSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "taxOnSalaryRate" DECIMAL(8,4) NOT NULL,
    "nssfEmployeeRate" DECIMAL(8,4) NOT NULL,
    "nssfEmployerRate" DECIMAL(8,4) NOT NULL,
    "otMultiplier" DECIMAL(8,4) NOT NULL,
    "workingDaysPerMonth" INTEGER NOT NULL,
    "seniorityPerYear" DECIMAL(12,2) NOT NULL,
    "seniorityMaxYears" INTEGER NOT NULL,
    "probationMonths" INTEGER NOT NULL,
    "sampleDisclaimer" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PayrollConfigSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExpenseClaim" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ExpenseClaim_employeeId_idx" ON "ExpenseClaim"("employeeId");
CREATE INDEX IF NOT EXISTS "ExpenseClaim_status_idx" ON "ExpenseClaim"("status");
CREATE INDEX IF NOT EXISTS "ExpenseClaim_date_idx" ON "ExpenseClaim"("date");
DO $$ BEGIN
  ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "TelegramOutbox" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'telegram',
    "eventType" TEXT NOT NULL,
    "recipient" TEXT,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "jobRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "TelegramOutbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TelegramOutbox_status_idx" ON "TelegramOutbox"("status");
CREATE INDEX IF NOT EXISTS "TelegramOutbox_createdAt_idx" ON "TelegramOutbox"("createdAt");
CREATE INDEX IF NOT EXISTS "TelegramOutbox_jobRunId_idx" ON "TelegramOutbox"("jobRunId");
DO $$ BEGIN
  ALTER TABLE "TelegramOutbox" ADD CONSTRAINT "TelegramOutbox_jobRunId_fkey"
    FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProbationSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultDurationMonths" INTEGER NOT NULL,
    "reviewDays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "categories" JSONB NOT NULL,
    "ratingLabels" JSONB NOT NULL,
    "selfQuestions" JSONB NOT NULL,
    "reminderDaysBefore" INTEGER NOT NULL,
    "remindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scoreBands" JSONB NOT NULL,
    "approvalWorkflow" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProbationSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ErInvestigation" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "relatedType" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "investigatorId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "involvedIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "interviewNotes" TEXT NOT NULL DEFAULT '',
    "findings" TEXT NOT NULL DEFAULT '',
    "recommendations" TEXT NOT NULL DEFAULT '',
    "managementDecision" TEXT,
    "outcome" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "notes" JSONB NOT NULL DEFAULT '[]',
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "dueDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ErInvestigation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ErInvestigation_refNo_key" ON "ErInvestigation"("refNo");
CREATE INDEX IF NOT EXISTS "ErInvestigation_status_idx" ON "ErInvestigation"("status");
CREATE INDEX IF NOT EXISTS "ErInvestigation_relatedType_idx" ON "ErInvestigation"("relatedType");
CREATE INDEX IF NOT EXISTS "ErInvestigation_investigatorId_idx" ON "ErInvestigation"("investigatorId");

CREATE TABLE IF NOT EXISTS "ErSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "complaintCategories" JSONB NOT NULL,
    "grievanceTypes" JSONB NOT NULL,
    "conflictCategories" JSONB NOT NULL,
    "violationCategories" JSONB NOT NULL,
    "disciplinaryActionTypes" JSONB NOT NULL,
    "priorities" JSONB NOT NULL,
    "workflowStatuses" JSONB NOT NULL,
    "notifyOnAssignment" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnOverdue" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnManagementReview" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ErSettings_pkey" PRIMARY KEY ("id")
);
