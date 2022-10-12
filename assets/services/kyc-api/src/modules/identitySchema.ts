import * as Joi from 'joi';

export const identitySchema = Joi.object({
  tenantId: Joi.string().required(),
}).unknown();
