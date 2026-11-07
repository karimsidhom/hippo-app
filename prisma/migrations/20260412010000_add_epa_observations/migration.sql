-- EPA Observations & Attending Notifications

-- Enums
CREATE TYPE "EpaAchievementLevel" AS ENUM ('NOT_ACHIEVED', 'ACHIEVED');
CREATE TYPE "EpaObservationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'SIGNED', 'RETURNED');

-- EPA Observations
CREATE TABLE "epa_observations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseLogId" TEXT,
    "epaId" TEXT NOT NULL,
    "epaTitle" TEXT NOT NULL,
    "specialtySlug" TEXT NOT NULL,
    "trainingSystem" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "setting" TEXT,
    "complexity" TEXT,
    "assessorName" TEXT NOT NULL,
    "assessorRole" TEXT,
    "assessorEmail" TEXT,
    "achievement" "EpaAchievementLevel" NOT NULL DEFAULT 'NOT_ACHIEVED',
    "observationNotes" TEXT,
    "strengthsNotes" TEXT,
    "improvementNotes" TEXT,
    "criteriaRatings" JSONB,
    "status" "EpaObservationStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "signedByName" TEXT,
    "returnedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "epa_observations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "epa_observations_userId_idx" ON "epa_observations"("userId");
CREATE INDEX "epa_observations_userId_epaId_idx" ON "epa_observations"("userId", "epaId");
CREATE INDEX "epa_observations_userId_status_idx" ON "epa_observations"("userId", "status");
CREATE INDEX "epa_observations_caseLogId_idx" ON "epa_observations"("caseLogId");
ALTER TABLE "epa_observations" ADD CONSTRAINT "epa_observations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "epa_observations" ADD CONSTRAINT "epa_observations_caseLogId_fkey" FOREIGN KEY ("caseLogId") REFERENCES "case_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Attending Notifications
CREATE TABLE "attending_notifications" (
    "id" TEXT NOT NULL,
    "epaObservationId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "attending_notifications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "attending_notifications_accessToken_key" ON "attending_notifications"("accessToken");
CREATE INDEX "attending_notifications_accessToken_idx" ON "attending_notifications"("accessToken");
CREATE INDEX "attending_notifications_epaObservationId_idx" ON "attending_notifications"("epaObservationId");
ALTER TABLE "attending_notifications" ADD CONSTRAINT "attending_notifications_epaObservationId_fkey" FOREIGN KEY ("epaObservationId") REFERENCES "epa_observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
