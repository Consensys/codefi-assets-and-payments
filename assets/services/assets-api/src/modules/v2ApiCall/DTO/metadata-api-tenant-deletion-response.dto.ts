import { ApiResponseProperty } from '@nestjs/swagger';

export class MetadataApiTenantDeletionResponse {
  @ApiResponseProperty({
    type: String,
    example: 'Tenant {tenantId} deleted successfully',
  })
  message: string;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedAssetCycleInstancesTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedAssetElementsTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedAssetInstancesTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedAssetTemplatesTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedConfigsTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedProjectsTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedTokensTotal: number;

  @ApiResponseProperty({
    type: Number,
    example: 0,
  })
  deletedUsersTotal: number;
}
