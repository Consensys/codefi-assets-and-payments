import { Module } from "@nestjs/common";
import { HealthCheckModule } from "./HealthCheckModule";
import { PublicModule } from "./PublicModule";
import { IpfsModule } from "./IpfsModule";
import { APP_GUARD } from "@nestjs/core";
import { ScopesPermissionsGuard } from "../guards/ScopesPermissionsGuard";
import { TypeOrmModule } from "@nestjs/typeorm";
import config from "../config";
import { Item } from "../data/entities/ItemEntity";
import { ScheduleModule } from "@nestjs/schedule";
import { CodefiLoggerModule } from "@consensys/observability";

const imports = [
  CodefiLoggerModule.forRoot(),
  HealthCheckModule,
  ScheduleModule.forRoot(),
  PublicModule,
  IpfsModule,
];

if (config().db.enabled) {
  imports.push(
    TypeOrmModule.forRoot({
      ...config().db,
      entities: [Item],
    })
  );
}

@Module({
  imports: imports,
  providers: [
    {
      provide: APP_GUARD,
      useClass: ScopesPermissionsGuard,
    },
  ],
})
export class AppModule {}
