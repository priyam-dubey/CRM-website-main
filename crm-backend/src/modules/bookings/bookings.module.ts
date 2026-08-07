import { Module }             from "@nestjs/common"
import { BookingsController } from "./bookings.controller"
import { BookingsService }    from "./bookings.service"
import { BookingsRepository } from "./bookings.repository"
import { NotesController }    from "./notes.controller"
import { NotesService }       from "./notes.service"
import { NotesRepository }    from "./notes.repository"
import { ActivityModule }     from "../activity/activity.module"

@Module({
  imports:     [ActivityModule],
  controllers: [BookingsController, NotesController],
  providers:   [BookingsService, BookingsRepository, NotesService, NotesRepository],
  exports:     [BookingsService],
})
export class BookingsModule {}
