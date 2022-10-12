import { ApiProperty } from '@nestjs/swagger'

/* istanbul ignore file */
export class RolePermissionRequest {
  @ApiProperty({ description: 'The API on which to grant a permission' })
  resourceServerIdentifier: string

  @ApiProperty({ description: 'Name of the permission to grant' })
  permissionName: string
}
