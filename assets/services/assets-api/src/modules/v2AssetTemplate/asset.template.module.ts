import { Module } from '@nestjs/common';

// Controller
import { AssetTemplateController } from './asset.template.controller';

// Imported modules
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { AssetTemplateService } from './asset.template.service';

@Module({
  controllers: [AssetTemplateController],
  providers: [AssetTemplateService],
  imports: [V2ApiCallModule],
})
export class V2AssetTemplateModule {}
