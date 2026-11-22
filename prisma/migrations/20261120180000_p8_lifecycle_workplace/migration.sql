-- P8: resignation/offboarding, ER, performance, training, helpdesk, workplace, benefits/assets

CREATE TABLE IF NOT EXISTS "ResignationRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "lastWorkingDay" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "offboardingCaseId" TEXT,
    "approvalId" TEXT,
    "rejectComment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResignationRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ResignationRequest_offboardingCaseId_key" ON "ResignationRequest"("offboardingCaseId");
CREATE UNIQUE INDEX IF NOT EXISTS "ResignationRequest_approvalId_key" ON "ResignationRequest"("approvalId");
CREATE INDEX IF NOT EXISTS "ResignationRequest_employeeId_idx" ON "ResignationRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "ResignationRequest_status_idx" ON "ResignationRequest"("status");
DO $$ BEGIN ALTER TABLE "ResignationRequest" ADD CONSTRAINT "ResignationRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "OffboardingCase" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "lastWorkingDay" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "exitInterview" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OffboardingCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OffboardingCase_employeeId_idx" ON "OffboardingCase"("employeeId");
CREATE INDEX IF NOT EXISTS "OffboardingCase_status_idx" ON "OffboardingCase"("status");
DO $$ BEGIN ALTER TABLE "OffboardingCase" ADD CONSTRAINT "OffboardingCase_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "OffboardingTask" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ownerRole" TEXT NOT NULL DEFAULT 'hr',
    "kind" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OffboardingTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OffboardingTask_caseId_idx" ON "OffboardingTask"("caseId");
DO $$ BEGIN ALTER TABLE "OffboardingTask" ADD CONSTRAINT "OffboardingTask_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "OffboardingCase"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ErCase" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "employeeId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "assigneeId" TEXT,
    "involvedIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolution" TEXT,
    "dueDate" TEXT,
    "meta" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ErCase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ErCase_refNo_key" ON "ErCase"("refNo");
CREATE INDEX IF NOT EXISTS "ErCase_type_idx" ON "ErCase"("type");
CREATE INDEX IF NOT EXISTS "ErCase_status_idx" ON "ErCase"("status");
CREATE INDEX IF NOT EXISTS "ErCase_employeeId_idx" ON "ErCase"("employeeId");
DO $$ BEGIN ALTER TABLE "ErCase" ADD CONSTRAINT "ErCase_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PerformanceCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "ratingScale" INTEGER NOT NULL DEFAULT 5,
    "participantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerformanceCycle_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PerformanceCycle_status_idx" ON "PerformanceCycle"("status");

CREATE TABLE IF NOT EXISTS "PerformanceGoal" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT,
    "title" TEXT NOT NULL,
    "titleKm" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'on_track',
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerformanceGoal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PerformanceGoal_employeeId_idx" ON "PerformanceGoal"("employeeId");
CREATE INDEX IF NOT EXISTS "PerformanceGoal_cycleId_idx" ON "PerformanceGoal"("cycleId");
DO $$ BEGIN ALTER TABLE "PerformanceGoal" ADD CONSTRAINT "PerformanceGoal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PerformanceGoal" ADD CONSTRAINT "PerformanceGoal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PerformanceReview" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "cycleId" TEXT,
    "rating" INTEGER,
    "selfRating" INTEGER,
    "selfComment" TEXT,
    "managerComment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dueDate" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PerformanceReview_employeeId_idx" ON "PerformanceReview"("employeeId");
CREATE INDEX IF NOT EXISTS "PerformanceReview_cycleId_idx" ON "PerformanceReview"("cycleId");
CREATE INDEX IF NOT EXISTS "PerformanceReview_status_idx" ON "PerformanceReview"("status");
DO $$ BEGIN ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKm" TEXT,
    "category" TEXT,
    "durationHours" DECIMAL(6,2),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TEXT,
    "trainer" TEXT,
    "seats" INTEGER,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Course_status_idx" ON "Course"("status");

CREATE TABLE IF NOT EXISTS "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TEXT,
    "assignedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CourseEnrollment_courseId_employeeId_key" ON "CourseEnrollment"("courseId", "employeeId");
