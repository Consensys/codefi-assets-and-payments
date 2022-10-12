import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthCheckController } from '../controllers/HealthCheckController';

@Module({
  imports: [TerminusModule],
  controllers: [HealthCheckController],
})
export class HealthCheckModule {}
