import Joi from 'joi'

export const adminCreateRequestSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
})
