import * as Joi from '@hapi/joi'

export const exampleSchema = Joi.object({
  value: Joi.string(),
})
