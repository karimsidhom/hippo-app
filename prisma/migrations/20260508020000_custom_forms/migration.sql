-- ============================================================================
-- Custom assessment forms (Mini-CEX / DOPS / MSF / coaching / etc.)
--
-- Three-table model:
--   form_templates   — designed by program owners; JSON schema column
--   form_submissions — one filled-in instance, with sign-off lifecycle
--   form_responses   — per-field cells (relational so we can index +
--                      aggregate cohort-wide)
--
-- Sign-off lifecycle mirrors EpaObservation:
--   DRAFT → SUBMITTED → SIGNED / RETURNED
-- ============================================================================

-- ─── Enums ────────────────────────────────────────────────────────────────
CREATE TYPE "FormCategory" AS ENUM (
  'MINI_CEX',
  'DOPS',
  'MSF',
  'COACHING',
  'IN_TRAINING',
  'PROFESSIONALISM',
  'CUSTOM'
);

CREATE TYPE "FormSubmissionStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'SIGNED',
  'RETURNED'
);

-- ─── form_templates ──────────────────────────────────────────────────────
CREATE TABLE "form_templates" (
  "id"          TEXT             NOT NULL,
  "programId"   TEXT             NOT NULL,
  "name"        TEXT             NOT NULL,
  "description" TEXT,
  "category"    "FormCategory"   NOT NULL DEFAULT 'CUSTOM',
  "schema"      JSONB            NOT NULL,
  "active"      BOOLEAN          NOT NULL DEFAULT TRUE,
  "createdById" TEXT             NOT NULL,
  "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "form_templates_programId_fkey"
    FOREIGN KEY ("programId")   REFERENCES "programs"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "form_templates_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "form_templates_programId_idx" ON "form_templates" ("programId");

-- ─── form_submissions ───────────────────────────────────────────────────
CREATE TABLE "form_submissions" (
  "id"                  TEXT                  NOT NULL,
  "templateId"          TEXT                  NOT NULL,
  "subjectId"           TEXT                  NOT NULL,
  "authorId"            TEXT                  NOT NULL,
  "status"              "FormSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "caseLogId"           TEXT,
  "rotationAssignmentId" TEXT,
  "summary"             TEXT,
  "aggregateScore"      DOUBLE PRECISION,
  "signedAt"            TIMESTAMP(3),
  "returnedReason"      TEXT,
  "createdAt"           TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3)          NOT NULL,

  CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "form_submissions_templateId_fkey"
    FOREIGN KEY ("templateId")  REFERENCES "form_templates"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "form_submissions_subjectId_fkey"
    FOREIGN KEY ("subjectId")   REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "form_submissions_authorId_fkey"
    FOREIGN KEY ("authorId")    REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "form_submissions_caseLogId_fkey"
    FOREIGN KEY ("caseLogId")   REFERENCES "case_logs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "form_submissions_rotationAssignmentId_fkey"
    FOREIGN KEY ("rotationAssignmentId")
                                REFERENCES "rotation_assignments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "form_submissions_templateId_idx"
  ON "form_submissions" ("templateId");
CREATE INDEX "form_submissions_subjectId_status_idx"
  ON "form_submissions" ("subjectId", "status");
CREATE INDEX "form_submissions_authorId_status_idx"
  ON "form_submissions" ("authorId", "status");
CREATE INDEX "form_submissions_caseLogId_idx"
  ON "form_submissions" ("caseLogId");
CREATE INDEX "form_submissions_rotationAssignmentId_idx"
  ON "form_submissions" ("rotationAssignmentId");

-- ─── form_responses ─────────────────────────────────────────────────────
CREATE TABLE "form_responses" (
  "id"            TEXT         NOT NULL,
  "submissionId"  TEXT         NOT NULL,
  "fieldId"       TEXT         NOT NULL,
  "value"         JSONB        NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "form_responses_submissionId_fkey"
    FOREIGN KEY ("submissionId") REFERENCES "form_submissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "form_responses_submissionId_fieldId_key"
  ON "form_responses" ("submissionId", "fieldId");
CREATE INDEX "form_responses_submissionId_idx"
  ON "form_responses" ("submissionId");

-- ─── Row-Level Security ─────────────────────────────────────────────────
-- Templates: visible to every program member.
-- Submissions: visible to (a) the subject themselves, (b) the author,
--              (c) any program member with unbounded read access via
--              the program containing the template. The application
--              layer enforces this for the FACULTY case (assigned-only
--              residents); RLS is the defence-in-depth net.

ALTER TABLE "form_templates"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "form_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "form_responses"   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_templates_program_member" ON "form_templates" FOR SELECT
  USING (
    "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "form_submissions_self_or_program" ON "form_submissions" FOR SELECT
  USING (
    "subjectId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "authorId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "templateId" IN (
      SELECT t."id" FROM "form_templates" t
      WHERE t."programId" IN (
        SELECT "programId" FROM "program_members"
        WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

CREATE POLICY "form_responses_via_submission" ON "form_responses" FOR SELECT
  USING (
    "submissionId" IN (
      SELECT s."id" FROM "form_submissions" s
      WHERE s."subjectId" = current_setting('request.jwt.claims', true)::json->>'sub'
        OR s."authorId"  = current_setting('request.jwt.claims', true)::json->>'sub'
        OR s."templateId" IN (
          SELECT t."id" FROM "form_templates" t
          WHERE t."programId" IN (
            SELECT "programId" FROM "program_members"
            WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
          )
        )
    )
  );
