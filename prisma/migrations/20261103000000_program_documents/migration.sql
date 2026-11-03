SET search_path TO public;

-- CreateTable
CREATE TABLE "program_documents" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_documents_storagePath_key" ON "program_documents"("storagePath");

-- CreateIndex
CREATE INDEX "program_documents_programId_createdAt_idx" ON "program_documents"("programId", "createdAt");

-- AddForeignKey
ALTER TABLE "program_documents" ADD CONSTRAINT "program_documents_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_documents" ADD CONSTRAINT "program_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Server-only: authorization is enforced by the authenticated API routes.
ALTER TABLE "program_documents" ENABLE ROW LEVEL SECURITY;
