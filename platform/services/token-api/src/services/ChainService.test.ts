import { ChainRegistry, ContractManager } from '@consensys/nestjs-orchestrate'
import createMockInstance from 'jest-create-mock-instance'
import {
  authTokenMock,
  authHeadersMock,
  hashMock,
  registeredChainMock,
  uuidMock,
} from '../../test/mocks'
import { ChainService } from './ChainService'

describe('ChainService', () => {
  let httpChainServiceMock: jest.Mocked<ChainRegistry>
  let contractManagerMock: jest.Mocked<ContractManager>
  let service: ChainService
  const emptyChainResponse = []
  const chainResponse = [registeredChainMock]

  beforeEach(() => {
    httpChainServiceMock = createMockInstance(ChainRegistry)
    contractManagerMock = createMockInstance(ContractManager)
    service = new ChainService(httpChainServiceMock, contractManagerMock)
  })

  describe('findChainUuidFromChainName', () => {
    it('not found', async () => {
      httpChainServiceMock.getAllChains.mockImplementationOnce(
        async () => emptyChainResponse,
      )
      await expect(
        service.findChainUuidFromChainName('chainName'),
      ).rejects.toThrowError(`Chain with name=chainName was not found`)
    })
    it('found', async () => {
      httpChainServiceMock.getAllChains.mockImplementationOnce(
        async () => chainResponse,
      )
      const response = await service.findChainUuidFromChainName('chainName')
      expect(response).toBe(registeredChainMock.uuid)
    })
  })

  describe('findReceipt', () => {
    it('success', async () => {
      httpChainServiceMock.getAllChains.mockImplementationOnce(
        async () => chainResponse,
      )

      await service.findReceipt(
        'chainName',
        hashMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(
        contractManagerMock.findTransactionReceiptByHash,
      ).toHaveBeenCalledTimes(1)
      expect(
        contractManagerMock.findTransactionReceiptByHash,
      ).toHaveBeenCalledWith(hashMock, uuidMock, authTokenMock, authHeadersMock)
    })
  })
})
