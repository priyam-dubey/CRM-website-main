import { Module }             from "@nestjs/common"
import { BookingsController } from "./bookings.controller"
import { BookingsService }    from "./bookings.service"
import { BookingsRepository } from "./bookings.repository"
import { NotesController }    from "./notes.controller"
import { NotesService }       from "./notes.service"
import { NotesRepository }    from "./notes.repository"
import { BookingVerificationController } from "./booking-verification.controller"
import { BookingVerificationService }    from "./booking-verification.service"
import { BookingVerificationRepository } from "./booking-verification.repository"
import { ActivityModule }     from "../activity/activity.module"
import { EmailModule }        from "../email/email.module"

@Module({
  imports:     [ActivityModule, EmailModule],
  controllers: [BookingsController, NotesController, BookingVerificationController],
  providers:   [
    BookingsService, BookingsRepository,
    NotesService, NotesRepository,
    BookingVerificationService, BookingVerificationRepository,
  ],
  exports:     [BookingsService],
})
export class BookingsModule {}
