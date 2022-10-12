import BaseMessageSchema from './BaseMessageSchema';

/**
 * appMetadata is a stringified JSON object
 * userMetadata is a stringified JSON object
 */
export class UserUpdatedEventSchema {
  static schema = {
    type: 'record',
    name: 'userUpdated',
    namespace: 'net.consensys.codefi.user',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'userId', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'emailVerified', type: 'boolean' },
      { name: 'name', type: 'string' },
      { name: 'picture', type: 'string' },
      { name: 'appMetadata', type: 'string' },
      { name: 'userMetadata', type: 'string' },
      { name: 'tenantId', type: ['null', 'string'], default: null },
      { name: 'entityId', type: ['null', 'string'], default: null },
      { name: 'product', type: ['null', 'string'], default: null },
    ],
  };
}
