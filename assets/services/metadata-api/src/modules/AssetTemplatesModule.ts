import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetTemplatesService } from 'src/services/AssetTemplatesService';

import { AssetTemplatesController } from 'src/controllers/AssetTemplatesController';
import { AssetTemplate } from 'src/model/AssetTemplateEntity';
import { AssetElementsModule } from './AssetElementsModule';

@Module({
  imports: [TypeOrmModule.forFeature([AssetTemplate]), AssetElementsModule],
  controllers: [AssetTemplatesController],
  providers: [AssetTemplatesService],
  exports: [AssetTemplatesService],
})
export class AssetTemplatesModule {}
