import { Module }                    from "@nestjs/common"
import { NotificationsController }   from "./notifications.controller"
import { NotificationsService }      from "./notifications.service"
import { InAppChannel }              from "./channels/in-app.channel"

@Module({
  controllers: [NotificationsController],
  providers:   [NotificationsService, InAppChannel],
  exports:     [NotificationsService],
})
export class NotificationsModule {}
