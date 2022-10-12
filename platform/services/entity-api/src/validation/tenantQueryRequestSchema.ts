import Joi from 'joi'
import { paginatedQueryRequestProperties } from './paginatedQueryRequestProperties'
import { stringifiedJsonSchema } from './stringifiedJsonSchema'

export const tenantQueryRequestSchema = Joi.object({
  ...paginatedQueryRequestProperties,
  name: Joi.string(),
  products: stringifiedJsonSchema,
  defaultNetworkKey: Joi.string(),
  metadata: stringifiedJsonSchema,
})
