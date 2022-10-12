import * as Joi from 'joi';

export const elementInstanceSchema = Joi.object({
  elementKey: Joi.string().required(),
  userId: Joi.string().required(),
  value: Joi.array().items(Joi.string().allow('')).required(),
  data: Joi.object(),
});
