-- P6: overtime, timesheet, roster, calendar, payslip, announcements, policies

CREATE TABLE IF NOT EXISTS "OvertimeRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "hours" DECIMAL(6,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "otType" TEXT,
    "category" TEXT,
    "hoursToPay" DECIMAL(6,2),
    "includeInPayroll" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalId" TEXT,
    "rejectComment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OvertimeRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OvertimeRequest_approvalId_key" ON "OvertimeRequest"("approvalId");
CREATE INDEX IF NOT EXISTS "OvertimeRequest_employeeId_idx" ON "OvertimeRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "OvertimeRequest_status_idx" ON "OvertimeRequest"("status");
CREATE INDEX IF NOT EXISTS "OvertimeRequest_date_idx" ON "OvertimeRequest"("date");
DO $$ BEGIN
  ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "TimesheetLock" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimesheetLock_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TimesheetLock_month_key" ON "TimesheetLock"("month");

CREATE TABLE IF NOT EXISTS "TimesheetApproval" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL DEFAULT 'company',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "approvalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TimesheetApproval_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TimesheetApproval_month_scopeKey_key" ON "TimesheetApproval"("month", "scopeKey");
CREATE UNIQUE INDEX IF NOT EXISTS "TimesheetApproval_approvalId_key" ON "TimesheetApproval"("approvalId");
CREATE INDEX IF NOT EXISTS "TimesheetApproval_status_idx" ON "TimesheetApproval"("status");

CREATE TABLE IF NOT EXISTS "ShiftCode" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelKm" TEXT,
    "timeRange" TEXT,
    "color" TEXT,
    "dayValue" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "isOff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShiftCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RosterPeriod" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKm" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RosterPeriod_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RosterPeriod_departmentId_idx" ON "RosterPeriod"("departmentId");
CREATE INDEX IF NOT EXISTS "RosterPeriod_status_idx" ON "RosterPeriod"("status");

CREATE TABLE IF NOT EXISTS "RosterEntry" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "shiftCode" TEXT NOT NULL,
    CONSTRAINT "RosterEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RosterEntry_periodId_employeeId_date_key" ON "RosterEntry"("periodId", "employeeId", "date");
CREATE INDEX IF NOT EXISTS "RosterEntry_employeeId_idx" ON "RosterEntry"("employeeId");
CREATE INDEX IF NOT EXISTS "RosterEntry_date_idx" ON "RosterEntry"("date");
DO $$ BEGIN
  ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "RosterPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PublicHoliday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKm" TEXT,
    "date" TEXT NOT NULL,
    "rate" DECIMAL(4,2),
    CONSTRAINT "PublicHoliday_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PublicHoliday_date_key" ON "PublicHoliday"("date");

CREATE TABLE IF NOT EXISTS "LeaveBlackout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKm" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "departmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mode" TEXT NOT NULL DEFAULT 'block',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaveBlackout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payslip" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "baseSalary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "overtime" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "workedDays" DECIMAL(6,2),
    "unpaidLeaveDays" DECIMAL(6,2),
    "otHours" DECIMAL(6,2),
    "tax" DECIMAL(14,2),
    "nssfEmployee" DECIMAL(14,2),
    "nssfEmployer" DECIMAL(14,2),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Payslip_employeeId_month_key" ON "Payslip"("employeeId", "month");
CREATE INDEX IF NOT EXISTS "Payslip_month_idx" ON "Payslip"("month");
CREATE INDEX IF NOT EXISTS "Payslip_status_idx" ON "Payslip"("status");
DO $$ BEGIN
  ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKm" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "bodyKm" TEXT NOT NULL DEFAULT '',
    "author" TEXT,
    "target" TEXT NOT NULL DEFAULT 'all',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Announcement_published_idx" ON "Announcement"("published");
CREATE INDEX IF NOT EXISTS "Announcement_createdAt_idx" ON "Announcement"("createdAt");

CREATE TABLE IF NOT EXISTS "PolicyDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKm" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "fileName" TEXT,
    "target" TEXT NOT NULL DEFAULT 'all',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PolicyDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PolicyDocument_published_idx" ON "PolicyDocument"("published");

CREATE TABLE IF NOT EXISTS "PolicyAcknowledgement" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicyAcknowledgement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PolicyAcknowledgement_policyId_employeeId_key" ON "PolicyAcknowledgement"("policyId", "employeeId");
CREATE INDEX IF NOT EXISTS "PolicyAcknowledgement_employeeId_idx" ON "PolicyAcknowledgement"("employeeId");
DO $$ BEGIN
  ALTER TABLE "PolicyAcknowledgement" ADD CONSTRAINT "PolicyAcknowledgement_policyId_fkey"
    FOREIGN KEY ("policyId") REFERENCES "PolicyDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PolicyAcknowledgement" ADD CONSTRAINT "PolicyAcknowledgement_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
