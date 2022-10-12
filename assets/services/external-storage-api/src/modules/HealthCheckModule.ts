import { Module } from "@nestjs/common";
import { HealthCheckController } from "../controllers/HealthCheckController";
import { TerminusModule } from "@nestjs/terminus";

@Module({
  imports: [TerminusModule],
  providers: [],
  controllers: [HealthCheckController],
})
export class HealthCheckModule {}
