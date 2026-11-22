-- AlterTable Employee: SPA-aligned optional profile fields
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "idNumber" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "avatarColor" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "allowances" DECIMAL(12,2);
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "deductions" DECIMAL(12,2);
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "bankAccount" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "nssfNumber" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "emergencyContact" JSONB;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "lastWorkingDay" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Employee_status_idx" ON "Employee"("status");

CREATE INDEX IF NOT EXISTS "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

CREATE TABLE IF NOT EXISTS "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustedDevice_tokenHash_key" ON "TrustedDevice"("tokenHash");
CREATE INDEX IF NOT EXISTS "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");
CREATE INDEX IF NOT EXISTS "TrustedDevice_expiresAt_idx" ON "TrustedDevice"("expiresAt");
