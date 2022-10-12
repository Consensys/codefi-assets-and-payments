import { ApiResponseProperty } from '@nestjs/swagger';

export class WorkflowApiTenantDeletionResponse {
  @ApiResponseProperty({
    type: String,
    example: 'Tenant {tenantId} deleted successfully',
  })
  message: string;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedWorkflowTemplatesTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedWorkflowInstancesTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedTransitionsTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedTransactionsTotal: number;
}
