import Joi from 'joi'

export const clientGrantSchema = Joi.object({
  client_id: Joi.string().required(),
  audience: Joi.string().required(),
  scope: Joi.array().items(Joi.string()).required(),
})
