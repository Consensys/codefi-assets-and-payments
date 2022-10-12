import Joi from 'joi'
import { productsSchema } from './productsSchema'
import { storeMappingRequestSchema } from './storeMappingRequestSchema'

export const tenantUpdateRequestSchema = Joi.object({
  name: Joi.string().required(),
  products: productsSchema.required(),
  defaultNetworkKey: Joi.string().required(),
  metadata: Joi.object().required(),
  stores: Joi.array().items(storeMappingRequestSchema),
})
