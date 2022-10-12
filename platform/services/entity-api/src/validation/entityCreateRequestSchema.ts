import Joi from 'joi'
import { adminCreateRequestSchema } from './adminCreateRequestSchema'
import { ethereumAddressSchema } from './ethereumAddressSchema'
import { storeMappingRequestSchema } from './storeMappingRequestSchema'
import { walletCreateRequestSchema } from './walletCreateRequestSchema'

export const entityCreateRequestSchema = Joi.object({
  id: Joi.string(),
  name: Joi.string().required(),
  metadata: Joi.object(),
  initialAdmins: Joi.array().items(adminCreateRequestSchema),
  initialWallets: Joi.array().items(walletCreateRequestSchema),
  defaultWallet: ethereumAddressSchema,
  stores: Joi.array().items(storeMappingRequestSchema),
})
