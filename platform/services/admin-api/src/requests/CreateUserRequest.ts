import { ApiProperty } from '@nestjs/swagger'
import { ProductsEnum } from '@consensys/ts-types'

export class CreateUserRequest {
  @ApiProperty({
    required: true,
    description: `The user's email`,
  })
  email: string

  @ApiProperty({
    required: true,
    description: `The user's full name`,
  })
  name: string

  @ApiProperty({
    required: false,
    description: `The user's family name(s)`,
  })
  familyName?: string

  @ApiProperty({
    required: false,
    description: `The user's given name(s)`,
  })
  givenName?: string

  @ApiProperty({
    required: false,
    description: `A URI pointing to the user's picture`,
  })
  picture?: string

  @ApiProperty({
    required: false,
    description: `The user's phone number.`,
  })
  phoneNumber?: string

  @ApiProperty({
    required: false,
    description: `The user's nickname.`,
  })
  nickname?: string

  @ApiProperty({
    required: false,
    description: `The external user's id provided by the identity provider`,
  })
  userId?: string

  @ApiProperty({
    required: false,
    description: `The user's username`,
  })
  username?: string

  @ApiProperty({
    required: false,
    description: `Whether the user will receive a verification email after creation (true) or no email (false). Overrides behavior of emailVerified parameter`,
  })
  verifyEmail?: boolean

  @ApiProperty({
    required: false,
    description: `Initial password for this user`,
  })
  password?: string

  @ApiProperty({
    required: false,
    description: `Name of the connection this user should be created in`,
  })
  connection?: string

  @ApiProperty({
    required: false,
    description: `Used to store additional metadata`,
  })
  appMetadata?: object

  @ApiProperty({
    required: false,
    description: `Used to store additional metadata to user`,
  })
  userMetadata?: object

  @ApiProperty({
    required: false,
    description: `Whether this phone number has been verified (true) or not (false)`,
  })
  phoneVerified?: boolean

  @ApiProperty({
    required: false,
    description: `Whether this email address is verified (true) or unverified (false). User will receive a verification email after creation if emailVerified is false or not specified`,
  })
  emailVerified?: boolean

  @ApiProperty({
    required: false,
    description: `Whether this user was blocked by an administrator (true) or not (false)`,
  })
  blocked?: boolean

  @ApiProperty({
    required: false,
    description: 'Roles which will be granted to the user',
  })
  roles?: string[]

  @ApiProperty({
    description: 'Auth0 application to which the user will be created',
  })
  applicationClientId?: string

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
