import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { EventsService } from '../services/EventsService'
import {
  orchestrateTransferReceiptMock as receiptMock,
  txContextMock,
  uuidMock,
  chainNameMock,
  tokenEntityMock,
  operationEntityMock,
  addressMock,
  eventMock,
  createMockLogger,
} from '../../test/mocks'
import { TokensService } from '../services/TokensService'
import { OperationsService } from '../services/OperationsService'
import { TokenTransferListener } from './TokenTransferListener'
import { EntityStatus, TokenOperationType } from '@consensys/ts-types'
import { ChainService } from '../services/ChainService'
import { M2mTokenService } from '@consensys/auth'

describe('TokensTransferListener', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensServiceMock: jest.Mocked<TokensService>
  let operationsServiceMock: jest.Mocked<OperationsService>
  let eventsServiceMock: jest.Mocked<EventsService>
  let listener: TokenTransferListener
  let chainServiceMock: jest.Mocked<ChainService>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>

  beforeEach(() => {
    loggerMock = createMockLogger()
    operationsServiceMock = createMockInstance(OperationsService)
    tokensServiceMock = createMockInstance(TokensService)
    eventsServiceMock = createMockInstance(EventsService)
    chainServiceMock = createMockInstance(ChainService)
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    listener = new TokenTransferListener(
      loggerMock,
      tokensServiceMock,
      operationsServiceMock,
      eventsServiceMock,
      chainServiceMock,
      m2mTokenServiceMock,
    )
  })

  describe('TokenTransferListener eventName', () => {
    it('success', async () => {
      const eventName = listener.eventName()
      expect(eventName).toBe('Transfer(address,address,uint256)')
    })
  })

  describe('TokenTransferListener::onEvent', () => {
    it('should emit async operation success when token and operation exist', async () => {
      operationsServiceMock.findOperationByTransactionId.mockImplementationOnce(
        async () => operationEntityMock,
      )

      const receiptTransferMock = {
        ...receiptMock,
        to: '0xabc',
        from: addressMock,
      }
      await listener.onEvent(
        uuidMock,
        receiptTransferMock,
        txContextMock,
        chainNameMock,
        eventMock,
      )

      expect(operationsServiceMock.update).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.update).toHaveBeenCalledWith(
        { id: operationEntityMock.id },

        {
          decodedEvent: eventMock,
        },
      )

      expect(eventMock.decodedData.from).toEqual(addressMock)

      expect(eventMock.decodedData.to).toEqual('0xabc')
      expect(eventsServiceMock.emitTokenTransferEvent).toHaveBeenCalledTimes(0)
    })

    it('should emit TokenTransferEvent when transfer from another node (token entity exists, but operation is not known)', async () => {
      operationsServiceMock.findOperationByTransactionId.mockImplementationOnce(
        async () => null,
      )
      tokensServiceMock.findTokenBy.mockImplementationOnce(
        async () => tokenEntityMock,
      )

      chainServiceMock.findReceipt.mockImplementationOnce(
        async () => receiptMock,
      )

      await listener.onEvent(
        uuidMock,
        receiptMock,
        txContextMock,
        chainNameMock,
        eventMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationType: TokenOperationType.Transfer,
        status: EntityStatus.Confirmed,
        transactionId: uuidMock,
        decodedEvent: eventMock,
        receipt: receiptMock,
        chainName: chainNameMock,
      })

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(0)
      expect(eventsServiceMock.emitTokenTransferEvent).toHaveBeenCalledTimes(1)
    })

    it('should emit TokenTransferEvent when transfer externally and there is context.from', async () => {
      operationsServiceMock.findOperationByTransactionId.mockImplementationOnce(
        async () => null,
      )
      tokensServiceMock.findTokenBy.mockImplementationOnce(
        async () => tokenEntityMock,
      )

      chainServiceMock.findReceipt.mockImplementationOnce(
        async () => receiptMock,
      )

      await listener.onEvent(
        uuidMock,
        receiptMock,
        {
          ...txContextMock,
          from: addressMock,
        },
        chainNameMock,
        eventMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationType: TokenOperationType.Transfer,
        status: EntityStatus.Confirmed,
        transactionId: uuidMock,
        decodedEvent: eventMock,
        receipt: receiptMock,
        chainName: chainNameMock,
      })

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(0)
      expect(eventsServiceMock.emitTokenTransferEvent).toHaveBeenCalledTimes(1)
    })

    it('should emit TokenTransferEvent as mint from another node (token entity exists, but operation is not known)', async () => {
      operationsServiceMock.findOperationByTransactionId.mockImplementationOnce(
        async () => null,
      )
      tokensServiceMock.findTokenBy.mockImplementationOnce(
        async () => tokenEntityMock,
      )
      chainServiceMock.findReceipt.mockImplementationOnce(
        async () => receiptMock,
      )

      const eventMint = {
        address: tokenEntityMock.contractAddress,
        decodedData: {
          from: '0x0000000000000000000000000000000000000000',
          to: addressMock,
          tokens: '100',
        },
      }

      await listener.onEvent(
        uuidMock,
        receiptMock,
        txContextMock,
        chainNameMock,
        eventMint,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationType: TokenOperationType.Mint,
        status: EntityStatus.Confirmed,
        transactionId: uuidMock,
        decodedEvent: eventMint,
        receipt: receiptMock,
        chainName: chainNameMock,
      })

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(0)
      expect(eventsServiceMock.emitTokenTransferEvent).toHaveBeenCalledTimes(1)
    })

    it('should emit TokenTransferEvent as burn from another node (token entity exists, but operation is not known)', async () => {
      operationsServiceMock.findOperationByTransactionId.mockImplementationOnce(
        async () => null,
      )
      tokensServiceMock.findTokenBy.mockImplementationOnce(
        async () => tokenEntityMock,
      )
      chainServiceMock.findReceipt.mockImplementationOnce(
        async () => receiptMock,
      )

      const eventBurn = {
        address: tokenEntityMock.contractAddress,
        decodedData: {
          from: '0xabc0000000000000000000000000000000000000',
          to: '0x0000000000000000000000000000000000000000',
          value: '100',
        },
      }

      await listener.onEvent(
        uuidMock,
        receiptMock,
        txContextMock,
        chainNameMock,
        eventBurn,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationType: TokenOperationType.Burn,
        status: EntityStatus.Confirmed,
        transactionId: operationEntityMock.id,
        decodedEvent: eventBurn,
        receipt: receiptMock,
        chainName: chainNameMock,
      })

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(0)
      expect(eventsServiceMock.emitTokenTransferEvent).toHaveBeenCalledTimes(1)
      // TODO, include burn
    })

    it('should not emit if token doesnt exit', async () => {
      operationsServiceMock.findOperationByTransactionId.mockImplementationOnce(
        async () => null,
      )

      tokensServiceMock.findTokenBy.mockImplementationOnce(async () => null)
      operationsServiceMock.create.mockImplementationOnce(
        async () => operationEntityMock,
      )
      await listener.onEvent(
        uuidMock,
        receiptMock,
        txContextMock,
        chainNameMock,
        eventMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(0)
      expect(eventsServiceMock.emitTokenTransferEvent).toHaveBeenCalledTimes(0)
    })
  })

  describe('onError', () => {
    it('Method is empty', async () => {
      await listener.onError(uuidMock, {})
    })
  })
})
