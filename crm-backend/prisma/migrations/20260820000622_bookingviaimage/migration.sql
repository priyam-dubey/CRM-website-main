-- DropForeignKey
ALTER TABLE "itinerary_segments" DROP CONSTRAINT "itinerary_segments_airlineId_fkey";

-- DropForeignKey
ALTER TABLE "itinerary_segments" DROP CONSTRAINT "itinerary_segments_classId_fkey";

-- AddForeignKey
ALTER TABLE "itinerary_segments" ADD CONSTRAINT "itinerary_segments_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "airlines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_segments" ADD CONSTRAINT "itinerary_segments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "booking_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
