import { Module }             from "@nestjs/common"
import { AirlinesController } from "./airlines.controller"
import { AirlinesService }    from "./airlines.service"
import { AirlinesRepository } from "./airlines.repository"
import { ActivityModule }     from "../../activity/activity.module"

@Module({
  imports:     [ActivityModule],
  controllers: [AirlinesController],
  providers:   [AirlinesService, AirlinesRepository],
  exports:     [AirlinesService],
})
export class AirlinesModule {}
