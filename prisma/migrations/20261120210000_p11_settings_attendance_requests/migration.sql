-- P11: platform settings, attendance corrections, shift swaps, profile/org changes, staffing

CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL,
    "companyNameKm" TEXT,
    "workStart" TEXT,
    "workEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Phnom_Penh',
    "checkInAllowButton" BOOLEAN NOT NULL DEFAULT true,
    "checkInAllowQr" BOOLEAN NOT NULL DEFAULT true,
    "checkInAllowLocation" BOOLEAN NOT NULL DEFAULT false,
    "outsidePolicy" TEXT NOT NULL DEFAULT 'allow_with_reason',
    "locationRequired" TEXT NOT NULL DEFAULT 'flag',
    "idleTimeoutMinutesDefault" INTEGER NOT NULL DEFAULT 30,
    "idleTimeoutMinutesPrivileged" INTEGER NOT NULL DEFAULT 120,
    "twoStepRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "maskPhoneByDefault" BOOLEAN NOT NULL DEFAULT true,
    "payroll" JSONB,
    "welcomeTemplate" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OfficeLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKm" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "radiusMetres" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OfficeLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApprovalChainConfig" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalChainConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApprovalChainConfig_requestType_key" ON "ApprovalChainConfig"("requestType");

CREATE TABLE IF NOT EXISTS "LetterTemplate" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "bodyKm" TEXT,
    "defaultLang" TEXT NOT NULL DEFAULT 'both',
    "useKhmerNumerals" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LetterTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LetterTemplate_kind_idx" ON "LetterTemplate"("kind");

CREATE TABLE IF NOT EXISTS "AttendanceCorrection" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "correctCheckIn" TEXT NOT NULL,
    "correctCheckOut" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    CONSTRAINT "AttendanceCorrection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AttendanceCorrection_employeeId_idx" ON "AttendanceCorrection"("employeeId");
CREATE INDEX IF NOT EXISTS "AttendanceCorrection_status_idx" ON "AttendanceCorrection"("status");
CREATE INDEX IF NOT EXISTS "AttendanceCorrection_date_idx" ON "AttendanceCorrection"("date");
DO $$ BEGIN
  ALTER TABLE "AttendanceCorrection" ADD CONSTRAINT "AttendanceCorrection_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ShiftSwapRequest" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "counterpartId" TEXT NOT NULL,
    "requesterDate" DATE NOT NULL,
    "counterpartDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    CONSTRAINT "ShiftSwapRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_periodId_idx" ON "ShiftSwapRequest"("periodId");
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_requesterId_idx" ON "ShiftSwapRequest"("requesterId");
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_counterpartId_idx" ON "ShiftSwapRequest"("counterpartId");
CREATE INDEX IF NOT EXISTS "ShiftSwapRequest_status_idx" ON "ShiftSwapRequest"("status");
DO $$ BEGIN
  ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "RosterPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ShiftSwapRequest" ADD CONSTRAINT "ShiftSwapRequest_counterpartId_fkey"
    FOREIGN KEY ("counterpartId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProfileChangeRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "previousValues" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    CONSTRAINT "ProfileChangeRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProfileChangeRequest_employeeId_idx" ON "ProfileChangeRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "ProfileChangeRequest_status_idx" ON "ProfileChangeRequest"("status");
DO $$ BEGIN
  ALTER TABLE "ProfileChangeRequest" ADD CONSTRAINT "ProfileChangeRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "OrgChangeRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "newDepartmentId" TEXT,
    "newPositionId" TEXT,
    "newManagerId" TEXT,
    "newBaseSalary" DECIMAL(12,2),
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    CONSTRAINT "OrgChangeRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OrgChangeRequest_employeeId_idx" ON "OrgChangeRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "OrgChangeRequest_status_idx" ON "OrgChangeRequest"("status");
CREATE INDEX IF NOT EXISTS "OrgChangeRequest_kind_idx" ON "OrgChangeRequest"("kind");
DO $$ BEGIN
  ALTER TABLE "OrgChangeRequest" ADD CONSTRAINT "OrgChangeRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "StaffingRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "positionId" TEXT,
    "orgPositionId" TEXT,
    "departmentId" TEXT NOT NULL,
    "branchId" TEXT,
    "headcount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "proposeNewPosition" BOOLEAN NOT NULL DEFAULT false,
    "proposedPositionTitle" TEXT,
    "budgetMin" DECIMAL(12,2),
    "budgetMax" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    CONSTRAINT "StaffingRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StaffingRequest_requesterId_idx" ON "StaffingRequest"("requesterId");
CREATE INDEX IF NOT EXISTS "StaffingRequest_departmentId_idx" ON "StaffingRequest"("departmentId");
CREATE INDEX IF NOT EXISTS "StaffingRequest_status_idx" ON "StaffingRequest"("status");
CREATE INDEX IF NOT EXISTS "StaffingRequest_jobId_idx" ON "StaffingRequest"("jobId");
DO $$ BEGIN
  ALTER TABLE "StaffingRequest" ADD CONSTRAINT "StaffingRequest_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "StaffingRequest" ADD CONSTRAINT "StaffingRequest_positionId_fkey"
    FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "StaffingRequest" ADD CONSTRAINT "StaffingRequest_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "StaffingRequest" ADD CONSTRAINT "StaffingRequest_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "OrgBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "StaffingRequest" ADD CONSTRAINT "StaffingRequest_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
