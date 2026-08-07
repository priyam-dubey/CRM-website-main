import { Injectable, Logger } from "@nestjs/common"
import type { INotificationChannel } from "./channel.interface"
import type { Notification, User }   from "../../../shared/types/prisma.types"

@Injectable()
export class InAppChannel implements INotificationChannel {
  private readonly logger = new Logger(InAppChannel.name)

  async send(notification: Notification, recipient: User): Promise<void> {
    // In-app notifications are already in the DB — no additional delivery needed
    // Future: push SSE/WebSocket event to connected client
    this.logger.debug(`In-app notification ${notification.id} for user ${recipient.id}`)
  }
}
