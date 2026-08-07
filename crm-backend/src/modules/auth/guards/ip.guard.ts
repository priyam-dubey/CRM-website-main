import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from "@nestjs/common"
import { PrismaService }   from "../../../database/prisma.service"
import { extractClientIp, ipMatchesCidr } from "../../../shared/utils/cidr.util"

@Injectable()
export class IpGuard implements CanActivate {
  private readonly logger = new Logger(IpGuard.name)

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request   = context.switchToHttp().getRequest()
    const companyId = request.user?.companyId
    if (!companyId) return true  // unauthenticated — let JwtAuthGuard handle

    const clientIp = extractClientIp(request)

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { ipRestrictionEnabled: true },
    })
    if (!company?.ipRestrictionEnabled) return true  // IP restriction turned off company-wide

    const rules    = await this.prisma.iPRule.findMany({
      where: { companyId, deletedAt: null },
      select: { type: true, cidr: true },
    })

    if (rules.length === 0) return true  // no rules = open

    const denyRules  = rules.filter((r) => r.type === "DENY")
    const allowRules = rules.filter((r) => r.type === "ALLOW")

    // DENY rules take highest priority
    for (const rule of denyRules) {
      if (ipMatchesCidr(clientIp, rule.cidr)) {
        this.logger.warn(`IP ${clientIp} blocked by DENY rule ${rule.cidr} for company ${companyId}`)
        throw new ForbiddenException("Access denied from this IP address")
      }
    }

    // If ALLOW rules exist, IP must match at least one
    if (allowRules.length > 0) {
      const allowed = allowRules.some((rule) => ipMatchesCidr(clientIp, rule.cidr))
      if (!allowed) {
        this.logger.warn(`IP ${clientIp} not in ALLOW list for company ${companyId}`)
        throw new ForbiddenException("Access denied from this IP address")
      }
    }

    return true
  }
}
