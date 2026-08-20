-- Additive migration: adds support for the "Image Data" itinerary mode
-- (client's original CRM: Itinerary Details -> Image Data toggle) alongside
-- the existing structured "Text Data" flight fields.
--
-- Nothing here drops or renames a column, and no existing data is touched:
-- - itineraryType defaults to 'TEXT' for all existing rows, preserving the
--   current (only) behaviour exactly.
-- - imageUrls defaults to '{}' for all existing rows.
-- - The structured flight columns become nullable so an Image Data row can
--   omit them; every row created by the existing Text Data flow already has
--   values for all of them, so this is safe and lossless.

-- CreateEnum
CREATE TYPE "ItineraryDataType" AS ENUM ('TEXT', 'IMAGE');

-- AlterTable
ALTER TABLE "itinerary_segments"
  ADD COLUMN "itineraryType" "ItineraryDataType" NOT NULL DEFAULT 'TEXT',
  ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT '{}',
  ALTER COLUMN "airlineId" DROP NOT NULL,
  ALTER COLUMN "flightNumber" DROP NOT NULL,
  ALTER COLUMN "fromText" DROP NOT NULL,
  ALTER COLUMN "toText" DROP NOT NULL,
  ALTER COLUMN "departureAt" DROP NOT NULL,
  ALTER COLUMN "arrivalAt" DROP NOT NULL,
  ALTER COLUMN "classId" DROP NOT NULL;
