import { Module } from '@nestjs/common';

import { DocumentController } from './document.controller';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2UserModule } from 'src/modules/v2User/user.module';

@Module({
  controllers: [DocumentController],
  imports: [V2ApiCallModule, V2UserModule],
})
export class V2DocumentModule {}
