import { forwardRef, Module } from '@nestjs/common';

import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { AssetDataService } from './asset.data.service';
import { AssetDataController } from './asset.data.controller';
import { V2CycleModule } from '../v2Cycle/cycle.module';
import { V2LinkModule } from '../v2Link/link.module';
import { V2ConfigModule } from '../v2Config/config.module';

@Module({
  controllers: [AssetDataController],
  providers: [AssetDataService],
  imports: [
    V2ApiCallModule,
    V2CycleModule,
    forwardRef(() => V2LinkModule),
    V2ConfigModule,
  ],
  exports: [AssetDataService],
})
export class V2AssetDataModule {}
