import { ApiProperty } from '@nestjs/swagger'

import { TransitionTemplateDto } from './TransitionTemplateDto'
import { WorkflowType } from '../WorkflowType'

export class WorkflowTemplateDto {
  @ApiProperty()
  name: string

  @ApiProperty({ enum: WorkflowType })
  workflowType: WorkflowType

  @ApiProperty()
  roles: string[]

  @ApiProperty()
  states: string[]

  @ApiProperty({ type: [TransitionTemplateDto] })
  transitionTemplates: TransitionTemplateDto[]
}
