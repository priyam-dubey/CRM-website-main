import { Module }            from "@nestjs/common"
import { ManageController }  from "./manage.controller"
import { ManageService }     from "./manage.service"
import { AirlinesModule }    from "./airlines/airlines.module"

@Module({
  imports:     [AirlinesModule],
  controllers: [ManageController],
  providers:   [ManageService],
  exports:     [ManageService, AirlinesModule],
})
export class ManageModule {}