CREATE INDEX IF NOT EXISTS "CourseEnrollment_employeeId_idx" ON "CourseEnrollment"("employeeId");
CREATE INDEX IF NOT EXISTS "CourseEnrollment_status_idx" ON "CourseEnrollment"("status");
DO $$ BEGIN ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "HelpdeskTicket" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigneeId" TEXT,
    "slaDueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HelpdeskTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HelpdeskTicket_employeeId_idx" ON "HelpdeskTicket"("employeeId");
CREATE INDEX IF NOT EXISTS "HelpdeskTicket_status_idx" ON "HelpdeskTicket"("status");
DO $$ BEGIN ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "HelpdeskMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HelpdeskMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HelpdeskMessage_ticketId_idx" ON "HelpdeskMessage"("ticketId");
DO $$ BEGIN ALTER TABLE "HelpdeskMessage" ADD CONSTRAINT "HelpdeskMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "HelpdeskTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "LetterRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "purpose" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "copies" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvalId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LetterRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LetterRequest_approvalId_key" ON "LetterRequest"("approvalId");
CREATE INDEX IF NOT EXISTS "LetterRequest_employeeId_idx" ON "LetterRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "LetterRequest_status_idx" ON "LetterRequest"("status");
DO $$ BEGIN ALTER TABLE "LetterRequest" ADD CONSTRAINT "LetterRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "KudosItem" (
    "id" TEXT NOT NULL,
    "fromEmployeeId" TEXT NOT NULL,
    "toEmployeeId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'great_work',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KudosItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "KudosItem_toEmployeeId_idx" ON "KudosItem"("toEmployeeId");
CREATE INDEX IF NOT EXISTS "KudosItem_fromEmployeeId_idx" ON "KudosItem"("fromEmployeeId");
DO $$ BEGIN ALTER TABLE "KudosItem" ADD CONSTRAINT "KudosItem_fromEmployeeId_fkey" FOREIGN KEY ("fromEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "KudosItem" ADD CONSTRAINT "KudosItem_toEmployeeId_fkey" FOREIGN KEY ("toEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PulseSurvey" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "target" TEXT NOT NULL DEFAULT 'all',
    "openDate" TEXT,
    "closeDate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PulseSurvey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PulseSurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PulseSurveyResponse_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PulseSurveyResponse_surveyId_idx" ON "PulseSurveyResponse"("surveyId");
DO $$ BEGIN ALTER TABLE "PulseSurveyResponse" ADD CONSTRAINT "PulseSurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "PulseSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SuggestionItem" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "publicReply" TEXT,
    "showOnBoard" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SuggestionItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SuggestionItem_status_idx" ON "SuggestionItem"("status");
DO $$ BEGIN ALTER TABLE "SuggestionItem" ADD CONSTRAINT "SuggestionItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "BenefitPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKm" TEXT,
    "type" TEXT NOT NULL DEFAULT 'other',
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BenefitPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BenefitEnrollment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BenefitEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BenefitEnrollment_planId_employeeId_key" ON "BenefitEnrollment"("planId", "employeeId");
CREATE INDEX IF NOT EXISTS "BenefitEnrollment_employeeId_idx" ON "BenefitEnrollment"("employeeId");
DO $$ BEGIN ALTER TABLE "BenefitEnrollment" ADD CONSTRAINT "BenefitEnrollment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BenefitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BenefitEnrollment" ADD CONSTRAINT "BenefitEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CompanyAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "status" TEXT NOT NULL DEFAULT 'available',
    "assignedToId" TEXT,
    "purchaseDate" TEXT,
    "assignedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "assignCondition" TEXT,
    "returnCondition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyAsset_tag_key" ON "CompanyAsset"("tag");
CREATE INDEX IF NOT EXISTS "CompanyAsset_status_idx" ON "CompanyAsset"("status");
CREATE INDEX IF NOT EXISTS "CompanyAsset_assignedToId_idx" ON "CompanyAsset"("assignedToId");
DO $$ BEGIN ALTER TABLE "CompanyAsset" ADD CONSTRAINT "CompanyAsset_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
