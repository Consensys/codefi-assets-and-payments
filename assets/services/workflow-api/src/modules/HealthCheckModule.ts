import { Module } from '@nestjs/common'
import { HealthCheckController } from '../controllers/HealthCheckController'

@Module({
  imports: [],
  providers: [],
  controllers: [HealthCheckController],
})
export class HealthCheckModule {}
