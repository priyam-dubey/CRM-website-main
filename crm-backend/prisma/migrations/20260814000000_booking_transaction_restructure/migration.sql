-- CreateEnum
CREATE TYPE "PassengerType" AS ENUM ('ADULT', 'CHILD', 'INFANT_ON_SEAT', 'INFANT_ON_LAP');
CREATE TYPE "ItineraryDirection" AS ENUM ('OUTBOUND', 'RETURN');

-- CreateTable: new child tables first, so backfill INSERTs below have somewhere to go
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "chargeNumber" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currencyId" TEXT NOT NULL,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "itinerary_segments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "direction" "ItineraryDirection" NOT NULL DEFAULT 'OUTBOUND',
    "segmentNumber" INTEGER NOT NULL,
    "airlineId" TEXT NOT NULL,
    "flightNumber" VARCHAR(20) NOT NULL,
    "fromText" VARCHAR(100) NOT NULL,
    "toText" VARCHAR(100) NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "classId" TEXT NOT NULL,
    "pnrConfirmation" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "itinerary_segments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "passengers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "passengerNumber" INTEGER NOT NULL,
    "type" "PassengerType" NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "middleName" VARCHAR(100),
    "lastName" VARCHAR(100) NOT NULL,
    "dob" TIMESTAMP(3),
    "ticketNumber" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_details" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cardHolderName" VARCHAR(200) NOT NULL,
    "cardProcessorId" TEXT NOT NULL,
    "cardLast4" VARCHAR(4) NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "billingEmail" VARCHAR(320) NOT NULL,
    "billingContactNo" VARCHAR(30) NOT NULL,
    "billingStreet" VARCHAR(300),
    "billingCity" VARCHAR(100),
    "billingState" VARCHAR(100),
    "billingZip" VARCHAR(20),
    "billingCountry" VARCHAR(100),
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "billing_details_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fileUrl" VARCHAR(1000) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add new Booking columns as nullable first so we can backfill,
-- then tighten to NOT NULL afterwards. pnr becomes optional (master
-- confirmation number is no longer always required at the booking level —
-- see ItinerarySegment.pnrConfirmation for the per-leg equivalent).
ALTER TABLE "bookings"
  ADD COLUMN "bidNumber" SERIAL,
  ADD COLUMN "customerEmail" VARCHAR(320),
  ALTER COLUMN "pnr" DROP NOT NULL;

-- Backfill customerEmail from the old passengerEmail column (fallback for any
-- booking that never had one — should not happen given create-booking.dto's
-- existing validation, but avoids a NOT NULL failure on legacy/test rows).
UPDATE "bookings" SET "customerEmail" = COALESCE("passengerEmail", 'unknown@placeholder.local');
ALTER TABLE "bookings" ALTER COLUMN "customerEmail" SET NOT NULL;

-- Backfill: one Charge per existing booking, from its old grossAmount/currencyId.
INSERT INTO "charges" ("id", "bookingId", "chargeNumber", "amount", "currencyId", "description", "createdAt")
SELECT gen_random_uuid()::text, "id", 1, "grossAmount", "currencyId", 'Migrated from legacy booking total', "createdAt"
FROM "bookings";

-- Backfill: one ItinerarySegment per existing booking, from its old
-- airlineId/classId/travelDate/returnDate/pnr.
INSERT INTO "itinerary_segments" ("id", "bookingId", "direction", "segmentNumber", "airlineId", "flightNumber", "fromText", "toText", "departureAt", "arrivalAt", "classId", "pnrConfirmation", "createdAt")
SELECT gen_random_uuid()::text, "id", 'OUTBOUND', 1, "airlineId", 'N/A', 'N/A', 'N/A', "travelDate", COALESCE("returnDate", "travelDate"), "classId", "pnr", "createdAt"
FROM "bookings";

-- Backfill: one Passenger per existing booking, from its old passengerName
-- (split on first space as a best-effort first/last name; not exact, but
-- preserves the data rather than discarding it). Single-word names (no
-- space) get a "-" placeholder lastName rather than duplicating the name
-- into both fields.
INSERT INTO "passengers" ("id", "bookingId", "passengerNumber", "type", "firstName", "lastName", "createdAt")
SELECT
  gen_random_uuid()::text, "id", 1, 'ADULT',
  CASE WHEN position(' ' in "passengerName") > 0
       THEN split_part("passengerName", ' ', 1)
       ELSE "passengerName" END,
  CASE WHEN position(' ' in "passengerName") > 0
       THEN substring("passengerName" from position(' ' in "passengerName") + 1)
       ELSE '-' END,
  "createdAt"
FROM "bookings";

-- Now drop the old single-flight/single-passenger columns and their FKs —
-- fully superseded by the child tables above, data already preserved there.
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_airlineId_fkey";
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_classId_fkey";
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_cardProcessorId_fkey";
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_currencyId_fkey";
DROP INDEX "bookings_companyId_travelDate_idx";
DROP INDEX "bookings_companyId_airlineId_idx";

ALTER TABLE "bookings"
  DROP COLUMN "passengerName",
  DROP COLUMN "passengerEmail",
  DROP COLUMN "passengerPhone",
  DROP COLUMN "airlineId",
  DROP COLUMN "classId",
  DROP COLUMN "cardProcessorId",
  DROP COLUMN "currencyId",
  DROP COLUMN "grossAmount",
  DROP COLUMN "netAmount",
  DROP COLUMN "travelDate",
  DROP COLUMN "returnDate",
  DROP COLUMN "notes";

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bidNumber_key" ON "bookings"("bidNumber");
CREATE UNIQUE INDEX "charges_bookingId_chargeNumber_key" ON "charges"("bookingId", "chargeNumber");
CREATE INDEX "charges_bookingId_idx" ON "charges"("bookingId");
CREATE INDEX "itinerary_segments_bookingId_idx" ON "itinerary_segments"("bookingId");
CREATE INDEX "passengers_bookingId_idx" ON "passengers"("bookingId");
CREATE UNIQUE INDEX "billing_details_bookingId_key" ON "billing_details"("bookingId");
CREATE INDEX "attachments_bookingId_idx" ON "attachments"("bookingId");

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "charges" ADD CONSTRAINT "charges_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "itinerary_segments" ADD CONSTRAINT "itinerary_segments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "itinerary_segments" ADD CONSTRAINT "itinerary_segments_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "airlines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "itinerary_segments" ADD CONSTRAINT "itinerary_segments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "booking_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "passengers" ADD CONSTRAINT "passengers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "billing_details" ADD CONSTRAINT "billing_details_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "billing_details" ADD CONSTRAINT "billing_details_cardProcessorId_fkey" FOREIGN KEY ("cardProcessorId") REFERENCES "card_processors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attachments" ADD CONSTRAINT "attachments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
