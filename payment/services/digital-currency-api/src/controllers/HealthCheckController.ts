import { AppToHttpFilter } from '@consensys/error-handler'
import { Controller, Get, UseFilters } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'

@ApiTags('Other')
@UseFilters(new AppToHttpFilter())
@Controller()
export class HealthCheckController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get()
  async health(): Promise<string> {
    return 'OK'
  }

  @Get('health')
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.typeOrmHealthIndicator.pingCheck('database'),
    ])
  }
}
