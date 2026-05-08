-- ===========================================================================
-- Rotations + Competence Committee (CC) reviews
--
-- Adds the schema needed for:
--   • RCSPC-style rotation block scheduling (cases / EPAs auto-attribute
--     to the resident's active rotation block)
--   • Quarterly Competence Committee meetings with per-resident
--     scrubbing dashboards, multi-author notes, and decision logging
--
-- Both tables are scoped via existing ProgramMember + RLS policies; we
-- piggy-back on the program-level access controls already enforced for
-- ProgramEvent and ProgramInvite.
-- ===========================================================================

-- ─── Enums ────────────────────────────────────────────────────────────────
CREATE TYPE "RotationCategory" AS ENUM (
  'CORE',
  'SUBSPECIALTY',
  'ELECTIVE',
  'RESEARCH',
  'CALL',
  'OTHER'
);

CREATE TYPE "CCDecision" AS ENUM (
  'PROMOTE',
  'CONTINUE',
  'ON_WATCH',
  'REMEDIATION',
  'PROBATION',
  'GRADUATE',
  'WITHDRAW'
);

CREATE TYPE "CCReviewStatus" AS ENUM (
  'IN_PROGRESS',
  'FINALISED',
  'ARCHIVED'
);

-- ─── Rotation (a program-defined service) ─────────────────────────────────
CREATE TABLE "rotations" (
  "id"          TEXT             NOT NULL,
  "programId"   TEXT             NOT NULL,
  "name"        TEXT             NOT NULL,
  "shortName"   TEXT,
  "specialty"   TEXT,
  "category"    "RotationCategory" NOT NULL DEFAULT 'CORE',
  "description" TEXT,
  "colour"      TEXT,
  "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "rotations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rotations_programId_fkey" FOREIGN KEY ("programId")
    REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "rotations_programId_name_key"
  ON "rotations"("programId", "name");
CREATE INDEX "rotations_programId_idx" ON "rotations"("programId");

-- ─── RotationAssignment (a resident on a rotation, dated) ─────────────────
CREATE TABLE "rotation_assignments" (
  "id"         TEXT         NOT NULL,
  "rotationId" TEXT         NOT NULL,
  "userId"     TEXT         NOT NULL,
  "startDate"  TIMESTAMP(3) NOT NULL,
  "endDate"    TIMESTAMP(3) NOT NULL,
  "blockLabel" TEXT,
  "notes"      TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "rotation_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rotation_assignments_rotationId_fkey" FOREIGN KEY ("rotationId")
    REFERENCES "rotations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "rotation_assignments_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "rotation_assignments_userId_startDate_idx"
  ON "rotation_assignments"("userId", "startDate");
CREATE INDEX "rotation_assignments_rotationId_startDate_idx"
  ON "rotation_assignments"("rotationId", "startDate");

-- ─── Wire CaseLog ↔ RotationAssignment ────────────────────────────────────
ALTER TABLE "case_logs"
  ADD COLUMN "rotationAssignmentId" TEXT;
ALTER TABLE "case_logs"
  ADD CONSTRAINT "case_logs_rotationAssignmentId_fkey"
  FOREIGN KEY ("rotationAssignmentId")
  REFERENCES "rotation_assignments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "case_logs_rotationAssignmentId_idx"
  ON "case_logs"("rotationAssignmentId");

-- ─── Wire EpaObservation ↔ RotationAssignment ────────────────────────────
ALTER TABLE "epa_observations"
  ADD COLUMN "rotationAssignmentId" TEXT;
ALTER TABLE "epa_observations"
  ADD CONSTRAINT "epa_observations_rotationAssignmentId_fkey"
  FOREIGN KEY ("rotationAssignmentId")
  REFERENCES "rotation_assignments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "epa_observations_rotationAssignmentId_idx"
  ON "epa_observations"("rotationAssignmentId");

-- ─── CCReview (a resident's review at one CC meeting) ────────────────────
CREATE TABLE "cc_reviews" (
  "id"                TEXT             NOT NULL,
  "programId"         TEXT             NOT NULL,
  "residentId"        TEXT             NOT NULL,
  "meetingDate"       TIMESTAMP(3)     NOT NULL,
  "cycleLabel"        TEXT,
  "snapshot"          JSONB,
  "decision"          "CCDecision",
  "decisionRationale" TEXT,
  "chairSummary"      TEXT,
  "dissent"           TEXT,
  "status"            "CCReviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "finalisedAt"       TIMESTAMP(3),
  "finalisedById"     TEXT,
  "createdById"       TEXT             NOT NULL,
  "createdAt"         TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "cc_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cc_reviews_programId_fkey" FOREIGN KEY ("programId")
    REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cc_reviews_residentId_fkey" FOREIGN KEY ("residentId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cc_reviews_finalisedById_fkey" FOREIGN KEY ("finalisedById")
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "cc_reviews_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "cc_reviews_programId_meetingDate_idx"
  ON "cc_reviews"("programId", "meetingDate");
CREATE INDEX "cc_reviews_residentId_idx" ON "cc_reviews"("residentId");

-- ─── CCReviewNote (per-author commentary on a review) ────────────────────
CREATE TABLE "cc_review_notes" (
  "id"        TEXT         NOT NULL,
  "reviewId"  TEXT         NOT NULL,
  "authorId"  TEXT         NOT NULL,
  "body"      TEXT         NOT NULL,
  "category"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "cc_review_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cc_review_notes_reviewId_fkey" FOREIGN KEY ("reviewId")
    REFERENCES "cc_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cc_review_notes_authorId_fkey" FOREIGN KEY ("authorId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "cc_review_notes_reviewId_idx" ON "cc_review_notes"("reviewId");

-- ─── Row-Level Security ───────────────────────────────────────────────────
-- All four new tables enforce program-membership at the API layer (we
-- pass userId via withAuth). We still enable RLS so direct DB clients
-- (a stolen anon key, etc.) can't bypass program scope.

ALTER TABLE "rotations"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rotation_assignments"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cc_reviews"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cc_review_notes"       ENABLE ROW LEVEL SECURITY;

-- The Hippo backend uses a service-role connection that bypasses RLS, so
-- these policies exist as a defence-in-depth net rather than the primary
-- access control.
CREATE POLICY "rotations_program_member" ON "rotations" FOR SELECT
  USING (
    "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "rotation_assignments_self_or_program" ON "rotation_assignments" FOR SELECT
  USING (
    "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "rotationId" IN (
      SELECT "id" FROM "rotations" r
      WHERE r."programId" IN (
        SELECT "programId" FROM "program_members"
        WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

CREATE POLICY "cc_reviews_program_member" ON "cc_reviews" FOR SELECT
  USING (
    "residentId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "cc_review_notes_program_member" ON "cc_review_notes" FOR SELECT
  USING (
    "reviewId" IN (
      SELECT "id" FROM "cc_reviews" r
      WHERE r."residentId" = current_setting('request.jwt.claims', true)::json->>'sub'
        OR r."programId" IN (
          SELECT "programId" FROM "program_members"
          WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    )
  );
