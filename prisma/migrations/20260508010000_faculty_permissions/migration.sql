-- ============================================================================
-- Granular faculty permissions + supervising-faculty assignments.
--
-- Adds 6 new enum values to ProgramMemberRole (PD, CHAIR, CC_MEMBER,
-- FACULTY, COORDINATOR, DEPT_HEAD) and the FacultyAssignment join
-- table that gates the PD dashboard so a FACULTY-role member only
-- sees the residents they actively supervise.
--
-- Strategy notes:
--   • New enum values are ADDED — existing OWNER / MEMBER values stay
--     as-is. Existing rows do not need a backfill; OWNER continues to
--     mean "full PD-equivalent access". MEMBER continues to mean
--     "vanilla program member" and is treated as FACULTY in the
--     application layer until the institution explicitly upgrades.
--   • Postgres requires a separate transaction to ALTER TYPE ADD
--     VALUE — we do all six in this migration to keep the rollout
--     atomic.
--   • FacultyAssignment references program_members (not users)
--     directly so an assignment can only exist within a shared
--     program — no cross-program leakage by construction.
-- ============================================================================

-- ─── Add granular roles to ProgramMemberRole ─────────────────────────────
ALTER TYPE "ProgramMemberRole" ADD VALUE IF NOT EXISTS 'PD';
ALTER TYPE "ProgramMemberRole" ADD VALUE IF NOT EXISTS 'CHAIR';
ALTER TYPE "ProgramMemberRole" ADD VALUE IF NOT EXISTS 'CC_MEMBER';
ALTER TYPE "ProgramMemberRole" ADD VALUE IF NOT EXISTS 'FACULTY';
ALTER TYPE "ProgramMemberRole" ADD VALUE IF NOT EXISTS 'COORDINATOR';
ALTER TYPE "ProgramMemberRole" ADD VALUE IF NOT EXISTS 'DEPT_HEAD';

-- ─── faculty_assignments ────────────────────────────────────────────────
CREATE TABLE "faculty_assignments" (
  "id"         TEXT         NOT NULL,
  "programId"  TEXT         NOT NULL,
  "facultyId"  TEXT         NOT NULL,
  "residentId" TEXT         NOT NULL,
  "startDate"  TIMESTAMP(3),
  "endDate"    TIMESTAMP(3),
  "isPrimary"  BOOLEAN      NOT NULL DEFAULT FALSE,
  "notes"      TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "faculty_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "faculty_assignments_facultyId_fkey"
    FOREIGN KEY ("facultyId")  REFERENCES "program_members"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "faculty_assignments_residentId_fkey"
    FOREIGN KEY ("residentId") REFERENCES "program_members"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unique constraint: a faculty member can't have the same resident
-- assigned twice on the same start date. (Re-assignments after a
-- block ends use a new start date.)
CREATE UNIQUE INDEX "faculty_assignments_facultyId_residentId_startDate_key"
  ON "faculty_assignments" ("facultyId", "residentId", "startDate");

CREATE INDEX "faculty_assignments_programId_facultyId_idx"
  ON "faculty_assignments" ("programId", "facultyId");

CREATE INDEX "faculty_assignments_programId_residentId_idx"
  ON "faculty_assignments" ("programId", "residentId");

-- ─── Row-Level Security ─────────────────────────────────────────────────
-- Defence-in-depth: even if the anon key leaks, a member can only see
-- assignments inside a program they're a member of.
ALTER TABLE "faculty_assignments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faculty_assignments_program_member" ON "faculty_assignments" FOR SELECT
  USING (
    "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
