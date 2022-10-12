export interface UserInformationRequest {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
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
}
