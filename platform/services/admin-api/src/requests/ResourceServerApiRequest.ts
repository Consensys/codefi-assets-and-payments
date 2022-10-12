import { ApiProperty } from '@nestjs/swagger'

export class CreateApiRequest {
  @ApiProperty({ required: false, description: 'Name for the new API' })
  name?: string

  @ApiProperty({
    required: true,
    description:
      'Unique identifier for the API used as the audience parameter on authorization calls',
  })
  identifier: string

  @ApiProperty({
    description: 'List of permissions (scopes) that this API uses.',
  })
  scopes?: Scope[]

  @ApiProperty({
    description:
      'Expiration value (in seconds) for access tokens issued for this API from the token endpoint.',
  })
  token_lifetime?: number

  @ApiProperty({ description: 'Whether to use Role based access control' })
  rbac: boolean
}

export class Scope {
  description: string
  value: string
}
