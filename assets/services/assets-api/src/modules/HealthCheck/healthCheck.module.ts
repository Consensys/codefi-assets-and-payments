import { Module } from '@nestjs/common';
import { HealthCheckController } from './healthCheck.controller';

@Module({
  imports: [],
  providers: [],
  controllers: [HealthCheckController],
})
export class V2HealthCheckModule {}
