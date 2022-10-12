import { AbstractMessage } from '../AbstractMessage';
import { userPersonalInformationUpdated } from '../../schemas/UserPersonalInformationUpdated';

/**
 * This event is emitted when ...
 */
export class UserPersonalInfoUpdated extends AbstractMessage<IUserPersonalInfoUpdated> {
  protected messageName = 'user_personal_info_updated';
  public messageSchema: any = userPersonalInformationUpdated;
}

export interface IUserPersonalInfoUpdated {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  // ISO date format
  dateOfBirth?: string;
  country: string;
  flatNumber?: string;
  buildingNumber: string;
  buildingName?: string;
  street: string;
  subStreet?: string;
  city: string;
  state?: string;
  postalCode: string;
  socialSecurityNumber?: string;
}
