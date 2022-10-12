import BaseMessageSchema from './BaseMessageSchema';
import TransactionConfigSchema from './TransactionConfigSchema';

export default {
  fields: [
    {
      ...BaseMessageSchema.schema,
    },
    {
      name: 'subject',
      type: 'string',
    },
    {
      name: 'tenantId',
      type: 'string',
    },
    {
      name: 'entityId',
      type: ['string', 'null'],
    },
    {
      name: 'txConfig',
      type: {
        ...TransactionConfigSchema.schema,
      },
    },
    {
      name: 'tokenEntityId',
      type: ['null', 'string'],
      default: null,
    },
    {
      name: 'operationId',
      type: 'string',
    },
    {
      name: 'idempotencyKey',
      type: ['null', 'string'],
      default: null,
    },
  ],
};
