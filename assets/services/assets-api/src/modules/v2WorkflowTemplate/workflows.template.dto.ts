import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { keys as WorkFlowKeys } from 'src/types/workflow/workflowInstances';
import {
  workflowTemplateExample,
  WorkflowTemplate,
} from 'src/types/workflow/workflowTemplate';

export class ListAllWorkflowsOutput {
  @ApiProperty({
    description: 'List of workflows sets',
    example: [workflowTemplateExample],
  })
  workflows: Array<WorkflowTemplate>;

  @ApiProperty({
    description: 'Response message',
    example: '5 workflow(s) listed successfully',
  })
  message: string;
}

export class RetrieveWorkflowParamInput {
  @ApiProperty({
    description: 'ID of workflow',
    example: 1,
  })
  workflowId: number;
}

export class RetrieveWorkflowOutput {
  @ApiProperty({
    description: 'Workflow',
    example: workflowTemplateExample,
  })
  @ValidateNested()
  workflow: any;

  @ApiProperty({
    description: 'Response message',
    example: `Workflow ${WorkFlowKeys.ID} retrieved successfully`,
  })
  message: string;
}
