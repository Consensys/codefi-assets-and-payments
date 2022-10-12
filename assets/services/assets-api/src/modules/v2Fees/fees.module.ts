import { Module } from '@nestjs/common';

import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2AssetDataModule } from 'src/modules/v2AssetData/asset.data.module';
import { V2TokenModule } from '../v2Token/token.module';

@Module({
  controllers: [FeesController],
  providers: [FeesService],
  imports: [
    V2ApiCallModule,
    V2EntityModule,
    V2LinkModule,
    V2AssetDataModule,
    V2TokenModule,
  ],
  exports: [FeesService],
})
export class V2FeesModule {}
