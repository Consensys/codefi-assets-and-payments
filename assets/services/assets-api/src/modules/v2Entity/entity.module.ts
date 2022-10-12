import { forwardRef, Module } from '@nestjs/common';

import { EntityService } from './entity.service';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2ConfigModule } from 'src/modules/v2Config/config.module';
import { V2KycCheckModule } from 'src/modules/v2KYCCheck/kyc.check.module';
import { V2AssetDataModule } from 'src/modules/v2AssetData/asset.data.module';

@Module({
  providers: [EntityService],
  imports: [
    forwardRef(() => V2LinkModule),
    V2ApiCallModule,
    V2ConfigModule,
    V2KycCheckModule,
    V2AssetDataModule,
  ],
  exports: [EntityService],
})
export class V2EntityModule {}
