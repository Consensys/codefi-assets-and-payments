import { Controller, Get } from '@nestjs/common'
import { HealthCheck } from '@nestjs/terminus'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('Healthcheck')
@Controller('healthcheck')
export class HealthCheckController {
  @Get()
  @HealthCheck()
  readiness() {
    return 'ok'
  }

  heathCheck() {
    return 'ok'
  }
}
