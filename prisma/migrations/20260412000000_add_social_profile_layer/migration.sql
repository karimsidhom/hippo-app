-- Social Profile Layer: Follow, PortfolioCase, Pearl, PearlLike, PearlSave

-- Follow (asymmetric)
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Portfolio Cases
CREATE TABLE "portfolio_cases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseLogId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isMilestone" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "portfolio_cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "portfolio_cases_caseLogId_key" ON "portfolio_cases"("caseLogId");
CREATE INDEX "portfolio_cases_userId_displayOrder_idx" ON "portfolio_cases"("userId", "displayOrder");
ALTER TABLE "portfolio_cases" ADD CONSTRAINT "portfolio_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portfolio_cases" ADD CONSTRAINT "portfolio_cases_caseLogId_fkey" FOREIGN KEY ("caseLogId") REFERENCES "case_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pearls
CREATE TABLE "pearls" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "saveCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pearls_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pearls_authorId_idx" ON "pearls"("authorId");
CREATE INDEX "pearls_createdAt_idx" ON "pearls"("createdAt" DESC);
CREATE INDEX "pearls_procedureName_idx" ON "pearls"("procedureName");
ALTER TABLE "pearls" ADD CONSTRAINT "pearls_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pearl Likes
CREATE TABLE "pearl_likes" (
    "id" TEXT NOT NULL,
    "pearlId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pearl_likes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pearl_likes_pearlId_userId_key" ON "pearl_likes"("pearlId", "userId");
CREATE INDEX "pearl_likes_userId_idx" ON "pearl_likes"("userId");
ALTER TABLE "pearl_likes" ADD CONSTRAINT "pearl_likes_pearlId_fkey" FOREIGN KEY ("pearlId") REFERENCES "pearls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pearl_likes" ADD CONSTRAINT "pearl_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pearl Saves
CREATE TABLE "pearl_saves" (
    "id" TEXT NOT NULL,
    "pearlId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pearl_saves_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pearl_saves_pearlId_userId_key" ON "pearl_saves"("pearlId", "userId");
CREATE INDEX "pearl_saves_userId_idx" ON "pearl_saves"("userId");
ALTER TABLE "pearl_saves" ADD CONSTRAINT "pearl_saves_pearlId_fkey" FOREIGN KEY ("pearlId") REFERENCES "pearls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pearl_saves" ADD CONSTRAINT "pearl_saves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
