import { OperationEntity } from '../src/data/entities/OperationEntity'
import { TokenEntity } from '../src/data/entities/TokenEntity'
import { UpdateResult } from 'typeorm'
import {
  EntityStatus,
  SetTokenURIRequest,
  TokensBurnRequest,
  TokensDeployRequest,
  TokensMintRequest,
  TokensRegisterRequest,
  TokensTransferRequest,
  TokenType,
  TokenOperationType,
} from '@codefi-assets-and-payments/ts-types'
import {
  ITransactionContext,
  OrchestrateUtils,
  TransactionConfig,
  TransactionType,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import { IRawTransaction } from '@codefi-assets-and-payments/nestjs-orchestrate/dist/transactions/IRawTransaction'
import {
  IDeployTokenCommand,
  IReceipt,
  ITransactionConfig,
  TransactionConfigBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { v4 as uuidv4 } from 'uuid'
import { EventSignature } from '../src/EventSignature'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

export const operationIdMock = '6f8c23b3-d8bd-4916-91f4-958695ddc356'
export const idempotencyKeyMock = 'afffac5c-3fe5-4d4f-819b-1ec4ae8bcd91'
export const authTokenMock =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik4wSXdNRE13TVRReVJrSkRSVFJDUXpNd00wSTRNemt3UVRsQlF6TTNRMFJET1RnME56ZEJPUSJ9.eyJodHRwczovL2FwaS5jb2RlZmkubmV0d29yayI6eyJ0ZW5hbnRJZCI6InRlbmFudElkMSJ9LCJodHRwczovL2FwaS5vcmNoZXN0cmF0ZS5uZXR3b3JrIjp7InRlbmFudF9pZCI6InRlbmFudElkMSJ9LCJpc3MiOiJodHRwczovL2NvZGVmaS5ldS5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NWVhODU0MDRmM2VkOTAwYzE4MDdiMmMyIiwiYXVkIjpbImh0dHBzOi8vYXBpLmNvZGVmaS5uZXR3b3JrIiwiaHR0cHM6Ly9jb2RlZmkuZXUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTYyODQyNDI1NSwiZXhwIjoxNjI4NTEwNjU1LCJhenAiOiJWUWFZUWt1QjdMc3FxczdPSDRnMVdxQmx3S2hPZ1NydyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJndHkiOiJwYXNzd29yZCIsInBlcm1pc3Npb25zIjpbImFjY2VwdDppbnN0cnVjdGlvbiIsImFwcHJvdmU6ZGlnaXRhbC1jdXJyZW5jeSIsImFwcHJvdmU6bGVnYWwtZW50aXR5IiwiYnVybjpkaWdpdGFsLWN1cnJlbmN5IiwiYnVybjp0b2tlbiIsImNyZWF0ZTpsZWdhbC1lbnRpdHkiLCJkZWxldGU6ZGF0YSIsImRlbGV0ZTpvcmFjbGUiLCJkZWxldGU6c2NoZW1hIiwiZGVsZXRlOnRlbmFudCIsImRlcGxveTpkaWdpdGFsLWN1cnJlbmN5IiwiZGVwbG95OnRva2VuIiwiZGVwb3NpdDpkaWdpdGFsLWN1cnJlbmN5IiwiZXhlY3V0ZWhvbGQ6Y29uZmlkZW50aWFsdG9rZW4iLCJleGVjdXRlSG9sZDpkaWdpdGFsLWN1cnJlbmN5IiwiZXhlY3V0ZWhvbGQ6dG9rZW4iLCJob2xkOmNvbmZpZGVudGlhbHRva2VuIiwiaG9sZDpkaWdpdGFsLWN1cnJlbmN5IiwiaG9sZDp0b2tlbiIsIm1pbnQ6Y29uZmlkZW50aWFsdG9rZW4iLCJtaW50OmRpZ2l0YWwtY3VycmVuY3kiLCJtaW50OnRva2VuIiwicmVhZGFsbDpkaWdpdGFsLWN1cnJlbmN5LW9wZXJhdGlvbnMiLCJyZWFkOmF0dGVzdGF0aW9uIiwicmVhZDpjYXNoLWFjY291bnQiLCJyZWFkOmNoYW5uZWwiLCJyZWFkOmNvbmZpZGVudGlhbHRva2VuIiwicmVhZDpkYXRhIiwicmVhZDpkaWdpdGFsLWN1cnJlbmN5IiwicmVhZDpkaWdpdGFsLWN1cnJlbmN5LWhvbGRlcnMiLCJyZWFkOmRpZ2l0YWwtY3VycmVuY3ktb3BlcmF0aW9ucyIsInJlYWQ6aW5zdHJ1Y3Rpb24iLCJyZWFkOmxlZ2FsLWVudGl0eSIsInJlYWQ6bm90aWZpY2F0aW9uIiwicmVhZDpvcmFjbGUiLCJyZWFkOnNjaGVtYSIsInJlYWQ6dGVuYW50IiwicmVhZDp0b2tlbiIsInJlYWQ6dXNlciIsInJlamVjdDppbnN0cnVjdGlvbiIsInJlbGVhc2VIb2xkOmRpZ2l0YWwtY3VycmVuY3kiLCJ0cmFuc2ZlcjpkaWdpdGFsLWN1cnJlbmN5IiwidHJhbnNmZXJGcm9tOmRpZ2l0YWwtY3VycmVuY3kiLCJ0cmFuc2Zlcjp0b2tlbiIsInVwZGF0ZTpkYXRhIiwidXBkYXRlOm9yYWNsZSIsIndpdGhkcmF3OmRpZ2l0YWwtY3VycmVuY3kiLCJ3cml0ZTphY2NvdW50Iiwid3JpdGU6YXR0ZXN0YXRpb24iLCJ3cml0ZTphenRlY2FjY291bnQiLCJ3cml0ZTpjYXNoLWFjY291bnQiLCJ3cml0ZTpjaGFubmVsIiwid3JpdGU6Y29uZmlkZW50aWFsdG9rZW4iLCJ3cml0ZTpkYXRhIiwid3JpdGU6b3BlcmF0aW9uc19yZXF1ZXN0Iiwid3JpdGU6b3BlcmF0aW9uc19yZXNvbHZlIiwid3JpdGU6b3JhY2xlIiwid3JpdGU6c2NoZW1hIiwid3JpdGU6dGVuYW50Il19.U4CVVxXLtbq_3qHJpn25hRUpFGaaL7a0Gukia6R0J7obWCddEOxst35ftdNZObOVeadBcec0cJC_PJYkoAxEjl7jMN-h2gPbZvcWvWjfqO77AKkWcJoGSuWcSEjGEQyN-lscYWluqRPUBuMf5nCTCseGgoEB8vKToTAVP1XjClAcKZ9IVO6uqfKfcRSMEaZk-aVXPxkum1q3yS0ePfutdHfTqAsvZv6gt5O8zEmGTsrMY1R6J2dCa90F0Uj9QM-hPY4R3Qh_Gd1O6T02Gg3VRvcjYjwtOJnDXdIZNw48MbWwa9McwtfzK1hqZ2IO9_YT7YoBE9dyx1Qe0EXzD2gAPg'
export const tenantIdMock = 'tenantId1'
export const entityIdMock = 'entityId1'
export const authHeadersMock =
  OrchestrateUtils.buildOrchestrateHeadersForTenant(tenantIdMock, entityIdMock)

export const accountMock = '0x53799FA918c8B4c3e207F684575873e9c5f1B00c'
export const uuidMock = '123e4567-e89b-12d3-a456-426655440000'
export const transactionIdMock = '123e4567-e89b-12d3-a456-000000000000'
export const userIdMock = 'auth0|whateverwhatever'
export const hashMock =
  '0xbd4982e964d81c68c0796192a81062159efcd9caaa0f120f17658a582923dec6'
export const schemaIdMock = 'schemaId1'
export const subjectMock = 'RYTOqc1V1Ncpl7666UDr9NsTTJtpzr8a@clients'
export const addressMock = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

export const addressToMock = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
export const addressFromMock = '0xcccccccccccccccccccccccccccccccccccccccc'
export const addressEmptyMock = '0x0000000000000000000000000000000000000000'

export const contractAddressMock = '0x32A9daeD647a8CC42FfBAd1498BC32074b0ae0A8'
export const contractAddressMock2 = '0x42A9daeD647a9CC42FfBAd1598BC32084b0ae0A8'

export const chainNameMock = 'Orchestrate Chain Name'
export const chainNameMock2 = 'Orchestrate Chain Name 2'
export const chainUrlMock = 'https://somechain.com:8545'
export const chainUrlMock2 = 'https://somechain2.com:8545'
export const tokenIdMock = '123e4567-e89b-12d3-a456-426655440011'
export const erc721TokenIdMock = '123'
export const uriMock = 'testToken1234'

export const senderMock = '0x1'
export const recipientMock = '0x3'
export const amountMock = '0x2'
export const amountMock2 = '0x3E8'

export const txConfigMock: ITransactionConfig = TransactionConfigBuilder.get(
  addressFromMock,
)
  .to(addressToMock)
  .chainName(chainNameMock)
  .transactionType(TransactionType.SendTransaction)
  .build()

export const tokensDeployRequestMock: TokensDeployRequest = {
  type: TokenType.ERC20,
  confidential: false,
  name: `token_${uuidv4()}`,
  symbol: `smd`,
  decimals: 18,
  config: txConfigMock,
}

export const tokensRegisterRequestMock: TokensRegisterRequest = {
  contractAddress: contractAddressMock,
  type: TokenType.ERC20,
  config: txConfigMock,
}

export const tokensERC721DeployRequestMock: TokensDeployRequest = {
  type: TokenType.ERC721,
  confidential: false,
  name: `token_${uuidv4()}`,
  symbol: `smd`,
  config: txConfigMock,
}

export const tokensBurnRequestMock: TokensBurnRequest = {
  config: txConfigMock,
  amount: '0x1',
}

export const tokensTransferRequestMock: TokensTransferRequest = {
  type: TokenType.ERC20,
  account: addressMock,
  amount: '0x0000000000000000000000000000000000000000000000000000000000000064',
  config: txConfigMock,
}

export const tokensERC721TransferRequestMock: TokensTransferRequest = {
  type: TokenType.ERC721,
  to: addressMock,
  tokenId: erc721TokenIdMock,
  config: txConfigMock,
}

export const tokensMintRequestMock: TokensMintRequest = {
  tokenAddress: addressMock,
  type: TokenType.ERC20,
  account: addressMock,
  amount: '0x0000000000000000000000000000000000000000000000000000000000000064',
  config: txConfigMock,
}

export const tokensERC721MintRequestMock: TokensMintRequest = {
  tokenAddress: addressMock,
  type: TokenType.ERC721,
  tokenId: `123`,
  config: txConfigMock,
}

export const tokensERC721SetTokenURIRequestMock: SetTokenURIRequest = {
  tokenId: `123`,
  uri: `Test Token`,
  config: txConfigMock,
}

export const validTransactionConfiguration: TransactionConfig = {
  from: addressFromMock,
  chainName: chainNameMock,
  contractTag: '1',
  gas: '',
  gasPrice: '',
  nonce: null,
  to: null,
  value: null,
  privateFrom: null,
  privateFor: null,
  privacyGroupId: null,
  protocol: null,
  transactionType: TransactionType.SendTransaction,
}

export const rawTransactionMock: IRawTransaction = {
  transaction: {
    nonce: '0x04',
    gasPrice: '0x',
    gasLimit: '0x6691b7',
    to: '0x',
    value: '0x',
    data: '0x60806040523480156200001157600..',
  },
  transactionSerialized:
    '0xf95b370480836691b78080b95b2960806040523480156200001157600080fd5b506040516200592938',
  transactionPayload: '0x',
}

export const receiptEventMock: IReceipt = {
  contractAddress: contractAddressMock,
}

export const eventMock = {
  decodedData: {
    from: addressMock,
    to: '0xabc',
    value: '100',
  },
}

export const operationEntityMock: OperationEntity = {
  id: uuidMock,
  operation: TokenOperationType.Deploy,
  status: EntityStatus.Pending,
  transactionId: transactionIdMock,
  tenantId: tenantIdMock,
  entityId: entityIdMock,
  createdBy: userIdMock,
  createdAt: new Date(),
  chainName: chainNameMock,
  blockNumber: 12,
  transactionHash: '0x0',
  decodedEvent: eventMock,
  receipt: receiptEventMock,
}

export const tokenEntityIdMock = uuidMock
export const tokenEntityMock: TokenEntity = {
  id: tokenEntityIdMock,
  status: EntityStatus.Pending,
  type: TokenType.ERC20,
  name: 'TestToken',
  symbol: 'TTN',
  decimals: 18,
  deployerAddress: addressMock,
  operationId: uuidMock,
  transactionId: transactionIdMock,
  contractAddress: contractAddressMock,
  tenantId: tenantIdMock,
  entityId: entityIdMock,
  createdBy: userIdMock,
  createdAt: new Date(),
  chainName: chainNameMock,
}
export const token721EntityMock: TokenEntity = {
  id: uuidMock,
  status: EntityStatus.Pending,
  type: TokenType.ERC721,
  name: 'TestERC721Token',
  symbol: 'TTN',
  decimals: 18,
  deployerAddress: addressMock,
  operationId: uuidMock,
  transactionId: transactionIdMock,
  contractAddress: contractAddressMock,
  tenantId: tenantIdMock,
  createdBy: userIdMock,
  createdAt: new Date(),
  chainName: chainNameMock,
}
export const operationPartialEntityMock: Partial<OperationEntity> =
  operationEntityMock

export const tokenPartialEntityMock: Partial<TokenEntity> = tokenEntityMock

export const updateResultMock: UpdateResult = {
  raw: {},
  affected: 1,
  generatedMaps: [],
}

export const orchestrateDeploymentReceiptMock = {
  blockHash:
    '0xb3646936e61f08e9d873745cac4e10ae058fe3cbbc54325ff8b1cbbdbef058d0',
  blockNumber: 15141,
  txIndex: 0,
  txHash: '0x90661bbddc71e3fbb71310bb43c5d35ea964385c92cbcbbab9ab2feea98ec338',
  status: true,
  contractAddress: contractAddressMock,
  to: '0x0000000000000000000000000000000000000000',
  gasUsed: 24674,
  cumulativeGasUsed: 24674,
  postState: '0x',
  bloom:
    '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000020004000000000000000000000000000000000000000000000000000000000000000',
  logs: [],
  revertReason: undefined,
}

export const orchestrateTransferReceiptMock = {
  blockHash:
    '0xb3646936e61f08e9d873745cac4e10ae058fe3cbbc54325ff8b1cbbdbef058d1',
  blockNumber: 15141,
  txIndex: 0,
  txHash: '0x90661bbddc71e3fbb71310bb43c5d35ea964385c92cbcbbab9ab2feea98ec337',
  status: true,
  to: '0x0000000000000000000000000000000000000001',
  from: '0x0000000000000000000000000000000000000000',
  gasUsed: 24674,
  cumulativeGasUsed: 24674,
  postState: '0x',
  bloom: '0x000000000000000000000000000000000000000000000000000',
  logs: [],
  revertReason: undefined,
}

export const txContextMock: ITransactionContext = {
  txHash: orchestrateDeploymentReceiptMock.txHash,
}

export const deployTokenCommandMock: IDeployTokenCommand = {
  type: TokenType.ERC20,
  name: 'tokenMocked',
  symbol: 'TMD',
  confidential: false,
  tenantId: tenantIdMock,
  entityId: entityIdMock,
  subject: subjectMock,
  txConfig: txConfigMock,
  operationId: uuidMock,
  certificateActivated: null,
  controllers: null,
  certificateSigner: null,
  defaultPartitions: null,
  extension: null,
  newOwner: null,
  decimals: 18,
}

export const registeredChainMock: any = {
  name: 'chainName',
  uuid: uuidMock,
}

export const blockNumberMock = 1234
export const blockNumberMock2 = blockNumberMock + 1000

export const createBlockchainEventMock = (
  signature: string = EventSignature.DEPLOY_ERC20,
  index = 0,
) => ({
  address: contractAddressMock.slice(0, contractAddressMock.length - 1) + index,
  topics: [signature],
  blockNumber: blockNumberMock + index,
  transactionHash: '0x1234' + index,
  data: '0x5678' + index,
  transactionIndex: index,
  blockHash: '0x9012' + index,
  logIndex: index + 1,
  removed: false,
})

export const createBlockchainEventDecodedMock = (
  signature: string,
  index = 0,
  args: any = {
    name: 'TestContract' + index,
    symbol: 'TestSymbol' + index,
    decimals: 123 + index,
  },
) => ({
  args,
  eventFragment: {
    inputs: Object.keys(args).map((arg) => ({ name: arg, value: args[arg] })),
  },
  signature,
})

export const createTransactionReceiptMock = (index = 0) => ({
  transactionHash: '0x123' + index,
  blockHash: '0x456' + index,
  blockNumber: blockNumberMock + index,
  transactionIndex: 123 + index,
  contractAddress: '0x789' + index,
  status: 0x1,
  logsBloom: '0x901' + index,
  logs: [
    createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 123 + index),
    createBlockchainEventMock(EventSignature.DEPLOY_ERC20, 456 + index),
  ],
  gasUsed: { toNumber: () => 234 + index },
  cumulativeGasUsed: { toNumber: () => 567 + index },
  from: '0x839' + index,
})

export const errorMessageMock = 'TestError'

export const tokenAndOperationResponseMock = {
  token: tokenEntityMock,
  operation: operationEntityMock,
}

export const erc721TokenIdUniqueMock = () =>
  `${erc721TokenIdMock}${new Date().getTime()}`

export const createMockLogger = (isChild = false) => {
  const loggerMock = createMockInstance(NestJSPinoLogger)
  const childMethod = jest.fn(() => createMockLogger(true))

  if (isChild) {
    return { ...loggerMock, child: childMethod }
  }

  Object.defineProperty(loggerMock, 'logger', {
    get: jest.fn(() => ({
      child: childMethod,
    })),
  })

  return loggerMock
}
