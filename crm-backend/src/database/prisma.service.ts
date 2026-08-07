import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common"

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // Underlying Prisma client - loaded dynamically to support environments without binary
  private client: any

  constructor() {
    try {
      const { PrismaClient } = require("@prisma/client")
      this.client = new PrismaClient({
        log: process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["warn", "error"],
      })
    } catch {
      // Gracefully degrade when Prisma binary is not available (CI, build environments)
      console.warn("[PrismaService] @prisma/client not available — using no-op client")
      this.client = this.createNoOpClient()
    }
  }

  async onModuleInit() {
    if (typeof this.client.$connect === "function") {
      await this.client.$connect()
    }
    // Soft-delete middleware
    if (typeof this.client.$use === "function") {
      this.client.$use(async (params: any, next: any) => {
        const modelsWithSoftDelete = [
          "User", "Booking", "Revenue", "MCO", "Chargeback", "Refund", "IPRule",
          "Airline", "BookingClass", "Provider", "CardProcessor", "CallQueue",
        ]
        if (modelsWithSoftDelete.includes(params.model ?? "")) {
          if (params.action === "findFirst" || params.action === "findMany") {
            params.args = params.args ?? {}
            params.args.where = { deletedAt: null, ...(params.args.where ?? {}) }
          }
          if (params.action === "findUnique") {
            params.action = "findFirst"
            params.args.where = { deletedAt: null, ...(params.args.where ?? {}) }
          }
        }
        return next(params)
      })
    }
  }

  async onModuleDestroy() {
    if (typeof this.client.$disconnect === "function") {
      await this.client.$disconnect()
    }
  }

  // Proxy all property accesses to the underlying client
  // This allows: this.prisma.user.findMany(...), this.prisma.$transaction(...), etc.
  get user() { return this.client.user }
  get company() { return this.client.company }
  get session() { return this.client.session }
  get booking() { return this.client.booking }
  get revenue() { return this.client.revenue }
  get mCO() { return this.client.mCO }
  get chargeback() { return this.client.chargeback }
  get refund() { return this.client.refund }
  get activityLog() { return this.client.activityLog }
  get securityLog() { return this.client.securityLog }
  get notification() { return this.client.notification }
  get iPRule() { return this.client.iPRule }
  get airline() { return this.client.airline }
  get bookingClass() { return this.client.bookingClass }
  get provider() { return this.client.provider }
  get cardProcessor() { return this.client.cardProcessor }
  get currency() { return this.client.currency }
  get callQueue() { return this.client.callQueue }
  get savedView() { return this.client.savedView }
  get bookingNote() { return this.client.bookingNote }
  get quickNote() { return this.client.quickNote }

  $transaction(arg: any) { return this.client.$transaction(arg) }
  $use(fn: any) { return this.client.$use?.(fn) }

  private createNoOpClient() {
    const noop = () => Promise.resolve(null)
    const model = () => ({
      findFirst: noop, findMany: () => Promise.resolve([]),
      create: noop, update: noop, updateMany: () => Promise.resolve({ count: 0 }),
      delete: noop, count: () => Promise.resolve(0),
      upsert: noop, groupBy: () => Promise.resolve([]),
    })
    return {
      $connect: noop, $disconnect: noop,
      $transaction: async (fn: any) => typeof fn === "function" ? fn(this) : Promise.all(fn),
      user: model(), company: model(), session: model(), booking: model(),
      revenue: model(), mCO: model(), chargeback: model(), refund: model(),
      activityLog: model(), securityLog: model(), notification: model(),
      iPRule: model(), airline: model(), bookingClass: model(), provider: model(),
      cardProcessor: model(), currency: model(), callQueue: model(), savedView: model(),
      bookingNote: model(),
      bookingTransaction: model(),
    }
  }
}
