CREATE TABLE "institutional_procurements" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "institutionLegalName" TEXT NOT NULL,
  "institutionType" TEXT NOT NULL,
  "jurisdiction" TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'Canada',
  "signatoryName" TEXT NOT NULL,
  "signatoryTitle" TEXT NOT NULL,
  "signatoryEmail" TEXT NOT NULL,
  "billingContactName" TEXT NOT NULL,
  "billingContactEmail" TEXT NOT NULL,
  "residentSeats" INTEGER NOT NULL DEFAULT 20,
  "facultySeats" INTEGER NOT NULL DEFAULT 10,
  "pilotStartDate" TIMESTAMP(3),
  "pilotEndDate" TIMESTAMP(3),
  "purchaseOrderRequired" BOOLEAN NOT NULL DEFAULT false,
  "purchaseOrderNumber" TEXT,
  "securityReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  "dataProcessingRequired" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "agreementVersion" TEXT,
  "agreementToken" TEXT,
  "agreementTokenExpiresAt" TIMESTAMP(3),
  "agreementAcceptedAt" TIMESTAMP(3),
  "agreementAcceptedById" TEXT,
  "authorityConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "acceptanceIpAddress" TEXT,
  "acceptanceUserAgent" TEXT,
  "submittedAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "institutional_procurements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "institutional_procurements_programId_key" ON "institutional_procurements"("programId");
CREATE UNIQUE INDEX "institutional_procurements_agreementToken_key" ON "institutional_procurements"("agreementToken");
CREATE INDEX "institutional_procurements_requestedById_idx" ON "institutional_procurements"("requestedById");
CREATE INDEX "institutional_procurements_status_submittedAt_idx" ON "institutional_procurements"("status", "submittedAt");
ALTER TABLE "institutional_procurements" ADD CONSTRAINT "institutional_procurements_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "institutional_procurements" ADD CONSTRAINT "institutional_procurements_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "institutional_procurements" ADD CONSTRAINT "institutional_procurements_agreementAcceptedById_fkey" FOREIGN KEY ("agreementAcceptedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "institutional_procurements" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "institutional_procurements" FROM anon, authenticated;
