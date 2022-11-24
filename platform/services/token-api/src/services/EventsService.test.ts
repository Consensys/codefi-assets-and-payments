import { EventsService } from './EventsService'
import { NestJSPinoLogger } from '@consensys/observability'
import { KafkaProducer } from '@consensys/nestjs-messaging'
import createMockInstance from 'jest-create-mock-instance'
import { Events, ITokenTransferEvent } from '@consensys/messaging-events'
import cfg from '../config'
import config from '../config'
import {
  receiptEventMock,
  hashMock,
  operationEntityMock,
  tokenEntityMock,
  uuidMock,
  chainNameMock,
  addressMock,
  createMockLogger,
} from '../../test/mocks'

describe('EventsService', () => {
  let service: EventsService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let producerMock: jest.Mocked<KafkaProducer>

  beforeEach(() => {
    config().kafka.enabled = true
    loggerMock = createMockLogger()
    producerMock = createMockInstance(KafkaProducer)
    service = new EventsService(loggerMock, producerMock)
  })

  describe('emitAsyncOperationResultEvent', () => {
    it('success', async () => {
      await service.emitAsyncOperationResultEvent(
        uuidMock,
        true,
        chainNameMock,
        hashMock,
        receiptEventMock,
        null,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(1)
      expect(producerMock.send).toHaveBeenCalledWith(
        Events.asyncOperationResultEvent,
        {
          operationId: uuidMock,
          result: true,
          chainName: chainNameMock,
          transactionHash: hashMock,
          receipt: receiptEventMock,
          error: null,
        },
      )
    })

    it('success - kafka disabled', async () => {
      cfg().kafka.enabled = false
      await service.emitAsyncOperationResultEvent(
        uuidMock,
        true,
        chainNameMock,
        hashMock,
        null,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('emitTokenTransferEvent', () => {
    const from = '0x0000000000000000000000000000000000000000'
    const amount = '1000'

    it('success', async () => {
      await service.emitTokenTransferEvent(
        tokenEntityMock.name,
        tokenEntityMock.symbol,
        tokenEntityMock.contractAddress,
        amount,
        from,
        addressMock,
        operationEntityMock.blockNumber,
        addressMock,
        operationEntityMock.transactionHash,
        chainNameMock,
      )

      const emitted: ITokenTransferEvent = {
        name: tokenEntityMock.name,
        symbol: tokenEntityMock.symbol,
        contractAddress: tokenEntityMock.contractAddress,
        amount,
        from,
        account: addressMock,
        blockNumber: operationEntityMock.blockNumber,
        transactionSender: addressMock,
        transactionHash: operationEntityMock.transactionHash,
        chainName: chainNameMock,
      }
      expect(producerMock.send).toHaveBeenCalledTimes(1)
      expect(producerMock.send).toHaveBeenCalledWith(
        Events.tokenTransferEvent,
        emitted,
      )
    })

    it('success - kafka disabled', async () => {
      cfg().kafka.enabled = false
      await service.emitTokenTransferEvent(
        tokenEntityMock.name,
        tokenEntityMock.symbol,
        tokenEntityMock.contractAddress,
        amount,
        from,
        addressMock,
        operationEntityMock.blockNumber,
        addressMock,
        operationEntityMock.transactionHash,
        chainNameMock,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('emitTokenDeployedEvent', () => {
    it('success', async () => {
      await service.emitTokenDeployedEvent(
        tokenEntityMock.name,
        tokenEntityMock.symbol,
        18,
        tokenEntityMock.contractAddress,
        tokenEntityMock.deployerAddress,
        operationEntityMock.transactionHash,
        operationEntityMock.blockNumber,
        chainNameMock,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(1)
      expect(producerMock.send).toHaveBeenCalledWith(
        Events.tokenDeployedEvent,
        {
          name: tokenEntityMock.name,
          symbol: tokenEntityMock.symbol,
          decimals: 18,
          contractAddress: tokenEntityMock.contractAddress,
          deployerAddress: tokenEntityMock.deployerAddress,
          transactionHash: operationEntityMock.transactionHash,
          chainName: chainNameMock,
          blockNumber: operationEntityMock.blockNumber,
        },
      )
    })

    it('success with empty decimals', async () => {
      await service.emitTokenDeployedEvent(
        tokenEntityMock.name,
        tokenEntityMock.symbol,
        undefined,
        tokenEntityMock.contractAddress,
        tokenEntityMock.deployerAddress,
        operationEntityMock.transactionHash,
        operationEntityMock.blockNumber,
        chainNameMock,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(1)
      expect(producerMock.send).toHaveBeenCalledWith(
        Events.tokenDeployedEvent,
        {
          name: tokenEntityMock.name,
          symbol: tokenEntityMock.symbol,
          decimals: 0,
          contractAddress: tokenEntityMock.contractAddress,
          deployerAddress: tokenEntityMock.deployerAddress,
          transactionHash: operationEntityMock.transactionHash,
          chainName: chainNameMock,
          blockNumber: operationEntityMock.blockNumber,
        },
      )
    })

    it('success - kafka disabled', async () => {
      cfg().kafka.enabled = false
      await service.emitTokenDeployedEvent(
        tokenEntityMock.name,
        tokenEntityMock.symbol,
        18,
        tokenEntityMock.contractAddress,
        tokenEntityMock.deployerAddress,
        operationEntityMock.transactionHash,
        operationEntityMock.blockNumber,
        chainNameMock,
      )
      expect(producerMock.send).toHaveBeenCalledTimes(0)
    })
  })
})
