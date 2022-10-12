import { Module } from '@nestjs/common';

// Controller
import { ActionController } from './action.controller';

// Imported modules
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { ActionService } from './action.service';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2WorkflowInstanceModule } from 'src/modules/v2WorkflowInstance/workflow.instance.module';

@Module({
  controllers: [ActionController],
  providers: [ActionService],
  imports: [V2ApiCallModule, V2EntityModule, V2WorkflowInstanceModule],
  exports: [ActionService],
})
export class V2ActionModule {}
