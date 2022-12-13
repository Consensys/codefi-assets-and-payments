import { ApiProperty } from '@nestjs/swagger'
import { ProductsEnum } from '@consensys/ts-types'

export class UpdateUserRequest {
  @ApiProperty({
    description: 'Auth0 application to which the user will be created',
  })
  applicationClientId?: string

  @ApiProperty({
    required: false,
    description: `Used to store additional metadata`,
  })
  appMetadata?: object

  @ApiProperty({ required: false, description: `User's tenant ID` })
  tenantId?: string

  @ApiProperty({ required: false, description: `User's entity ID` })
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
