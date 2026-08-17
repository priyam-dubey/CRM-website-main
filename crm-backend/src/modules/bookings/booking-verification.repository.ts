import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"

@Injectable()
export class BookingVerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestForBooking(bookingId: string) {
    return this.prisma.bookingVerification.findFirst({
      where:   { bookingId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, clientEmail: true,
        verifiedAt: true, expiresAt: true, createdAt: true,
      },
    })
  }

  async create(data: {
    bookingId: string; companyId: string; requestedById: string
    tokenHash: string; clientEmail: string; bookingSnapshot: Record<string, unknown>
    expiresAt: Date
  }) {
    return this.prisma.bookingVerification.create({ data })
  }

  /** Used to roll back a just-created record if the email send fails. */
  async deleteById(id: string) {
    await this.prisma.bookingVerification.delete({ where: { id } })
  }

  /**
   * Candidate set for token lookup. Mirrors the exact
   * find-candidates-then-compareToken pattern AuthService.refresh() uses for
   * session.refreshTokenHash — bcrypt hashes can't be looked up directly, so
   * every not-yet-expired-or-consumed record is a candidate, compared in
   * memory. Deliberately includes PENDING (valid or lazily-expired) and
   * VERIFIED so the service layer can distinguish "invalid token" from
   * "expired" from "already verified" and return the right message for each.
   */
  async findTokenLookupCandidates() {
    return this.prisma.bookingVerification.findMany({
      where: { status: { in: ["PENDING", "VERIFIED"] } },
    })
  }

  async findById(id: string) {
    return this.prisma.bookingVerification.findUnique({ where: { id } })
  }

  async markExpired(id: string) {
    await this.prisma.bookingVerification.updateMany({
      where: { id, status: "PENDING" },
      data:  { status: "EXPIRED" },
    })
  }

  /** Optimistic guard: only succeeds if still PENDING — prevents double-submit races. */
  async markVerified(id: string, verifiedIp: string) {
    const result = await this.prisma.bookingVerification.updateMany({
      where: { id, status: "PENDING" },
      data:  { status: "VERIFIED", verifiedIp, verifiedAt: new Date() },
    })
    return result.count === 1
  }
}
