import Joi from 'joi'

export const stringifiedJsonSchema = Joi.string().custom((jsonString: string) =>
  JSON.parse(jsonString),
)
