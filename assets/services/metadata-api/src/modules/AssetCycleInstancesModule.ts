import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssetCycleInstancesService } from 'src/services/AssetCycleInstancesService';
import { AssetCycleInstancesController } from 'src/controllers/AssetCycleInstancesController';
import { AssetCycleInstance } from 'src/model/AssetCycleInstanceEntity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetCycleInstance])],
  controllers: [AssetCycleInstancesController],
  providers: [AssetCycleInstancesService],
  exports: [AssetCycleInstancesService],
})
export class AssetCycleInstancesModule {}
