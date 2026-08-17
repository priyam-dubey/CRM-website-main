import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(q: string, companyId: string) {
    if (!q || q.length < 2) return { data: { bookings: [], users: [], airlines: [] } }

    const search = q.toLowerCase()

    const [bookings, users, airlines] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          companyId, deletedAt: null,
          OR: [
            { reference:     { contains: search, mode: "insensitive" } },
            { pnr:           { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
            { passengers: { some: { OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName:  { contains: search, mode: "insensitive" } },
            ] } } },
          ],
        },
        select: {
          id: true, reference: true, status: true, pnr: true,
          passengers: { select: { firstName: true, lastName: true }, orderBy: { passengerNumber: "asc" }, take: 1 },
        },
        take: 5,
      }),
      this.prisma.user.findMany({
        where: {
          companyId, deletedAt: null,
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName:  { contains: search, mode: "insensitive" } },
            { email:     { contains: search, mode: "insensitive" } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
        take: 5,
      }),
      this.prisma.airline.findMany({
        where: {
          deletedAt: null,
          OR: [
            { companyId },
            { companyId: null },
          ],
          AND: [{
            OR: [
              { airlineName: { contains: search, mode: "insensitive" } },
              { iataCode:    { contains: search, mode: "insensitive" } },
            ],
          }],
        },
        select: { id: true, airlineName: true, iataCode: true },
        take: 5,
      }),
    ])

    return { data: { bookings, users, airlines } }
  }
}
