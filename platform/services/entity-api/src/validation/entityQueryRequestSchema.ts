import Joi from 'joi'
import { ethereumAddressSchema } from './ethereumAddressSchema'
import { paginatedQueryRequestProperties } from './paginatedQueryRequestProperties'
import { stringifiedJsonSchema } from './stringifiedJsonSchema'
import { stringifiedMetadataWithOptions } from './stringifiedMetadataWithOptions'
import { stringifiedArraySchema } from './stringifiedArraySchema'

export const entityQueryRequestSchema = Joi.object({
  ...paginatedQueryRequestProperties,
  ids: stringifiedArraySchema,
  name: Joi.string(),
  defaultWallet: ethereumAddressSchema,
  metadata: stringifiedJsonSchema,
  metadataWithOptions: stringifiedMetadataWithOptions,
  includeWallets: Joi.boolean().default(false),
})
