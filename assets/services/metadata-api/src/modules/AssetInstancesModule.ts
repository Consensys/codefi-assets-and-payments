import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetInstancesService } from 'src/services/AssetInstancesService';

import { AssetInstancesController } from 'src/controllers/AssetInstancesController';
import { AssetInstance } from 'src/model/AssetInstanceEntity';
import { AssetTemplatesModule } from './AssetTemplatesModule';
import { AssetElementsModule } from './AssetElementsModule';
import { TokensModule } from './TokensModule';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetInstance]),
    forwardRef(() => TokensModule),
    AssetTemplatesModule,
    AssetElementsModule,
  ],
  controllers: [AssetInstancesController],
  providers: [AssetInstancesService],
  exports: [AssetInstancesService],
})
export class AssetInstancesModule {}
