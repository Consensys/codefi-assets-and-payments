import Joi from 'joi'
import { adminCreateRequestSchema } from './adminCreateRequestSchema'
import { entityCreateRequestSchema } from './entityCreateRequestSchema'
import { productsSchema } from './productsSchema'
import { storeMappingRequestSchema } from './storeMappingRequestSchema'

export const tenantCreateRequestSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  products: productsSchema.required(),
  defaultNetworkKey: Joi.string().required(),
  metadata: Joi.object(),
  initialAdmins: Joi.array().items(adminCreateRequestSchema),
  initialEntities: Joi.array().items(entityCreateRequestSchema),
  stores: Joi.array().items(storeMappingRequestSchema),
})
