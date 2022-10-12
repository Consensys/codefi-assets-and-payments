import { Module } from '@nestjs/common';

// Controller
import { Auth0UserControllerV2 } from './user.controller';

// Imported modules
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

@Module({
  controllers: [Auth0UserControllerV2],
  providers: [],
  imports: [V2ApiCallModule],
  exports: [],
})
export class V2Auth0UserModule {}
