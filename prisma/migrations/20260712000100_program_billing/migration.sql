CREATE TABLE "program_subscriptions" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "stripeCustomerId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT,
  "stripePriceId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'incomplete',
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "program_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stripe_webhook_events" (
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("eventId")
);

CREATE UNIQUE INDEX "program_subscriptions_programId_key" ON "program_subscriptions"("programId");
CREATE UNIQUE INDEX "program_subscriptions_stripeCustomerId_key" ON "program_subscriptions"("stripeCustomerId");
CREATE UNIQUE INDEX "program_subscriptions_stripeSubscriptionId_key" ON "program_subscriptions"("stripeSubscriptionId");
CREATE INDEX "program_subscriptions_status_idx" ON "program_subscriptions"("status");
ALTER TABLE "program_subscriptions" ADD CONSTRAINT "program_subscriptions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
