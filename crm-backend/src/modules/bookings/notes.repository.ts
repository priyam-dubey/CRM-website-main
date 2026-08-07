import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"

const NOTE_SELECT = {
  id:        true,
  bookingId: true,
  note:      true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
} as const

@Injectable()
export class NotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBooking(bookingId: string) {
    return this.prisma.bookingNote.findMany({
      where:   { bookingId, deletedAt: null },
      select:  NOTE_SELECT,
      orderBy: { createdAt: "asc" },
    })
  }

  async findById(id: string) {
    return this.prisma.bookingNote.findFirst({
      where:  { id, deletedAt: null },
      select: { ...NOTE_SELECT, userId: true },
    })
  }

  async create(bookingId: string, userId: string, note: string) {
    return this.prisma.bookingNote.create({
      data:   { bookingId, userId, note },
      select: NOTE_SELECT,
    })
  }

  async update(id: string, note: string) {
    return this.prisma.bookingNote.update({
      where:  { id },
      data:   { note },
      select: NOTE_SELECT,
    })
  }

  async softDelete(id: string) {
    await this.prisma.bookingNote.update({
      where: { id },
      data:  { deletedAt: new Date() },
    })
  }
}
