-- Additive only. Subscription state lives on profiles; friend case sharing is a per-user opt-in.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "shareCasesWithFriends" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "profiles_stripeCustomerId_idx" ON "profiles"("stripeCustomerId");
