-- On-track projections (Pro): per-resident case targets + expected graduation.

ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "expectedGraduation" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "CaseTarget" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "label"      TEXT NOT NULL,
    "matchType"  TEXT NOT NULL,
    "matchValue" TEXT,
    "target"     INTEGER NOT NULL,
    "dueDate"    TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CaseTarget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CaseTarget_userId_idx" ON "CaseTarget"("userId");
