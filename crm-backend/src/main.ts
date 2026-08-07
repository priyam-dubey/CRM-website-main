import { NestFactory }    from "@nestjs/core"
import { ConfigService }  from "@nestjs/config"
import cookieParser       from "cookie-parser"
import helmet             from "helmet"
import { AppModule }      from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log","warn","error","debug"],
  })

  const config = app.get(ConfigService)
  const port   = config.get<number>("app.port") ?? 4000
  const prefix = config.get<string>("app.apiPrefix") ?? "api/v1"
  const origins = config.get<string[]>("app.corsOrigins") ?? ["http://localhost:3000"]

  app.setGlobalPrefix(prefix)

  app.use(cookieParser())
  app.use(helmet({
    crossOriginEmbedderPolicy: false,  // allow frontend assets
  }))

  app.enableCors({
    origin:      origins,
    credentials: true,
    methods:     ["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","X-Request-ID"],
  })

  await app.listen(port)
  console.log(`CRM Backend running on http://localhost:${port}/${prefix}`)
}

bootstrap().catch((err) => {
  console.error("Fatal error during bootstrap:", err)
  process.exit(1)
})
