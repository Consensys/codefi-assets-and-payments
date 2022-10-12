import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from "@nestjs/terminus";

@ApiTags("Other")
@Controller()
export class HealthCheckController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator
  ) {}
  @Get()
  healthOldCheck(): string {
    return "OK";
  }

  @Get("health")
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.http.pingCheck("google", "https://google.com"),
    ]);
  }
}
