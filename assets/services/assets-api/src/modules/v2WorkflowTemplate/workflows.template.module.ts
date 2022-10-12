import { Module } from '@nestjs/common';

import { WorkflowTemplateController } from './workflows.template.controller';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiCallHelperService } from 'src/modules/v2ApiCall/api.call.service/index';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

@Module({
  controllers: [WorkflowTemplateController],
  providers: [
    ApiWorkflowWorkflowInstanceService,
    ApiWorkflowWorkflowTemplateService,
    ApiCallHelperService,
  ],
  imports: [V2ApiCallModule],
})
export class V2WorkflowsGenericModule {}
