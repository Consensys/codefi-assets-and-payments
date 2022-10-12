import { Module } from '@nestjs/common';
import { HealthCheckController } from './HealthCheckController';

@Module({
  imports: [],
  providers: [],
  controllers: [HealthCheckController],
})
export class HealthCheckModule {}
