import { ApiProperty } from '@nestjs/swagger'

export class ClientGrantRequest {
  @ApiProperty({ required: true, description: 'ID of the client' })
  client_id: string

  @ApiProperty({
    required: true,
    description: 'Audience or API identifier of this client grant',
  })
  audience: string

  @ApiProperty({
    required: true,
    description: 'Scopes allowed for this client grant',
  })
  scope: string[]
}
