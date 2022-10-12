import Joi from 'joi'

export const sendSchema = Joi.object({
  templateId: Joi.number(),
  toName: Joi.string().required(),
  toEmail: Joi.string().email().required(),
  fromName: Joi.string(),
  fromEmail: Joi.string().email(),
  subject: Joi.string(),
  variables: Joi.object().pattern(Joi.string(), [Joi.string(), Joi.boolean()]),
  options: Joi.object().pattern(Joi.string(), Joi.any()),
  sandboxMode: Joi.boolean(),
})
