import { ApiProperty } from '@nestjs/swagger'
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types'

export class InviteUserByEmailRequest {
  @ApiProperty({ required: true })
  email: string

  @ApiProperty({ required: true })
  name: string

  @ApiProperty({
    description: 'Auth0 application to which the user will be invited',
  })
  applicationClientId?: string

  @ApiProperty({ required: false })
  familyName?: string

  @ApiProperty({ required: false })
  givenName?: string

  @ApiProperty({ required: false })
  picture?: string

  @ApiProperty({ required: false })
  phoneNumber?: string

  @ApiProperty({ required: false })
  nickname?: string

  @ApiProperty({
    required: false,
    description: 'Roles which will be granted to the user',
  })
  roles?: string[]

  @ApiProperty({
    required: false,
    description: `Initial password for this user`,
  })
  password?: string

  @ApiProperty({ required: false, description: 'Tenant ID' })
  tenantId?: string

  @ApiProperty({ required: false, description: 'Entity ID' })
  entityId?: string

  @ApiProperty({
    required: false,
    description: `Codefi product (${ProductsEnum.assets}, ${ProductsEnum.payments}, etc.), the user shall have access to`,
  })
  product?: ProductsEnum

  @ApiProperty({
    required: false,
    description: `Roles which will be granted to the user for the specified tenant ID only`,
  })
  tenantRoles?: string[]
}
