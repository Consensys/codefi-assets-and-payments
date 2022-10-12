import { Module } from '@nestjs/common';

import { RoleService } from './role.service';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2ApiCallModule } from '../v2ApiCall/api.call.module';

@Module({
  providers: [RoleService],
  imports: [V2LinkModule, V2EntityModule, V2ApiCallModule],
  exports: [RoleService],
})
export class V2RoleModule {}
