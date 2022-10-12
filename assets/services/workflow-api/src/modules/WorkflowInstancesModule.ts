import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { WorkflowInstancesController } from '../controllers/WorkflowInstancesController'
import { TransitionInstancesService } from '../services/TransitionInstancesService'
import { WorkflowInstancesService } from '../services/WorkflowInstancesService'
import { WorkflowTemplatesService } from '../services/WorkflowTemplatesService'
import { TransitionInstance } from '../models/TransitionInstanceEntity'
import { WorkflowInstance } from '../models/WorkflowInstanceEntity'
import { WorkflowTemplate } from 'src/models/WorkflowTemplateEntity'
import { WorkflowInstancesControllerV2 } from '../controllers/WorkflowInstancesControllerV2'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransitionInstance,
      WorkflowInstance,
      WorkflowTemplate,
    ]),
  ],
  controllers: [WorkflowInstancesController, WorkflowInstancesControllerV2],
  providers: [
    TransitionInstancesService,
    WorkflowInstancesService,
    WorkflowTemplatesService,
  ],
})
export class WorkflowInstancesModule {}
