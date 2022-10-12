import * as Joi from '@hapi/joi'

export const transitionTemplateSchema = Joi.object({
  name: Joi.string().required(),
  fromState: Joi.string().required(),
  toState: Joi.string().required(),
  role: Joi.string().required(),
})
