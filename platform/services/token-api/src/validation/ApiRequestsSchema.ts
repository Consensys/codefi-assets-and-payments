import { TokenType } from '@consensys/ts-types'
import Joi from 'joi'

// bytesLength * 2 because 1 string char = 2 bytes
const bytesHexRegex = (bytesLength: number) =>
  new RegExp('^0x([A-Fa-f0-9]{' + bytesLength * 2 + '})$')
const ETH_ADDRESS_BYTESIZE = 20
const ETH_AMOUNT_BYTE_SIZE = 32

export const MAX_PAGINATED_LIMIT = 1000

export const TransactionConfigSchema = () => ({
  transactionType: Joi.number().allow(null).optional(),
  from: Joi.string().regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE)).required(),
  chainName: Joi.string().allow(null).optional(),
  nonce: Joi.string().allow(null).optional(),
  gas: Joi.string().allow(null).optional(),
  gasPrice: Joi.string().allow(null).optional(),
  value: Joi.string().allow(null).optional(),
  contractTag: Joi.string().allow(null).optional(),
  to: Joi.string().allow(null).optional(),
  privateFrom: Joi.string().allow(null).optional(),
  privateFor: Joi.string().allow(null).optional(),
  privacyGroupId: Joi.string().allow(null).optional(),
  protocol: Joi.string().allow(null).optional(),
})

const PaginatedQueryRequestProperties = {
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number()
    .integer()
    .min(0)
    .max(MAX_PAGINATED_LIMIT)
    .default(MAX_PAGINATED_LIMIT),
}

export const TokenQueryRequestSchema = Joi.object({
  ...PaginatedQueryRequestProperties,
  transactionId: Joi.string(),
  contractAddress: Joi.string(),
  chainName: Joi.string(),
})

export const OperationQueryRequestSchema = Joi.object({
  ...PaginatedQueryRequestProperties,
  id: Joi.string(),
  transactionId: Joi.string(),
})

export const TokensDeploySchema = Joi.object({
  type: Joi.string().required(),
  confidential: Joi.boolean().required(),
  name: Joi.string().required(),
  symbol: Joi.string().required(),
  decimals: Joi.number().optional(),
  operationId: Joi.string().optional(),
  idempotencyKey: Joi.string().optional(),
  config: Joi.object({ ...TransactionConfigSchema() }).required(),
})

export const TokensRegisterSchema = Joi.object({
  contractAddress: Joi.string().required(),
  type: Joi.string().required(),
  operationId: Joi.string().optional(),
  config: Joi.object({ ...TransactionConfigSchema() }).required(),
})

export const TokensBurnSchema = Joi.object({
  amount: Joi.string().regex(bytesHexRegex(ETH_AMOUNT_BYTE_SIZE)).optional(),
  tokenId: Joi.string().optional(), // erc721 chananingans
  idempotencyKey: Joi.string().optional(),
  config: Joi.object({ ...TransactionConfigSchema() }).required(),
  operationId: Joi.string().optional(),
})

export const TokensMintSchema = Joi.object({
  tokenAddress: Joi.string(),
  type: Joi.string().required(),
  account: Joi.alternatives().conditional('type', {
    is: TokenType.ERC20.valueOf(),
    then: Joi.string().regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE)),
  }),
  amount: Joi.alternatives().conditional('type', {
    is: TokenType.ERC20.valueOf(),
    then: Joi.string().regex(bytesHexRegex(ETH_AMOUNT_BYTE_SIZE)),
  }),
  to: Joi.alternatives().conditional('type', {
    is: TokenType.ERC721.valueOf(),
    then: Joi.string().regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE)),
  }),
  tokenId: Joi.alternatives().conditional('type', {
    is: TokenType.ERC721.valueOf(),
    then: Joi.string().required(),
  }),
  partition: Joi.alternatives().conditional('type', {
    is: TokenType.UniversalToken.valueOf(),
    then: Joi.string().required(),
  }),
  tokenHolder: Joi.alternatives().conditional('type', {
    is: TokenType.UniversalToken.valueOf(),
    then: Joi.string().required(),
  }),
  value: Joi.alternatives().conditional('type', {
    is: TokenType.UniversalToken.valueOf(),
    then: Joi.string().regex(bytesHexRegex(ETH_AMOUNT_BYTE_SIZE)),
  }),
  data: Joi.alternatives().conditional('type', {
    is: TokenType.UniversalToken.valueOf(),
    then: Joi.string(),
  }),
  operationId: Joi.string().optional(),
  idempotencyKey: Joi.string().optional(),
  config: Joi.object({ ...TransactionConfigSchema() }).required(),
})
  .and('account', 'amount')
  .and('to', 'tokenId')
  .and('partition', 'tokenHolder', 'value', 'data')

export const TokensDeploySchemaValidation = Joi.alternatives().conditional(
  '.type',
  { is: TokenType.ERC20, then: TokensDeploySchema },
)

export const TokensTransferSchema = Joi.object({
  type: Joi.string().required(),
  account: Joi.alternatives().conditional('type', {
    is: TokenType.ERC20.valueOf(),
    then: Joi.string().regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE)),
    otherwise: Joi.forbidden(),
  }),
  amount: Joi.alternatives().conditional('type', {
    is: TokenType.ERC20.valueOf(),
    then: Joi.string().regex(bytesHexRegex(ETH_AMOUNT_BYTE_SIZE)),
    otherwise: Joi.forbidden(),
  }),
  to: Joi.alternatives().conditional('type', {
    is: TokenType.ERC721.valueOf(),
    then: Joi.string().regex(bytesHexRegex(ETH_ADDRESS_BYTESIZE)),
    otherwise: Joi.forbidden(),
  }),
  tokenId: Joi.alternatives().conditional('type', {
    is: TokenType.ERC721.valueOf(),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  partition: Joi.alternatives().conditional('type', {
    is: TokenType.UniversalToken.valueOf(),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  tokenHolder: Joi.alternatives().conditional('type', {
    is: TokenType.UniversalToken.valueOf(),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  value: Joi.alternatives().conditional('type', {
    is: TokenType.UniversalToken.valueOf(),
    then: Joi.string().regex(bytesHexRegex(ETH_AMOUNT_BYTE_SIZE)),
    otherwise: Joi.forbidden(),
  }),
  data: Joi.alternatives().conditional('type', {
    is: TokenType.UniversalToken.valueOf(),
    then: Joi.string(),
    otherwise: Joi.forbidden(),
  }),
  operationId: Joi.string().optional(),
  idempotencyKey: Joi.string().optional(),
  config: Joi.object({ ...TransactionConfigSchema() }).required(),
})
  .and('account', 'amount')
  .and('to', 'tokenId')
  .and('partition', 'tokenHolder', 'value', 'data')

export const TokensExecSchema = Joi.object({
  functionName: Joi.string().required(),
  params: Joi.array()
    .items(Joi.string(), Joi.number(), Joi.boolean())
    .required(),
  operationId: Joi.string().optional(),
  idempotencyKey: Joi.string().optional(),
  config: Joi.object({ ...TransactionConfigSchema() }).required(),
})

export const TokensSetTokenURISchema = Joi.object({
  tokenId: Joi.string().required(),
  uri: Joi.string().required(),
  idempotencyKey: Joi.string().optional(),
  operationId: Joi.string().optional(),
  config: Joi.object({ ...TransactionConfigSchema() }).required(),
})
