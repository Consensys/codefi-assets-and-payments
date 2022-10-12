import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { HealthCheckController } from '../controllers/HealthCheckController'
import { PersistentConfigurationModule } from './PersistentConfigurationModule'

@Module({
  imports: [PersistentConfigurationModule, TerminusModule],
  providers: [],
  controllers: [HealthCheckController],
})
export class HealthCheckModule {}
