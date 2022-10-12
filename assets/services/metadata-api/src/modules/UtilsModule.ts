import { Module } from '@nestjs/common';

import { UtilsController } from 'src/controllers/UtilsController';
import { TokensModule } from './TokensModule';
import { ProjectsModule } from './ProjectsModule';
import { ConfigsModule } from './ConfigsModule';
import { AssetTemplatesModule } from './AssetTemplatesModule';
import { AssetInstancesModule } from './AssetInstancesModule';
import { AssetElementsModule } from './AssetElementsModule';
import { AssetCycleInstancesModule } from './AssetCycleInstancesModule';

@Module({
  imports: [
    TokensModule,
    ProjectsModule,
    ConfigsModule,
    AssetTemplatesModule,
    AssetInstancesModule,
    AssetElementsModule,
    AssetCycleInstancesModule,
  ],
  controllers: [UtilsController],
  providers: [],
  exports: [],
})
export class UtilsModule {}
