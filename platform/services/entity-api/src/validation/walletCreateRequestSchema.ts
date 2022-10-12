import { WalletType } from '@codefi-assets-and-payments/ts-types'
import Joi from 'joi'
import { ethereumAddressSchema } from './ethereumAddressSchema'
import { walletTypeSchema } from './walletTypeSchema'

export const walletCreateRequestSchema = Joi.object({
  address: ethereumAddressSchema.when('type', {
    is: Joi.valid(
      WalletType.EXTERNAL_CLIENT_METAMASK,
      WalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL,
      WalletType.EXTERNAL_OTHER,
    ),
    then: Joi.required(),
  }),
  type: walletTypeSchema.required(),
  metadata: Joi.object(),
})
