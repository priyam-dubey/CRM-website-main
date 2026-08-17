import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common"
import { ConfigModule }     from "@nestjs/config"
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core"
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler"
import { EventEmitterModule } from "@nestjs/event-emitter"

import { appConfig, databaseConfig, jwtConfig, throttleConfig, emailConfig } from "./config"

import { PrismaModule }         from "./database/prisma.module"
import { EventsModule }         from "./events/events.module"

import { AuthModule }           from "./modules/auth/auth.module"
import { UsersModule }          from "./modules/users/users.module"
import { BookingsModule }       from "./modules/bookings/bookings.module"
import { QuickNotesModule }     from "./modules/quick-notes/quick-notes.module"
import { RevenueModule }        from "./modules/revenue/revenue.module"
import { SecurityModule }       from "./modules/security/security.module"
import { ActivityModule }       from "./modules/activity/activity.module"
import { NotificationsModule }  from "./modules/notifications/notifications.module"
import { SearchModule }         from "./modules/search/search.module"
import { ManageModule }         from "./modules/manage/manage.module"
import { HealthModule }         from "./modules/health/health.module"

import { JwtAuthGuard }         from "./modules/auth/guards/jwt-auth.guard"
import { PermissionsGuard }     from "./modules/auth/guards/permissions.guard"
import { IpGuard }              from "./modules/auth/guards/ip.guard"

import { GlobalExceptionFilter } from "./common/filters/http-exception.filter"
import { ResponseInterceptor }   from "./common/interceptors/response.interceptor"
import { TimeoutInterceptor }    from "./common/interceptors/timeout.interceptor"
import { GlobalValidationPipe }  from "./common/pipes/validation.pipe"
import { LoggerMiddleware }      from "./common/middleware/logger.middleware"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load:     [appConfig, databaseConfig, jwtConfig, throttleConfig, emailConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    EventEmitterModule.forRoot({ wildcard: true }),
    PrismaModule,
    EventsModule,
    AuthModule,
    UsersModule,
    BookingsModule,
    QuickNotesModule,
    RevenueModule,
    SecurityModule,
    ActivityModule,
    NotificationsModule,
    SearchModule,
    ManageModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD,       useClass: JwtAuthGuard },
    { provide: APP_GUARD,       useClass: PermissionsGuard },
    { provide: APP_GUARD,       useClass: IpGuard },
    { provide: APP_GUARD,       useClass: ThrottlerGuard },
    { provide: APP_FILTER,      useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_PIPE,        useValue: GlobalValidationPipe },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: "*", method: RequestMethod.ALL })
  }
}
