-- P10: org companies/branches, department & position org links

CREATE TABLE IF NOT EXISTS "OrgCompany" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNo" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrgCompany_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrgCompany_code_key" ON "OrgCompany"("code");

CREATE TABLE IF NOT EXISTS "OrgBranch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "managerEmployeeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrgBranch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrgBranch_code_key" ON "OrgBranch"("code");
CREATE INDEX IF NOT EXISTS "OrgBranch_companyId_idx" ON "OrgBranch"("companyId");
DO $$ BEGIN
  ALTER TABLE "OrgBranch" ADD CONSTRAINT "OrgBranch_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "OrgCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "managerEmployeeId" TEXT;
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS "Department_companyId_idx" ON "Department"("companyId");
CREATE INDEX IF NOT EXISTS "Department_branchId_idx" ON "Department"("branchId");
CREATE INDEX IF NOT EXISTS "Department_parentId_idx" ON "Department"("parentId");

DO $$ BEGIN
  ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "OrgCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Department" ADD CONSTRAINT "Department_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "OrgBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Department" ADD CONSTRAINT "Department_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
CREATE INDEX IF NOT EXISTS "Position_companyId_idx" ON "Position"("companyId");
DO $$ BEGIN
  ALTER TABLE "Position" ADD CONSTRAINT "Position_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "OrgCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
