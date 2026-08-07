import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException, Logger,
} from "@nestjs/common"
import { JwtService }     from "@nestjs/jwt"
import { ConfigService }  from "@nestjs/config"
import { PrismaService }  from "../../database/prisma.service"
import { hashPassword, comparePassword, hashToken, compareToken } from "../../shared/utils/hash.util"
import { generateOpaqueToken } from "../../shared/utils/token.util"
import { ROLE_PERMISSIONS }    from "../../shared/constants/permissions.constants"
import type { LoginDto }          from "./dto/login.dto"
import type { ResetPasswordDto }  from "./dto/reset-password.dto"

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma:  PrismaService,
    private readonly jwt:     JwtService,
    private readonly config:  ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true, deletedAt: null },
    })

    if (!user) {
      // Constant-time failure — don't reveal whether email exists
      await comparePassword("dummy", "$2b$12$dummyhashfortimingattack")
      throw new UnauthorizedException("Invalid email or password")
    }

    const passwordMatch = await comparePassword(dto.password, user.passwordHash)
    if (!passwordMatch) {
      await this.writeSecurityLog(user.companyId, user.id, "FAILED_LOGIN", ipAddress, userAgent)
      throw new UnauthorizedException("Invalid email or password")
    }

    const accessToken   = this.generateAccessToken(user)
    const refreshToken  = generateOpaqueToken()
    const tokenHash     = await hashToken(refreshToken)
    const refreshExpiry = this.config.get<string>("jwt.refreshTokenExpiry") ?? "7d"
    const expiresAt     = new Date(Date.now() + this.parseDuration(refreshExpiry))

    await this.prisma.session.create({
      data: { userId: user.id, companyId: user.companyId, refreshTokenHash: tokenHash, ipAddress, userAgent, expiresAt },
    })

    await this.prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    })

    await this.writeSecurityLog(user.companyId, user.id, "LOGIN", ipAddress, userAgent)

    const { passwordHash: _ph, ...userPublic } = user

    return {
      accessToken,
      refreshToken,
      user: { ...userPublic, permissions: ROLE_PERMISSIONS[user.role] },
    }
  }

  async refresh(refreshToken: string, ipAddress: string, userAgent?: string) {
    // Find all non-revoked sessions and compare hashes
    const sessions = await this.prisma.session.findMany({
      where:   { revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    })

    let matchedSession: (typeof sessions)[0] | undefined
    for (const session of sessions) {
      const match = await compareToken(refreshToken, session.refreshTokenHash)
      if (match) { matchedSession = session; break }
    }

    if (!matchedSession) {
      throw new UnauthorizedException("Invalid or expired refresh token")
    }

    const { user } = matchedSession
    if (!user.isActive) throw new UnauthorizedException("Account is deactivated")

    const newAccessToken  = this.generateAccessToken(user)
    const newRefreshToken = generateOpaqueToken()
    const newHash         = await hashToken(newRefreshToken)
    const refreshExpiry   = this.config.get<string>("jwt.refreshTokenExpiry") ?? "7d"
    const expiresAt       = new Date(Date.now() + this.parseDuration(refreshExpiry))

    await this.prisma.session.update({
      where: { id: matchedSession.id },
      data:  { refreshTokenHash: newHash, expiresAt, ipAddress, userAgent },
    })

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }

  async logout(refreshToken: string, ipAddress: string) {
    const sessions = await this.prisma.session.findMany({
      where: { revokedAt: null },
    })

    for (const session of sessions) {
      const match = await compareToken(refreshToken, session.refreshTokenHash)
      if (match) {
        await this.prisma.session.update({
          where: { id: session.id },
          data:  { revokedAt: new Date() },
        })
        await this.writeSecurityLog(session.companyId, session.userId, "LOGOUT", ipAddress)
        return
      }
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true, deletedAt: null },
    })
    if (!user) return  // Always succeed to prevent email enumeration
    // In production: generate reset token, store hash, send email
    this.logger.log(`Password reset requested for ${email}`)
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    // In production: validate token, find user, update password
    throw new BadRequestException("Password reset not implemented in demo mode")
  }

  private generateAccessToken(user: { id: string; companyId: string; role: string }): string {
    const permissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] ?? {}
    return this.jwt.sign({
      sub:         user.id,
      companyId:   user.companyId,
      role:        user.role,
      permissions,
    })
  }

  private async writeSecurityLog(
    companyId: string,
    userId:    string | null,
    event:     "LOGIN" | "LOGOUT" | "FAILED_LOGIN",
    ipAddress: string,
    userAgent?: string,
  ) {
    await this.prisma.securityLog.create({
      data: { companyId, userId, event, ipAddress, userAgent },
    })
  }

  private parseDuration(duration: string): number {
    const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
    const match = duration.match(/^(\d+)([smhd])$/)
    if (!match) return 7 * 86_400_000
    return parseInt(match[1], 10) * (units[match[2]] ?? 86_400_000)
  }
}
