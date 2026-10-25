-- ─────────────────────────────────────────────────────────────────────────────
-- PD 1:1 meeting record.
--
-- Pinned search_path: HippoVFinal is shared and multi-schema. "users" exists
-- in both auth and public, so the unqualified REFERENCES below would
-- otherwise be ambiguous. See 20261019120000_program_join_requests.
-- ─────────────────────────────────────────────────────────────────────────────
SET search_path TO public;

CREATE TYPE "PdMeetingStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "pd_meetings" (
  "id"                TEXT NOT NULL,
  "programId"         TEXT NOT NULL,
  "residentId"        TEXT NOT NULL,
  "directorId"        TEXT NOT NULL,
  "meetingDate"       TIMESTAMP(3) NOT NULL,
  "cycleLabel"        TEXT,
  "pgyAtMeeting"      INTEGER,
  "status"            "PdMeetingStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt"       TIMESTAMP(3),
  "previousMeetingId" TEXT,
  "sections"          JSONB NOT NULL,
  "snapshot"          JSONB,
  "acknowledgedAt"    TIMESTAMP(3),
  "acknowledgedName"  TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pd_meetings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pd_meetings_previousMeetingId_key" ON "pd_meetings"("previousMeetingId");
CREATE INDEX "pd_meetings_programId_meetingDate_idx" ON "pd_meetings"("programId", "meetingDate");
CREATE INDEX "pd_meetings_residentId_status_idx" ON "pd_meetings"("residentId", "status");

ALTER TABLE "pd_meetings"
  ADD CONSTRAINT "pd_meetings_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pd_meetings"
  ADD CONSTRAINT "pd_meetings_residentId_fkey" FOREIGN KEY ("residentId")
  REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pd_meetings"
  ADD CONSTRAINT "pd_meetings_directorId_fkey" FOREIGN KEY ("directorId")
  REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pd_meetings"
  ADD CONSTRAINT "pd_meetings_previousMeetingId_fkey" FOREIGN KEY ("previousMeetingId")
  REFERENCES "pd_meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "resident_score_entries" (
  "id"         TEXT NOT NULL,
  "programId"  TEXT NOT NULL,
  "residentId" TEXT NOT NULL,
  "tableId"    TEXT NOT NULL,
  "sittingAt"  TIMESTAMP(3) NOT NULL,
  "values"     JSONB NOT NULL,
  "note"       TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resident_score_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "resident_score_entries_lookup_idx"
  ON "resident_score_entries"("programId", "residentId", "tableId", "sittingAt");
ALTER TABLE "resident_score_entries"
  ADD CONSTRAINT "resident_score_entries_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resident_score_entries"
  ADD CONSTRAINT "resident_score_entries_residentId_fkey" FOREIGN KEY ("residentId")
  REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "resident_checklist_items" (
  "id"          TEXT NOT NULL,
  "programId"   TEXT NOT NULL,
  "residentId"  TEXT NOT NULL,
  "itemId"      TEXT NOT NULL,
  "completed"   BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "note"        TEXT,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resident_checklist_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "resident_checklist_items_residentId_programId_itemId_key"
  ON "resident_checklist_items"("residentId", "programId", "itemId");
CREATE INDEX "resident_checklist_items_programId_residentId_idx"
  ON "resident_checklist_items"("programId", "residentId");
ALTER TABLE "resident_checklist_items"
  ADD CONSTRAINT "resident_checklist_items_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resident_checklist_items"
  ADD CONSTRAINT "resident_checklist_items_residentId_fkey" FOREIGN KEY ("residentId")
  REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "program_meeting_configs" (
  "id"             TEXT NOT NULL,
  "programId"      TEXT NOT NULL,
  "logoUrl"        TEXT,
  "letterhead"     JSONB,
  "sectionConfig"  JSONB,
  "checklists"     JSONB NOT NULL,
  "scoreTables"    JSONB NOT NULL,
  "certifications" JSONB NOT NULL,
  "introText"      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "program_meeting_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "program_meeting_configs_programId_key"
  ON "program_meeting_configs"("programId");
ALTER TABLE "program_meeting_configs"
  ADD CONSTRAINT "program_meeting_configs_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Narrower than the other tables on purpose. A 1:1 record is visible to the
-- subject and to PD-like members only, never to a CC member or coordinator
-- who merely has roster access. Mirrors roleCanReadPdMeetings().
ALTER TABLE "pd_meetings"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resident_score_entries"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resident_checklist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "program_meeting_configs"  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pd_meetings_subject_or_director" ON "pd_meetings" FOR SELECT
  USING (
    "residentId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
        AND "role" IN ('OWNER', 'PD')
    )
  );

CREATE POLICY "resident_score_entries_subject_or_director" ON "resident_score_entries" FOR SELECT
  USING (
    "residentId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
        AND "role" IN ('OWNER', 'PD')
    )
  );

CREATE POLICY "resident_checklist_items_subject_or_director" ON "resident_checklist_items" FOR SELECT
  USING (
    "residentId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
        AND "role" IN ('OWNER', 'PD')
    )
  );

-- Config is not personal data, so any member of the program may read it.
CREATE POLICY "program_meeting_configs_members" ON "program_meeting_configs" FOR SELECT
  USING (
    "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
