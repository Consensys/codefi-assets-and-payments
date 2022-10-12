import Joi from 'joi'

export const walletUpdateRequestSchema = Joi.object({
  metadata: Joi.object().required(),
})
