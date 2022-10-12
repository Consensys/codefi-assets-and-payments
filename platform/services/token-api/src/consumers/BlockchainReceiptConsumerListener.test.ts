import { BlockchainReceiptConsumerListener } from './BlockchainReceiptConsumerListener'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  uuidMock,
  orchestrateDeploymentReceiptMock,
  txContextMock,
  addressMock,
  tokenEntityMock,
  operationEntityMock,
  orchestrateTransferReceiptMock,
  operationIdMock,
  transactionIdMock,
  createMockLogger,
} from '../../test/mocks'
import { TokenERC20DeployedListener } from './TokenERC20DeployedListener'
import { TokenERC721DeployedListener } from './TokenERC721DeployedListener'
import { TokenTransferListener } from './TokenTransferListener'
import { TokensService } from '../services/TokensService'
import { OperationsService } from '../services/OperationsService'
import { EventsService } from '../services/EventsService'
import { EntityStatus } from '@codefi-assets-and-payments/ts-types'
import config from '../config'
import { OperationEntity } from '../data/entities/OperationEntity'

describe('BlockchainReceiptConsumerListener', () => {
  let listener: BlockchainReceiptConsumerListener
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokenERC20DeployedListener: jest.Mocked<TokenERC20DeployedListener>
  let tokenERC721DeployedListener: jest.Mocked<TokenERC721DeployedListener>
  let tokenTransferListener: jest.Mocked<TokenTransferListener>
  let operationsService: jest.Mocked<OperationsService>
  let eventsService: jest.Mocked<EventsService>
  let tokensServiceMock: jest.Mocked<TokensService>
  const erc20DeployedEventName = 'CodefiERC20Deployed(string,string,uint8)'
  const erc20TransferEventName = 'Transfer(address,address,uint)'
  const erc721DeployedEventName = 'CodefiERC721Deployed(string,string)'

  const chainName = config().orchestrate.chainName

  beforeEach(() => {
    loggerMock = createMockLogger()
    tokenERC20DeployedListener = createMockInstance(TokenERC20DeployedListener)
    tokenERC721DeployedListener = createMockInstance(
      TokenERC721DeployedListener,
    )
    tokenTransferListener = createMockInstance(TokenTransferListener)
    operationsService = createMockInstance(OperationsService)
    eventsService = createMockInstance(EventsService)

    operationsService.findOperationByTransactionId.mockResolvedValue(
      operationEntityMock,
    )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    operationsService.update.mockImplementation(async (id, params) => 1)
    eventsService.emitAsyncOperationResultEvent.mockResolvedValue(undefined)
    tokensServiceMock = createMockInstance(TokensService)

    tokenERC20DeployedListener.eventName.mockImplementation(
      () => erc20DeployedEventName,
    )
    tokenERC721DeployedListener.eventName.mockImplementation(
      () => erc721DeployedEventName,
    )

    listener = new BlockchainReceiptConsumerListener(
      loggerMock,
      tokenERC20DeployedListener,
      tokenERC721DeployedListener,
      tokenTransferListener,
      operationsService,
      eventsService,
      tokensServiceMock,
    )
  })

  describe('onMessage', () => {
    it('success', async () => {
      const receipt = {
        ...orchestrateDeploymentReceiptMock,
        logs: [
          {
            event: erc20DeployedEventName,
          },
        ],
      }
      await listener.onMessage(uuidMock, receipt, txContextMock, chainName)
      expect(tokenERC20DeployedListener.onEvent).toHaveBeenCalledTimes(1)
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        1,
      )
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledWith(
        operationEntityMock.id,
        receipt.status,
        operationEntityMock.chainName,
        receipt.txHash,
        { contractAddress: receipt.contractAddress },
      )
    })

    it('success with no contract address', async () => {
      const receipt = {
        ...orchestrateDeploymentReceiptMock,
        contractAddress: null,
        logs: [
          {
            event: erc20DeployedEventName,
          },
        ],
      }
      await listener.onMessage(uuidMock, receipt, txContextMock, chainName)
      expect(tokenERC20DeployedListener.onEvent).toHaveBeenCalledTimes(1)
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        1,
      )
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledWith(
        operationEntityMock.id,
        receipt.status,
        operationEntityMock.chainName,
        receipt.txHash,
        null,
      )
    })

    it('no transactionId - no transactionTo', async () => {
      const receipt = {
        ...orchestrateTransferReceiptMock,
        logs: [
          {
            event: erc20TransferEventName,
          },
        ],
      }
      await listener.onMessage(undefined, receipt, txContextMock, chainName)
      expect(tokenTransferListener.onEvent).toHaveBeenCalledTimes(0)
      // no txId, cant find operation; cant update op, cant report
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        0,
      )
    })

    it('no transactionId with empty receipt logs - no transactionTo', async () => {
      await listener.onMessage(
        undefined,
        orchestrateTransferReceiptMock,
        txContextMock,
        chainName,
      )
      expect(tokenTransferListener.onEvent).toHaveBeenCalledTimes(0)
      // no txId, cant find operation; cant update op, cant report
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        0,
      )
    })

    it('no transactionId - no token', async () => {
      const receipt = {
        ...orchestrateTransferReceiptMock,
        logs: [
          {
            event: erc20TransferEventName,
            address: addressMock,
          },
        ],
      }

      await listener.onMessage(undefined, receipt, txContextMock, chainName)
      expect(tokenTransferListener.onEvent).toHaveBeenCalledTimes(0)
      // no txId, cant find operation; cant update op, cant report
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        0,
      )
    })

    it('no transactionId - token found, process', async () => {
      tokensServiceMock.findTokenBy.mockImplementationOnce(
        async () => tokenEntityMock,
      )
      const receipt = {
        ...orchestrateDeploymentReceiptMock,
        logs: [
          {
            event: erc20DeployedEventName,
            address: addressMock,
          },
        ],
      }

      await listener.onMessage(undefined, receipt, txContextMock, chainName)
      expect(tokenERC20DeployedListener.onEvent).toHaveBeenCalledTimes(1)
      // no txId, cant find operation; cant update op, cant report
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        1,
      )
    })

    it('receipt status is false', async () => {
      tokensServiceMock.findTokenBy.mockImplementationOnce(
        async () => tokenEntityMock,
      )
      const receipt = {
        ...orchestrateDeploymentReceiptMock,
        status: false,
        logs: [
          {
            event: erc20DeployedEventName,
            address: addressMock,
          },
        ],
      }

      await listener.onMessage(undefined, receipt, txContextMock, chainName)
      expect(tokenERC20DeployedListener.onEvent).toHaveBeenCalledTimes(1)
      // no txId, cant find operation; cant update op, cant report
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        1,
      )
      expect(operationsService.update).toHaveBeenCalledTimes(1)
      expect(operationsService.update).toHaveBeenCalledWith(
        {
          id: operationEntityMock.id,
        },
        {
          status: EntityStatus.Failed,
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.txHash,
          receipt,
        },
      )
    })

    it('no operation found, no async results emitted or updates', async () => {
      operationsService.findOperationByTransactionId.mockResolvedValueOnce(
        undefined,
      )

      const receipt = {
        ...orchestrateDeploymentReceiptMock,
        logs: [
          {
            event: erc20DeployedEventName,
          },
        ],
      }
      await listener.onMessage(uuidMock, receipt, txContextMock, chainName)
      expect(tokenERC20DeployedListener.onEvent).toHaveBeenCalledTimes(1)
      // no operation found; nothing to emit
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        0,
      )
    })

    it('no logs - 1', async () => {
      const receipt = {
        ...orchestrateDeploymentReceiptMock,
        logs: undefined,
      }
      await listener.onMessage(uuidMock, receipt, txContextMock, chainName)
      expect(tokenERC20DeployedListener.onEvent).toHaveBeenCalledTimes(0)
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        1,
      )
    })
    it('no logs - 2', async () => {
      const receipt = {
        ...orchestrateDeploymentReceiptMock,
        logs: [],
      }
      await listener.onMessage(uuidMock, receipt, txContextMock, chainName)
      expect(tokenERC20DeployedListener.onEvent).toHaveBeenCalledTimes(0)
      // no logs but resolve operation based on the tx.receipt.status and emit
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        1,
      )
    })
    it('processor not found', async () => {
      const receipt = {
        ...orchestrateDeploymentReceiptMock,
        logs: [
          {
            event: 'nope',
          },
        ],
      }
      await listener.onMessage(uuidMock, receipt, txContextMock, chainName)
      expect(tokenERC20DeployedListener.onEvent).toHaveBeenCalledTimes(0)
    })
  })

  describe('onError', () => {
    it('success', async () => {
      const operation = {
        id: operationIdMock,
        chainName: 'dev',
      } as OperationEntity
      operationsService.findOperationByTransactionId.mockResolvedValueOnce(
        operation,
      )

      const errorMessage = 'Failed to send tx'

      await listener.onError(transactionIdMock, { message: errorMessage })

      expect(tokenERC20DeployedListener.onError).toHaveBeenCalledTimes(1)
      expect(tokenERC721DeployedListener.onError).toHaveBeenCalledTimes(1)
      expect(tokenTransferListener.onError).toHaveBeenCalledTimes(1)

      expect(
        operationsService.findOperationByTransactionId,
      ).toHaveBeenCalledTimes(1)
      expect(
        operationsService.findOperationByTransactionId,
      ).toHaveBeenCalledWith(transactionIdMock)

      expect(operationsService.update).toHaveBeenCalledTimes(1)
      expect(operationsService.update).toHaveBeenCalledWith(
        { transactionId: transactionIdMock },
        {
          status: EntityStatus.Failed,
        },
      )

      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        1,
      )
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledWith(
        operation.id,
        false,
        operation.chainName,
        null,
        null,
        errorMessage,
      )
    })

    it('success - returns if no transactionId is present', async () => {
      await listener.onError(undefined, {})

      expect(tokenERC20DeployedListener.onError).toHaveBeenCalledTimes(0)
      expect(tokenERC721DeployedListener.onError).toHaveBeenCalledTimes(0)
      expect(tokenTransferListener.onError).toHaveBeenCalledTimes(0)
      expect(
        operationsService.findOperationByTransactionId,
      ).toHaveBeenCalledTimes(0)
      expect(operationsService.update).toHaveBeenCalledTimes(0)
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        0,
      )
    })

    it('success - returns after processing events if no operation is found', async () => {
      operationsService.findOperationByTransactionId.mockResolvedValueOnce(
        undefined,
      )

      await listener.onError(transactionIdMock, {})

      expect(tokenERC20DeployedListener.onError).toHaveBeenCalledTimes(1)
      expect(tokenERC721DeployedListener.onError).toHaveBeenCalledTimes(1)
      expect(tokenTransferListener.onError).toHaveBeenCalledTimes(1)

      expect(
        operationsService.findOperationByTransactionId,
      ).toHaveBeenCalledTimes(1)
      expect(
        operationsService.findOperationByTransactionId,
      ).toHaveBeenCalledWith(transactionIdMock)

      expect(operationsService.update).toHaveBeenCalledTimes(0)
      expect(eventsService.emitAsyncOperationResultEvent).toHaveBeenCalledTimes(
        0,
      )
    })
  })

  describe('onStopConsumer', () => {
    it('success', async () => {
      await listener.onStopConsumer()
      expect(loggerMock.info).toHaveBeenCalledTimes(1)
      expect(tokenERC20DeployedListener.onError).toHaveBeenCalledTimes(0)
      expect(tokenERC20DeployedListener.onError).toHaveBeenCalledTimes(0)
    })
  })
})
