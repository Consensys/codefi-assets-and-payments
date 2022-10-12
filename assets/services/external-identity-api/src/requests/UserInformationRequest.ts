import { ApiProperty } from '@nestjs/swagger'
import { UserId } from '../data/entities/types'

export default class UserInformationRequest {
  @ApiProperty({ type: 'string' })
  userId: UserId
  firstName: string
  lastName: string
  email: string
  dateOfBirth?: string
  country: string
  flatNumber?: string
  buildingNumber: string
  buildingName?: string
  street: string
  subStreet?: string
  city: string
  state?: string
  postalCode: string
  socialSecurityNumber?: string
}
