import Joi from 'joi'
import { ethereumAddressSchema } from './ethereumAddressSchema'
import { storeMappingRequestSchema } from './storeMappingRequestSchema'

export const entityUpdateRequestSchema = Joi.object({
  name: Joi.string().required(),
  metadata: Joi.object().required(),
  defaultWallet: ethereumAddressSchema.required(),
  stores: Joi.array().items(storeMappingRequestSchema),
})
