import { Module } from '@nestjs/common';

import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { WorkflowInstanceService } from './workflow.instance.service';

@Module({
  providers: [WorkflowInstanceService],
  imports: [V2EntityModule, V2ApiCallModule, V2LinkModule],
  exports: [WorkflowInstanceService],
})
export class V2WorkflowInstanceModule {}
