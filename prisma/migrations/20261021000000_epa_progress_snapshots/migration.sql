-- Add historical progress storage without changing observations or cases.
CREATE TABLE "epa_progress_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialtySlug" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "sourceFilename" TEXT NOT NULL,
    "sourceReviewDate" DATE NOT NULL,
    "provenance" TEXT NOT NULL DEFAULT 'user_imported_summary',
    "payload" JSONB NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epa_progress_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "epa_progress_snapshots_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "epa_progress_snapshots_userId_specialtySlug_key"
  ON "epa_progress_snapshots"("userId", "specialtySlug");

-- Match the app's server-mediated privacy boundary. Direct Supabase client
-- roles cannot read or write this table; the authenticated API scopes by owner.
ALTER TABLE "epa_progress_snapshots" ENABLE ROW LEVEL SECURITY;
-- Supabase default privileges may grant newly created public tables to clients.
-- Remove client grants explicitly; direct server grants and ownership remain.
REVOKE ALL ON TABLE public.epa_progress_snapshots FROM PUBLIC, anon, authenticated;
-- No client policies or grants: access is through the owner-scoped server API.
