import { TransactionConfig, TransactionType } from '@codefi-assets-and-payments/nestjs-orchestrate'

export const idemPotencyKeyMock = 'mock'
export const authTokenMock = 'eyJodHRwczovL2FwaS5jb2RlZmkubmV0...'
export const headersMock = {}
export const labelsMock = { label1: 'label-1', label2: 'label-2' }
export const contractAddressMock = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
export const addressMock = '0x000000000000000000000000000000000000000000'
export const senderAddressMock = '0x111111111111111111111111111111111111111111'
export const recipientAddressMock =
  '0x222222222222222222222222222222222222222222'

export const uuidMock = '123e4567-e89b-12d3-a456-426655441001'
export const apmTraceParentMock = 'apmTraceParentMock'

export const transactionConfigMock: TransactionConfig = {
  from: addressMock,
  chainName: 'chainMocked',
  nonce: '0',
  to: addressMock,
  gas: '8000000',
  gasPrice: '0',
  contractTag: '1',
  transactionType: TransactionType.SendTransaction,
}

export const initialSupplyMock = '1000'
export const tokenNameMock = 'tokenMocked'
export const tokenSymbolMock = 'TMD'
export const tokenDecimalsMock = 5
export const tokenIdMock = 'tokenIdMocked'

export const dateMock = new Date().toString()
