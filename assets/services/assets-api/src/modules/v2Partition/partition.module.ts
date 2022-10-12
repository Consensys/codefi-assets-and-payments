import { Module } from '@nestjs/common';

import { PartitionController } from './partition.controller';
import { PartitionService } from './partition.service';

@Module({
  controllers: [PartitionController],
  providers: [PartitionService],
  exports: [PartitionService],
})
export class V2PartitionModule {}
