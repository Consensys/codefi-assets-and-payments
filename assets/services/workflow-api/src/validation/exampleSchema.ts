import * as Joi from '@hapi/joi'

export const exampleSchema = Joi.object({
  stuff: Joi.string(),
})
