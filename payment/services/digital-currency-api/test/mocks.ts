import {
  CreateDigitalCurrencyRequest,
  EntityStatus,
  MintDigitalCurrencyRequest,
  BurnDigitalCurrencyRequest,
  BalanceHistoryQuotes,
  WalletType,
  TransferDigitalCurrencyRequest,
  OperationType,
} from '@codefi-assets-and-payments/ts-types'
import { LegalEntityEntity } from '../src/data/entities/LegalEntityEntity'
import { DECODED_TOKEN_HEADER } from '../src/utils/jwtUtils'
import config from '../src/config'
import { Request } from 'express'
import {
  IAsyncOperationResultEvent,
  IEntityOperationEvent,
  IEntityWallet,
  ITenantOperationEvent,
  ITokenDeployedEvent,
  ITokenTransferEvent,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import { DigitalCurrencyEntity } from '../src/data/entities/DigitalCurrencyEntity'
import { OperationEntity } from '../src/data/entities/OperationEntity'
import { Counted } from '../src/services/types'
import { EthereumAddressEntity } from '../src/data/entities/EthereumAddressEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { craftRequestWithAuthHeaders } from '@codefi-assets-and-payments/auth'

export const addressMock = '0x5d2FD0EFb594179D3B772640f8dA975871e460d2'
export const addressMock2 = '0x5d2FD0EFb594179D3B772640f8dA975871e460d3'
export const addressMock3 = '0x5d2FD0EFb594179D3B772640f8dA975871e460d4'
export const addressMock4 = '0x5d2FD0EFb594179D3B772640f8dA975871e460d5'
export const uuidMock = '123e4567-e89b-12d3-a456-426655440000'
export const uuidMock2 = '123e4567-e89b-12d3-a456-426655440001'
export const hashMock =
  '0x73375c8922a5189b28e4fd74d71339cf06d2c8e350e4c50dfc0b56bf6babb1f7'
export const hashMock2 =
  '0x73375c8922a5189b28e4fd74d71339cf06d2c8e350e4c50dfc0b56bf6babb1f8'

export const tenantIdMock = 'tenantId1'
export const entityIdMock = 'entityId1'
export const subjectMock = 'RYTOqc1V1Ncpl7666UDr9NsTTJtpzr8a@clients'

export const chainNameMock = 'chainNameMocked'

export const legalEntityMock: LegalEntityEntity = {
  id: uuidMock,
  legalEntityName: 'LegalEntity name',
  orchestrateChainName: 'orchestrate chain name',
  ethereumAddress: addressMock,
  status: EntityStatus.Confirmed,
  issuer: true,
  tenantId: tenantIdMock,
}

export const tenantEntityMock: TenantEntity = {
  id: uuidMock2,
  createdAt: new Date(),
  defaultNetworkKey: 'chainNameTest',
  metadata: '{}',
  name: 'TenantNameTest',
}

export const updateResultMock: any = {
  affected: 1,
}

export const ethereumAddressEntityMock: EthereumAddressEntity = {
  address: addressMock,
  entityId: 'entity',
  id: uuidMock2,
  metadata: '{}',
  type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
  createdAt: new Date(),
}

export const digitalCurrencyEntityMock: DigitalCurrencyEntity = {
  id: uuidMock,
  name: 'name',
  symbol: 'symbol',
  decimals: 18,
  deployerAddress: addressMock,
  currencyEthereumAddress: addressMock2,
  totalBurnt: '0x0',
  totalMinted: '0x0',
  status: EntityStatus.Confirmed,
  createdAt: new Date(),
  createdBy: subjectMock,
  operationId: uuidMock2,
  tenantId: tenantIdMock,
  chainName: 'orchestrate chain name',
  entityId: entityIdMock,
}

export const createDigitalCurrencyRequestMock: CreateDigitalCurrencyRequest = {
  name: 'TestCurrency',
  symbol: 'TST',
  decimals: 18,
}

export const mintDigitalCurrencyRequest: MintDigitalCurrencyRequest = {
  amount: '0x5',
  to: '0x122FD0EFb594179D3B772640f8dA975871e46000',
}

export const burnDigitalCurrencyRequest: BurnDigitalCurrencyRequest = {
  amount: '0x5',
}

export const requestHeadersWithToken = (decodedToken): Request => {
  const requestHeadersWithTenantId = {
    headers: {},
  }
  requestHeadersWithTenantId.headers[DECODED_TOKEN_HEADER] = decodedToken
  return requestHeadersWithTenantId as any
}

export const decodedJwtTokenWithTenantIdAndEntityId = (tenantId, entityId) => {
  const decodedToken = {}
  decodedToken[config().jwtCodefiNamespace] = {
    tenantId,
    entityId,
  }
  return decodedToken
}

export const requestWithTenantIdAndEntityId = craftRequestWithAuthHeaders(
  tenantIdMock,
  entityIdMock,
  subjectMock,
)

export const tokenDeployedEventMock: ITokenDeployedEvent = {
  name: 'Name',
  symbol: 'SYM',
  decimals: 18,
  contractAddress: addressMock,
  deployerAddress: addressMock2,
  transactionHash: hashMock,
  blockNumber: 12,
  chainName: 'orchestrate chain name',
}

export const tokenTransferEvent: ITokenTransferEvent = {
  account: addressMock,
  amount: '0x8',
  blockNumber: 10,
  chainName: 'chainName',
  contractAddress: addressMock2,
  from: addressMock3,
  name: 'name',
  symbol: 'sym',
  transactionHash: hashMock,
  transactionSender: addressMock4,
}

export const asyncOperationResultEventMock: IAsyncOperationResultEvent = {
  error: null,
  operationId: uuidMock,
  receipt: {
    contractAddress: addressMock,
  },
  result: true,
  transactionHash: hashMock,
  chainName: 'orchestrate chain name',
}

export const operationMock: OperationEntity = {
  id: uuidMock,
  chainName: 'chainName',
  operationAmount: '0xa',
  status: EntityStatus.Confirmed,
  operationTriggeredByAddress: addressMock,
  operationType: OperationType.Mint,
  digitalCurrencyAddress: addressMock2,
  createdBy: subjectMock,
  createdAt: new Date(),
  tenantId: tenantIdMock,
  operationSourceAddress: addressMock3,
  operationTargetAddress: addressMock4,
  transactionHash: hashMock,
}

export const operationPendingMock: OperationEntity = {
  id: uuidMock,
  chainName: 'chainName',
  operationAmount: '0xa',
  status: EntityStatus.Pending,
  operationTriggeredByAddress: addressMock,
  operationType: OperationType.Mint,
  digitalCurrencyAddress: addressMock2,
  createdBy: subjectMock,
  createdAt: new Date(),
  tenantId: tenantIdMock,
  operationSourceAddress: addressMock3,
  operationTargetAddress: addressMock4,
  transactionHash: hashMock,
}

export const operationEntityMock: OperationEntity = {
  id: uuidMock,
  status: EntityStatus.Pending,
  operationType: OperationType.Creation,
  tenantId: tenantIdMock,
  entityId: entityIdMock,
  createdBy: subjectMock,
  operationTriggeredByAddress: addressMock3,
  digitalCurrencyAddress: addressMock4,
  createdAt: new Date(),
  transactionHash: hashMock,
  chainName: 'chainName',
  operationAmount: '5',
  operationSourceAddress: addressMock,
  operationTargetAddress: addressMock2,
}

export const operationEntityConfirmedMock: OperationEntity = {
  id: uuidMock,
  status: EntityStatus.Confirmed,
  operationType: OperationType.Mint,
  tenantId: tenantIdMock,
  createdBy: subjectMock,
  operationTriggeredByAddress: addressMock3,
  digitalCurrencyAddress: addressMock4,
  createdAt: new Date(),
  transactionHash: hashMock,
  chainName: 'chainName',
  operationAmount: '100',
  operationSourceAddress: addressMock,
  operationTargetAddress: addressMock2,
}

export const balanceHistoryByPeriodMock: BalanceHistoryQuotes[] = [
  { v: '1', t: new Date().setDate(-4).toString() },
  { v: '6', t: new Date().setDate(-3).toString() },
  { v: '5', t: new Date().setDate(-2).toString() },
  { v: '10', t: new Date().setDate(-1).toString() },
]

export const operationEntitiesMock: OperationEntity[] = [
  {
    ...operationEntityConfirmedMock,
    createdAt: new Date('12-01-2020'),
    operationType: OperationType.Mint,
    operationAmount: '250',
    digitalCurrencyAddress: addressMock2,
    operationTargetAddress: addressMock,
  },
  {
    ...operationEntityConfirmedMock,
    createdAt: new Date('12-20-2020'),
    operationType: OperationType.Transfer,
    operationAmount: '50',
    operationTriggeredByAddress: addressMock,
    digitalCurrencyAddress: addressMock2,
  },
  {
    ...operationEntityConfirmedMock,
    createdAt: new Date('01-02-2021'),
    operationType: OperationType.Mint,
    operationAmount: '60',
    digitalCurrencyAddress: addressMock2,
    operationTargetAddress: addressMock,
  },
  {
    ...operationEntityConfirmedMock,
    createdAt: new Date('01-20-2021'),
    operationType: OperationType.Burn,
    operationAmount: '2',
    digitalCurrencyAddress: addressMock2,
    operationTriggeredByAddress: addressMock,
  },
  operationEntityConfirmedMock,
]

export const walletsMock: IEntityWallet[] = [
  {
    address: addressMock,
    type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
    metadata: `{}`,
  },
]

export const entityOperationEventMock: IEntityOperationEvent = {
  operation: MessageDataOperation.CREATE,
  entityId: uuidMock,
  name: 'LegalEntity name',
  defaultWallet: addressMock,
  tenantId: tenantIdMock,
  createdAt: new Date().toString(),
  createdBy: subjectMock,
  metadata: JSON.stringify({ tenantId: tenantIdMock }),
}

export const walletOperationEventMock: IWalletOperationEvent = {
  operation: MessageDataOperation.CREATE,
  entityId: uuidMock,
  address: addressMock,
  type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
  metadata: JSON.stringify({ tenantId: tenantIdMock }),
  createdAt: new Date().toString(),
  createdBy: subjectMock,
}

export const tenantOperationEventMock: ITenantOperationEvent = {
  operation: MessageDataOperation.CREATE,
  metadata: JSON.stringify({ tenantId: tenantIdMock }),
  createdAt: new Date().toString(),
  createdBy: subjectMock,
  defaultNetworkKey: 'http://blockchain',
  name: 'TenantNameTest',
  products: {
    assets: true,
    payments: true,
    compliance: false,
    staking: false,
    workflows: false,
  },
  tenantId: 'TenantidTest',
}

export const registeredChainsMock: any = {
  urls: ['http://blockchain'],
  name: 'registeredChainName',
}

export const transferRequestMock: TransferDigitalCurrencyRequest = {
  amount: '0x64',
  to: addressMock2,
}

export const createPaginatedResponse = <T>(
  items: T[],
  count?: number,
  skip?: number,
  limit?: number,
): PaginatedResponse<T> => {
  return {
    items,
    count: count ? count : 20,
    skip: skip ? skip : 1,
    limit: limit ? limit : 10,
  }
}

export class PaginatedResponse<T> {
  items: T[]
  count: number
  skip: number
  limit: number
}

export const createCountedMock = <T>(
  result: T[],
  count?: number,
): Counted<T> => {
  return {
    count: count ? count : 10,
    result,
  }
}
