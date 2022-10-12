import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { WorkflowTemplatesController } from '../controllers/WorkflowTemplatesController'
import { WorkflowTemplatesService } from '../services/WorkflowTemplatesService'
import { WorkflowTemplate } from '../models/WorkflowTemplateEntity'

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowTemplate])],
  controllers: [WorkflowTemplatesController],
  providers: [WorkflowTemplatesService],
})
export class WorkflowTemplatesModule {}
