import { Controller, Get, Query } from "@nestjs/common"
import { SearchService } from "./search.service"
import { CurrentUser }   from "../../common/decorators/current-user.decorator"
import { IsString, MinLength } from "class-validator"
import type { JwtPayload } from "../../shared/types/request.types"

class SearchQueryDto {
  @IsString() @MinLength(2) q: string
}

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("global")
  search(@Query() dto: SearchQueryDto, @CurrentUser() user: JwtPayload) {
    return this.searchService.globalSearch(dto.q, user.companyId)
  }
}
