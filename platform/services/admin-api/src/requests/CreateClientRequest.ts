import { ApiProperty } from '@nestjs/swagger'
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types'

export class CreateClientRequest {
  @ApiProperty({ required: true, description: 'Name of this client' })
  name: string

  @ApiProperty({
    required: true,
    description: 'Free text description of this client',
  })
  description: string

  @ApiProperty({
    required: true,
    description:
      'Type of client used to determine which settings are applicable. Can be spa, native, non_interactive, or regular_web',
  })
  appType: string

  @ApiProperty({ required: true })
  isEmailOnly?: boolean

  @ApiProperty({
    required: true,
    description:
      'Metadata associated with the client, in the form of an object with string values (max 255 chars). Maximum of 10 metadata properties allowed.',
  })
  clientMetadata?: object
  logoUri?: string
  callbacks?: Array<string>
  allowedLogoutUrls?: Array<string>
  webOrigins?: Array<string>
  allowedOrigins?: Array<string>
  grantTypes?: Array<string>
  jwtConfiguration?: any
  sso?: boolean
  initiateLoginUri?: string

  @ApiProperty({ required: false, description: `Client's tenant ID` })
  tenantId?: string

  @ApiProperty({ required: false, description: `Client's entity ID` })
  entityId?: string

  @ApiProperty({
    required: false,
    description: `Codefi product (${ProductsEnum.assets}, ${ProductsEnum.payments}, etc.), the client belongs to`,
  })
  product?: ProductsEnum
}
