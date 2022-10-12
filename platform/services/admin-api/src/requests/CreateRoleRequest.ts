import { ApiProperty } from '@nestjs/swagger'

export class CreateRoleRequest {
  @ApiProperty({ description: 'Name of the role to create' })
  name: string

  @ApiProperty({ description: 'Description of the role to create' })
  description: string
}
