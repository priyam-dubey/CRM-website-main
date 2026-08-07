import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common"
import { SecurityService }    from "./security.service"
import { CreateIpRuleDto }    from "./ip-rules/dto/create-ip-rule.dto"
import { UpdateIpRuleDto }    from "./ip-rules/dto/update-ip-rule.dto"
import { IdParamDto }         from "../../common/dto/id-param.dto"
import { PaginationDto }      from "../../common/dto/pagination.dto"
import { CurrentUser }        from "../../common/decorators/current-user.decorator"
import { RequirePermission }  from "../../common/decorators/require-permission.decorator"
import type { JwtPayload }    from "../../shared/types/request.types"
import { IsOptional, IsUUID, IsString } from "class-validator"

class SecurityLogFiltersDto extends PaginationDto {
  @IsOptional() @IsString() event?: string
  @IsOptional() @IsUUID() userId?: string
  @IsOptional() @IsString() date_from?: string
  @IsOptional() @IsString() date_to?: string
}

class SessionFiltersDto extends PaginationDto {
  @IsOptional() @IsUUID() userId?: string
}

class RevokeAllDto {
  @IsUUID() userId: string
}

class ToggleIpRestrictionDto {
  @IsOptional() enabled?: boolean
}

@Controller("security")
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // IP restriction summary (Security Status panel: allowed/blocked counts,
  // last updated, enabled/disabled) — matches the client's IP Settings page.
  @Get("ip-settings-summary")
  @RequirePermission("security", "view")
  ipSettingsSummary(@CurrentUser() user: JwtPayload) {
    return this.securityService.getIpSettingsSummary(user.companyId)
  }

  @Patch("ip-restriction")
  @RequirePermission("security", "manage")
  toggleIpRestriction(@Body() dto: ToggleIpRestrictionDto, @CurrentUser() user: JwtPayload) {
    return this.securityService.setIpRestrictionEnabled(user.companyId, !!dto.enabled)
  }

  // IP Rules
  @Get("ip-rules")
  @RequirePermission("security", "view")
  findAllRules(@CurrentUser() user: JwtPayload, @Query() dto: PaginationDto) {
    return this.securityService.findAllIpRules(user.companyId, dto)
  }

  @Post("ip-rules")
  @RequirePermission("security", "manage")
  createRule(@CurrentUser() user: JwtPayload, @Body() dto: CreateIpRuleDto) {
    return this.securityService.createIpRule(user.companyId, dto, user.sub)
  }

  @Patch("ip-rules/:id")
  @RequirePermission("security", "manage")
  updateRule(@Param() params: IdParamDto, @Body() dto: UpdateIpRuleDto, @CurrentUser() user: JwtPayload) {
    return this.securityService.updateIpRule(params.id, user.companyId, dto)
  }

  @Delete("ip-rules/:id")
  @RequirePermission("security", "manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRule(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.securityService.deleteIpRule(params.id, user.companyId)
  }

  // Security Logs
  @Get("logs")
  @RequirePermission("security", "view")
  findLogs(@CurrentUser() user: JwtPayload, @Query() dto: SecurityLogFiltersDto) {
    return this.securityService.findAllSecurityLogs(user.companyId, dto as any)
  }

  // Sessions
  @Get("sessions")
  @RequirePermission("security", "manage")
  findSessions(@CurrentUser() user: JwtPayload, @Query() dto: SessionFiltersDto) {
    return this.securityService.findAllSessions(user.companyId, dto)
  }

  @Delete("sessions/:id")
  @RequirePermission("security", "manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.securityService.revokeSession(params.id, user.companyId)
  }

  @Post("sessions/revoke-all")
  @RequirePermission("security", "manage")
  revokeAll(@Body() dto: RevokeAllDto, @CurrentUser() user: JwtPayload) {
    return this.securityService.revokeAllSessions(dto.userId, user.companyId)
  }
}
