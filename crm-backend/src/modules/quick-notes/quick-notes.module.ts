import { Module } from "@nestjs/common"
import { QuickNotesController } from "./quick-notes.controller"
import { QuickNotesService }    from "./quick-notes.service"
import { QuickNotesRepository } from "./quick-notes.repository"
import { ActivityModule }       from "../activity/activity.module"

@Module({
  imports:     [ActivityModule],
  controllers: [QuickNotesController],
  providers:   [QuickNotesService, QuickNotesRepository],
})
export class QuickNotesModule {}
