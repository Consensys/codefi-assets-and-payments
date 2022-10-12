import * as Joi from '@hapi/joi'

export const transactionSchema = Joi.object({
  tenantId: Joi.string().allow(null),
  status: Joi.string().required(),
  signerId: Joi.string().allow(null),
  callerId: Joi.string().allow(null),
  identifierOrchestrateId: Joi.string().allow(null),
  identifierTxHash: Joi.string().required(),
  identifierCustom: Joi.string().allow(null),
  callbacks: Joi.object().allow(null),
  context: Joi.object(),
})

export const transactionsSchema = Joi.array()
  .items(transactionSchema)
  .required()
