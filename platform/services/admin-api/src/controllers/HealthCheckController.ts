import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'

@ApiTags('Other')
@Controller()
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  health(): string {
    return 'OK'
  }

  @Get('/health')
  @HealthCheck()
  check() {
    return this.healthCheckService.check([])
  }
}
