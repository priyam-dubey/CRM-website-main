import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, Get, UnauthorizedException } from "@nestjs/common"
import type { Request, Response }  from "express"
import { AuthService }             from "./auth.service"
import { LoginDto }                from "./dto/login.dto"
import { ForgotPasswordDto }       from "./dto/forgot-password.dto"
import { ResetPasswordDto }        from "./dto/reset-password.dto"
import { Public }                  from "../../common/decorators/public.decorator"
import { extractClientIp }         from "../../shared/utils/cidr.util"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip        = extractClientIp(req as any)
    const userAgent = req.headers["user-agent"]
    const result    = await this.authService.login(dto, ip, userAgent)

    // Set HttpOnly cookie for refresh token
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      path:     "/api/v1/auth/refresh",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })

    return { data: { accessToken: result.accessToken, user: result.user } }
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing")
    }
    const ip     = extractClientIp(req as any)
    const ua     = req.headers["user-agent"]
    const result = await this.authService.refresh(refreshToken, ip, ua)

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      path:     "/api/v1/auth/refresh",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })

    return { data: { accessToken: result.accessToken } }
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken
    if (refreshToken) {
      const ip = extractClientIp(req as any)
      await this.authService.logout(refreshToken, ip)
    }
    res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" })
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email)
    return { data: { message: "If an account exists, a reset email has been sent." } }
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto)
    return { data: { message: "Password reset successfully." } }
  }
}
