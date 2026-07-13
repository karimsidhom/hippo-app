-- Hippo first-party growth engine. Business-contact and anonymous acquisition
-- data only; no clinical or patient information belongs in these tables.

CREATE TABLE "growth_leads" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "programName" TEXT,
  "specialty" TEXT,
  "residentCount" INTEGER,
  "country" TEXT,
  "message" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "content" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "consentAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "growth_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_referrals" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "signups" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "growth_referrals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_events" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "sessionId" TEXT,
  "userId" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "content" TEXT,
  "referralCode" TEXT,
  "referrerHost" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "growth_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "growth_referrals_code_key" ON "growth_referrals"("code");
CREATE UNIQUE INDEX "growth_referrals_ownerUserId_key" ON "growth_referrals"("ownerUserId");
CREATE INDEX "growth_leads_createdAt_idx" ON "growth_leads"("createdAt");
CREATE INDEX "growth_leads_status_createdAt_idx" ON "growth_leads"("status", "createdAt");
CREATE INDEX "growth_leads_email_idx" ON "growth_leads"("email");
CREATE INDEX "growth_referrals_createdAt_idx" ON "growth_referrals"("createdAt");
CREATE INDEX "growth_events_name_createdAt_idx" ON "growth_events"("name", "createdAt");
CREATE INDEX "growth_events_path_createdAt_idx" ON "growth_events"("path", "createdAt");
CREATE INDEX "growth_events_campaign_createdAt_idx" ON "growth_events"("campaign", "createdAt");
CREATE INDEX "growth_events_referralCode_createdAt_idx" ON "growth_events"("referralCode", "createdAt");
CREATE INDEX "growth_events_userId_createdAt_idx" ON "growth_events"("userId", "createdAt");

ALTER TABLE "growth_referrals"
  ADD CONSTRAINT "growth_referrals_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "growth_events"
  ADD CONSTRAINT "growth_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "growth_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "growth_referrals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "growth_events" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "growth_leads" FROM anon, authenticated;
REVOKE ALL ON TABLE "growth_referrals" FROM anon, authenticated;
REVOKE ALL ON TABLE "growth_events" FROM anon, authenticated;
