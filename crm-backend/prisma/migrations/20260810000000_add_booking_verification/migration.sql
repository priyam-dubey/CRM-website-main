-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED');

-- CreateTable
CREATE TABLE "booking_verifications" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "tokenHash" VARCHAR(100) NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "clientEmail" VARCHAR(320) NOT NULL,
    "bookingSnapshot" JSONB NOT NULL,
    "signatureDataUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verifiedIp" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_verifications_tokenHash_key" ON "booking_verifications"("tokenHash");
CREATE INDEX "booking_verifications_bookingId_idx" ON "booking_verifications"("bookingId");
CREATE INDEX "booking_verifications_companyId_idx" ON "booking_verifications"("companyId");
CREATE INDEX "booking_verifications_status_idx" ON "booking_verifications"("status");

-- AddForeignKey
ALTER TABLE "booking_verifications" ADD CONSTRAINT "booking_verifications_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_verifications" ADD CONSTRAINT "booking_verifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_verifications" ADD CONSTRAINT "booking_verifications_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
