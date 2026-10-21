-- Add versioned programme evidence and explicit agreed procedure minima.
-- No existing cases, assessments, memberships or personal targets change.
CREATE TABLE "epa_progress_revisions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "specialtySlug" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "sourceReviewDate" DATE NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "epa_progress_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "epa_progress_revisions_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "epa_progress_revisions_userId_specialtySlug_contentHash_key"
  ON "epa_progress_revisions"("userId", "specialtySlug", "contentHash");
CREATE INDEX "epa_progress_revisions_userId_specialtySlug_createdAt_idx"
  ON "epa_progress_revisions"("userId", "specialtySlug", "createdAt");

CREATE TABLE "program_epa_reconciliations" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "residentId" TEXT NOT NULL,
  "specialtySlug" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "reviewedById" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decision" TEXT NOT NULL,
  "note" VARCHAR(2000),
  CONSTRAINT "program_epa_reconciliations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "program_epa_reconciliations_decision_check" CHECK ("decision" IN ('approved', 'needs_review')),
  CONSTRAINT "program_epa_reconciliations_programId_fkey" FOREIGN KEY ("programId")
    REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "program_epa_reconciliations_residentId_fkey" FOREIGN KEY ("residentId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "program_epa_reconciliations_reviewedById_fkey" FOREIGN KEY ("reviewedById")
    REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "program_epa_reconciliations_scope_reviewed_idx"
  ON "program_epa_reconciliations"("programId", "residentId", "specialtySlug", "reviewedAt");
CREATE INDEX "program_epa_reconciliations_contentHash_idx"
  ON "program_epa_reconciliations"("contentHash");

CREATE TABLE "program_procedure_targets" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "procedureDefinitionId" TEXT NOT NULL,
  "target" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "agreedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "program_procedure_targets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "program_procedure_targets_target_check" CHECK ("target" BETWEEN 1 AND 100000),
  CONSTRAINT "program_procedure_targets_version_check" CHECK ("version" > 0),
  CONSTRAINT "program_procedure_targets_programId_fkey" FOREIGN KEY ("programId")
    REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "program_procedure_targets_procedureDefinitionId_fkey" FOREIGN KEY ("procedureDefinitionId")
    REFERENCES "procedure_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "program_procedure_targets_agreedById_fkey" FOREIGN KEY ("agreedById")
    REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "program_procedure_targets_program_procedure_version_key"
  ON "program_procedure_targets"("programId", "procedureDefinitionId", "version");
CREATE INDEX "program_procedure_targets_programId_effectiveAt_idx"
  ON "program_procedure_targets"("programId", "effectiveAt");

-- Every read/write is mediated by the authenticated server and programme
-- membership checks. Supabase client roles have no direct table access.
ALTER TABLE "epa_progress_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "program_epa_reconciliations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "program_procedure_targets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.epa_progress_revisions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.program_epa_reconciliations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.program_procedure_targets FROM PUBLIC, anon, authenticated;
