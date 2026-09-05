-- Autonomy slope: anchor training time to the first day of residency.
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "residencyStartDate" TIMESTAMP(3);
