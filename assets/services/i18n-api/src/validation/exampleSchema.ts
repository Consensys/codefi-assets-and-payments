import * as Joi from 'joi'

export const exampleSchema = Joi.object({
  value: Joi.string(),
})
