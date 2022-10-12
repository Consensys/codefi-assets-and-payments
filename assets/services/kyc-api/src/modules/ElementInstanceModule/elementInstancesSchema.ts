import * as Joi from 'joi';
import { elementInstanceSchema } from './elementInstanceSchema';

export const elementInstancesSchema = Joi.object({
  elementInstances: Joi.array()
    .items(elementInstanceSchema.required())
    .required(),
  userInfo: Joi.object().keys({
    id: Joi.string().required(),
    email: Joi.string().email(),
  }),
}).required();
