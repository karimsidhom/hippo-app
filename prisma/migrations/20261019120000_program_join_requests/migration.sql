-- ─────────────────────────────────────────────────────────────────────────────
-- Program join requests.
--
-- One table for both directions of the handshake. invitedById null means
-- the resident asked to join; invitedById set means the director invited
-- them. Transition rules live in src/lib/program-join/state.ts.
--
-- Entirely additive: one new table, one new enum, one new enum value, and
-- two columns with defaults. No existing row becomes invalid and no
-- existing column changes type.
-- ─────────────────────────────────────────────────────────────────────────────

-- This database is shared by several Hippo apps and is NOT single-schema.
-- The handover schema already owns a type called "JoinRequestStatus"
-- (HippoHandover's ServiceJoinRequest, values PENDING/APPROVED/DENIED),
-- which is a different type that happens to share our name. Pin the
-- search_path so every unqualified name below resolves to public and
-- neither migration can ever touch the other's type.
SET search_path TO public;

-- New member role. Note that a value added to an enum cannot be USED in
-- the same transaction that adds it, which is fine here because nothing
-- below references it.
ALTER TYPE "ProgramMemberRole" ADD VALUE IF NOT EXISTS 'RESIDENT';

CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN');

ALTER TABLE "programs"
  ADD COLUMN "discoverable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "meetingIntervalMonths" INTEGER NOT NULL DEFAULT 6;

CREATE TABLE "program_join_requests" (
  "id"            TEXT NOT NULL,
  "programId"     TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "status"        "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "claimedPgy"    INTEGER,
  "message"       TEXT,
  "invitedById"   TEXT,
  "decidedById"   TEXT,
  "decidedAt"     TIMESTAMP(3),
  "declineReason" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "program_join_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "program_join_requests_programId_userId_key"
  ON "program_join_requests"("programId", "userId");
CREATE INDEX "program_join_requests_programId_status_idx"
  ON "program_join_requests"("programId", "status");
CREATE INDEX "program_join_requests_userId_status_idx"
  ON "program_join_requests"("userId", "status");

ALTER TABLE "program_join_requests"
  ADD CONSTRAINT "program_join_requests_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_join_requests"
  ADD CONSTRAINT "program_join_requests_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_join_requests"
  ADD CONSTRAINT "program_join_requests_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "program_join_requests"
  ADD CONSTRAINT "program_join_requests_decidedById_fkey"
  FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Same posture as 20260508020000_custom_forms. Prisma connects as a
-- BYPASSRLS superuser, so this protects only against a leaked anon key
-- reaching PostgREST. The app's real authorisation is program-auth.ts.
ALTER TABLE "program_join_requests" ENABLE ROW LEVEL SECURITY;

-- The subject sees their own requests. Members of the program see the
-- program's requests.
CREATE POLICY "program_join_requests_self_or_program" ON "program_join_requests" FOR SELECT
  USING (
    "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
