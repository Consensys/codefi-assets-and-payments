import { UserId } from '../data/entities/types'

export interface UserPersonalInfo {
  userId: UserId
  firstName: string
  lastName: string
  email: string
  dateOfBirth?: Date
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
