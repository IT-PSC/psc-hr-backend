-- P7: contracts, probation, recruitment, onboarding

CREATE TABLE IF NOT EXISTS "ContractTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKm" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'fixed',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "bodyKm" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmploymentContract" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contractType" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "signedAt" TIMESTAMP(3),
    "salary" DECIMAL(14,2),
    "probationEndDate" TEXT,
    "templateId" TEXT,
    "previousContractId" TEXT,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmploymentContract_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EmploymentContract_employeeId_idx" ON "EmploymentContract"("employeeId");
CREATE INDEX IF NOT EXISTS "EmploymentContract_status_idx" ON "EmploymentContract"("status");
CREATE INDEX IF NOT EXISTS "EmploymentContract_startDate_idx" ON "EmploymentContract"("startDate");
DO $$ BEGIN
  ALTER TABLE "EmploymentContract" ADD CONSTRAINT "EmploymentContract_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmploymentContract" ADD CONSTRAINT "EmploymentContract_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProbationCase" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL DEFAULT 3,
    "stage" TEXT NOT NULL DEFAULT 'month1',
    "status" TEXT NOT NULL DEFAULT 'pending_eval',
    "overallScore" DECIMAL(6,2),
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "finalDecision" TEXT,
    "decisionRemarks" TEXT,
    "extensionMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProbationCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProbationCase_employeeId_idx" ON "ProbationCase"("employeeId");
CREATE INDEX IF NOT EXISTS "ProbationCase_status_idx" ON "ProbationCase"("status");
DO $$ BEGIN
  ALTER TABLE "ProbationCase" ADD CONSTRAINT "ProbationCase_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProbationEvaluation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "answers" JSONB,
    "weightedScore" DECIMAL(6,2),
    "comments" TEXT,
    "submittedAt" TIMESTAMP(3),
    "evaluatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProbationEvaluation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProbationEvaluation_caseId_month_type_key" ON "ProbationEvaluation"("caseId", "month", "type");
CREATE INDEX IF NOT EXISTS "ProbationEvaluation_employeeId_idx" ON "ProbationEvaluation"("employeeId");
DO $$ BEGIN
  ALTER TABLE "ProbationEvaluation" ADD CONSTRAINT "ProbationEvaluation_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "ProbationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProbationPip" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "improvementArea" TEXT NOT NULL,
    "performanceIssue" TEXT,
    "expectedImprovement" TEXT,
    "requiredActions" TEXT,
    "responsiblePersonId" TEXT,
    "startDate" TEXT,
    "targetDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProbationPip_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProbationPip_caseId_idx" ON "ProbationPip"("caseId");
CREATE INDEX IF NOT EXISTS "ProbationPip_employeeId_idx" ON "ProbationPip"("employeeId");
DO $$ BEGIN
  ALTER TABLE "ProbationPip" ADD CONSTRAINT "ProbationPip_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "ProbationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "JobPosting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKm" TEXT,
    "departmentId" TEXT,
    "positionId" TEXT,
    "location" TEXT,
    "employmentType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "filledCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "requirements" TEXT,
    "postedAt" TIMESTAMP(3),
    "closingDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "JobPosting_status_idx" ON "JobPosting"("status");
CREATE INDEX IF NOT EXISTS "JobPosting_departmentId_idx" ON "JobPosting"("departmentId");

CREATE TABLE IF NOT EXISTS "Candidate" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'applied',
    "rating" INTEGER,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "notes" TEXT,
    "offerStatus" TEXT NOT NULL DEFAULT 'none',
    "offerSalary" DECIMAL(14,2),
    "offerStartDate" TEXT,
    "rejectReason" TEXT,
    "convertedEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Candidate_jobId_idx" ON "Candidate"("jobId");
CREATE INDEX IF NOT EXISTS "Candidate_stage_idx" ON "Candidate"("stage");
CREATE INDEX IF NOT EXISTS "Candidate_email_idx" ON "Candidate"("email");
DO $$ BEGIN
  ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Interview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "interviewerId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'onsite',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "feedback" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Interview_candidateId_idx" ON "Interview"("candidateId");
CREATE INDEX IF NOT EXISTS "Interview_scheduledAt_idx" ON "Interview"("scheduledAt");
DO $$ BEGIN
  ALTER TABLE "Interview" ADD CONSTRAINT "Interview_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "OnboardingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKm" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "taskDefs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OnboardingCase" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "templateId" TEXT,
    "joiningDate" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'preboarding',
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "managerId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OnboardingCase_employeeId_idx" ON "OnboardingCase"("employeeId");
CREATE INDEX IF NOT EXISTS "OnboardingCase_status_idx" ON "OnboardingCase"("status");
DO $$ BEGIN
  ALTER TABLE "OnboardingCase" ADD CONSTRAINT "OnboardingCase_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OnboardingCase" ADD CONSTRAINT "OnboardingCase_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "OnboardingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "OnboardingTask" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'hr',
    "assigneeId" TEXT,
    "dueDate" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OnboardingTask_caseId_idx" ON "OnboardingTask"("caseId");
CREATE INDEX IF NOT EXISTS "OnboardingTask_status_idx" ON "OnboardingTask"("status");
DO $$ BEGIN
  ALTER TABLE "OnboardingTask" ADD CONSTRAINT "OnboardingTask_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "OnboardingCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
