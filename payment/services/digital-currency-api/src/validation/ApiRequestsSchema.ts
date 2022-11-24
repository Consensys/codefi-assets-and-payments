import {
  OperationRequestState,
  OperationRequestType,
} from '@consensys/ts-types'
import Joi from '@hapi/joi'
// bytesLength * 2 because 1 string char = 2 bytes
const bytesHexRegex = (bytesLength: number) =>
  new RegExp('^0x([A-Fa-f0-9]{' + bytesLength * 2 + '})$')
const ETH_ADDRESS_BYTESIZE = 20

export const DeployCurrencySchema = Joi.object({
  name: Joi.string().required(),
  symbol: Joi.string().required(),
  decimals: Joi.number().required(),
  ethereumAddress: Joi.string()
    .regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE))
    .optional(),
})

export const MintCurrencySchema = Joi.object({
  amount: Joi.string().required(),
  to: Joi.string().regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE)).required(),
  ethereumAddress: Joi.string()
    .regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE))
    .optional(),
})

export const TransferCurrencySchema = Joi.object({
  amount: Joi.string().required(),
  to: Joi.string().regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE)).required(),
  ethereumAddress: Joi.string()
    .regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE))
    .optional(),
})

export const BurnCurrencySchema = Joi.object({
  amount: Joi.string().required(),
  ethereumAddress: Joi.string()
    .regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE))
    .optional(),
})

export const OperationRequestSchema = Joi.object({
  requesterAddress: Joi.string().required(),
  amount: Joi.string().required(),
  issuerAddress: Joi.string().required(),
  type: Joi.string()
    .valid(
      OperationRequestType.AQUISITION.toString(),
      OperationRequestType.REDEEM.toString(),
    )
    .required(),
})

export const OperationRequestResolveSchema = Joi.object({
  type: Joi.string()
    .valid(
      OperationRequestType.AQUISITION.toString(),
      OperationRequestType.REDEEM.toString(),
    )
    .required(),
  state: Joi.string()
    .valid(
      OperationRequestState.APPROVED.toString(),
      OperationRequestState.REJECTED.toString(),
    )
    .required(),
})
