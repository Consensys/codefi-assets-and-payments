import * as Joi from '@hapi/joi'

export const identitySchema = Joi.object({
  tenantId: Joi.string().required(),
}).unknown()
