import BaseMessageSchema from './BaseMessageSchema';

export const userPersonalInformationUpdated = {
  type: 'record',
  name: 'userPersonalInfoUpdated',
  namespace: 'net.consensys.codefi.user',
  fields: [
    {
      ...BaseMessageSchema.schema,
    },
    { name: 'userId', type: 'string' },
    { name: 'firstName', type: 'string' },
    { name: 'lastName', type: 'string' },
    { name: 'email', type: 'string' },
    {
      name: 'dateOfBirth',
      type: ['null', 'string'],
      default: null,
    },
    { name: 'country', type: 'string' },
    { name: 'flatNumber', type: ['null', 'string'], default: null },
    { name: 'buildingNumber', type: 'string' },
    { name: 'buildingName', type: ['null', 'string'], default: null },
    { name: 'street', type: 'string' },
    { name: 'subStreet', type: ['null', 'string'], default: null },
    { name: 'city', type: 'string' },
    { name: 'state', type: ['null', 'string'], default: null },
    { name: 'postalCode', type: 'string' },
    { name: 'socialSecurityNumber', type: ['null', 'string'], default: null },
  ],
};
