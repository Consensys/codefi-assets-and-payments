import * as Joi from '@hapi/joi'

export const transitionInstanceSchema = Joi.object({
  name: Joi.string().allow(null),
  tenantId: Joi.string().allow(null),
  userId: Joi.string().allow(null),
  workflowInstanceId: Joi.number().allow(null),
  fromState: Joi.string().required(),
  toState: Joi.string().required(),
  role: Joi.string().required(),
})
