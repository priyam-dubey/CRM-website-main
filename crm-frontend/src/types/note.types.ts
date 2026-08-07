export interface BookingNote {
  id:        string
  bookingId: string
  userId:    string
  note:      string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  user?: {
    id:        string
    firstName: string
    lastName:  string
    role:      string
  }
}
