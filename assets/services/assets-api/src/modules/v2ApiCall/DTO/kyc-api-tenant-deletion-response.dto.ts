import { ApiResponseProperty } from '@nestjs/swagger';

export class KycApiTenantDeletionResponse {
  @ApiResponseProperty({
    type: String,
    example: 'Tenant {tenantId} deleted successfully',
  })
  message: string;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedElementsTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedTemplatesTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedReviewsTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedElementInstancesTotal: number;
}
