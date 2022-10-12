import { Controller, Get } from '@nestjs/common'
import {
  HttpHealthIndicator,
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'

@Controller('healthcheck')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    /* istanbul ignore next */
    const dnsFunc = async () =>
      this.http.pingCheck('google', 'https://google.com')
    /* istanbul ignore next */
    const dbFunc = async () =>
      this.db.pingCheck(process.env.POSTGRES_DB, { timeout: 300 })
    return this.health.check([dnsFunc, dbFunc])
  }
}
