import Joi from 'joi'
import { paginatedQueryRequestProperties } from './paginatedQueryRequestProperties'
import { stringifiedJsonSchema } from './stringifiedJsonSchema'
import { walletTypeSchema } from './walletTypeSchema'

export const walletQueryRequestSchema = Joi.object({
  ...paginatedQueryRequestProperties,
  type: walletTypeSchema,
  metadata: stringifiedJsonSchema,
})
