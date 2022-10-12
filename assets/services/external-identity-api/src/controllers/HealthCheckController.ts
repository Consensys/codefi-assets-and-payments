import { Controller, Get } from '@nestjs/common'
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('Healthcheck')
@Controller('healthcheck')
export class HealthCheckController {
  constructor(
    public health: HealthCheckService,
    public db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  readiness() {
    return this.health.check([
      async () => this.db.pingCheck('database', { timeout: 300 }),
    ])
  }

  heathCheck() {
    return 'ok'
  }
}
