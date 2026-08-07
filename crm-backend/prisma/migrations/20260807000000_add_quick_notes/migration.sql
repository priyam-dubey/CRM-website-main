-- CreateTable
CREATE TABLE "quick_notes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "quick_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quick_notes_companyId_idx" ON "quick_notes"("companyId");
CREATE INDEX "quick_notes_userId_idx" ON "quick_notes"("userId");
CREATE INDEX "quick_notes_userId_createdAt_idx" ON "quick_notes"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
