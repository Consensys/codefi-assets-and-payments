import Joi from 'joi'

export const createApiSchema = Joi.object({
  name: Joi.string(),
  identifier: Joi.string().required(),
  scopes: Joi.array().items(Joi.object()),
  rbac: Joi.boolean().required(),
  token_lifetime: Joi.number(),
})
