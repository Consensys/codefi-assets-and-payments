import { Module } from '@nestjs/common';

import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { NavService } from './nav.service';
import { V2CycleModule } from 'src/modules/v2Cycle/cycle.module';
import { V2AssetDataModule } from 'src/modules/v2AssetData/asset.data.module';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { NavController, SubscriptionController } from './nav.controller';

@Module({
  controllers: [NavController, SubscriptionController],
  providers: [NavService],
  imports: [
    V2ApiCallModule,
    V2CycleModule,
    V2AssetDataModule,
    V2LinkModule,
    V2EntityModule,
  ],
  exports: [NavService],
})
export class V2NavModule {}
