import { Controller, Get } from "@nestjs/common"
import { PrismaService }   from "../../database/prisma.service"
import { Public }          from "../../common/decorators/public.decorator"

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  async check() {
    const startedAt = Date.now()
    let database: "up" | "down" = "up"

    try {
      // Cheapest possible round-trip to confirm the DB connection is alive
      await this.prisma.company.count()
    } catch {
      database = "down"
    }

    return {
      status:    database === "up" ? "ok" : "degraded",
      database,
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    }
  }
}
