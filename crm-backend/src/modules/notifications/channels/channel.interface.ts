import type { Notification, User } from "../../../shared/types/prisma.types"

export interface INotificationChannel {
  send(notification: Notification, recipient: User): Promise<void>
}

export const NOTIFICATION_CHANNELS = "NOTIFICATION_CHANNELS"
