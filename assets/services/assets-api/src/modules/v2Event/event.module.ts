import { Module } from '@nestjs/common';

import { EventController } from './event.controller';
import { V2WorkflowInstanceModule } from 'src/modules/v2WorkflowInstance/workflow.instance.module';
import { EventService } from './event.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';

@Module({
  controllers: [EventController],
  providers: [EventService],
  imports: [V2WorkflowInstanceModule, V2ApiCallModule, V2EntityModule],
  exports: [EventService],
})
export class V2EventModule {}
