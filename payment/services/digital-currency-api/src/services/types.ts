import { IEntityWallet } from '@consensys/messaging-events'

export class Counted<T> {
  result: T[]
  count: number
}

export class LegalEntityToOnboard {
  legalEntityId: string
  legalEntityName: string
  blockchainRpcEndpoint: string
  chainName: string
  ethereumAccount?: string
  tenantId: string
  issuer: boolean
  wallets?: IEntityWallet[]
}
