import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetElementsService } from 'src/services/AssetElementsService';

import { AssetElementsController } from 'src/controllers/AssetElementsController';
import { AssetElement } from 'src/model/AssetElementEntity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetElement])],
  controllers: [AssetElementsController],
  providers: [AssetElementsService],
  exports: [AssetElementsService],
})
export class AssetElementsModule {}
