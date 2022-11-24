import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { EventsService } from '../services/EventsService'
import {
  addressMock,
  orchestrateDeploymentReceiptMock,
  txContextMock,
  uuidMock,
  chainNameMock,
  tokenEntityMock,
  operationEntityMock,
  createMockLogger,
} from '../../test/mocks'
import { TokenERC20DeployedListener } from './TokenERC20DeployedListener'
import { TokensService } from '../services/TokensService'
import { OperationsService } from '../services/OperationsService'
import { EntityStatus, TokenType, TokenOperationType } from '@consensys/ts-types'
import { M2mTokenService } from '@consensys/auth'
import { ChainService } from '../services/ChainService'

describe('TokensERC20DeployedListener', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensServiceMock: jest.Mocked<TokensService>
  let operationsServiceMock: jest.Mocked<OperationsService>
  let eventsServiceMock: jest.Mocked<EventsService>
  let chainServiceMock: jest.Mocked<ChainService>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let listener: TokenERC20DeployedListener

  const eventMock = {
    decodedData: {
      name: 'TestToken',
      symbol: 'TTN',
      decimals: 18,
    },
  }

  beforeEach(() => {
    loggerMock = createMockLogger()
    operationsServiceMock = createMockInstance(OperationsService)
    tokensServiceMock = createMockInstance(TokensService)
    eventsServiceMock = createMockInstance(EventsService)
    chainServiceMock = createMockInstance(ChainService)
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    listener = new TokenERC20DeployedListener(
      loggerMock,
      tokensServiceMock,
      operationsServiceMock,
      eventsServiceMock,
      chainServiceMock,
      m2mTokenServiceMock,
    )
  })

  describe('eventName', () => {
    it('success', async () => {
      const eventName = listener.eventName()
      expect(eventName).toBe('CodefiERC20Deployed(string,string,uint8)')
    })
  })

  describe('onEvent', () => {
    it('success', async () => {
      tokensServiceMock.findTokenBy.mockImplementationOnce(
        async () => tokenEntityMock,
      )
      await listener.onEvent(
        uuidMock,
        orchestrateDeploymentReceiptMock,
        txContextMock,
        chainNameMock,
        eventMock,
      )

      expect(operationsServiceMock.update).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.update).toHaveBeenCalledWith(
        { id: operationEntityMock.id },

        {
          status: EntityStatus.Confirmed,
          blockNumber: orchestrateDeploymentReceiptMock.blockNumber,
          transactionHash: orchestrateDeploymentReceiptMock.txHash,
        },
      )
      expect(tokensServiceMock.update).toHaveBeenCalledTimes(1)
      expect(tokensServiceMock.update).toHaveBeenCalledWith(
        { id: operationEntityMock.id },
        {
          status: EntityStatus.Confirmed,
          contractAddress: orchestrateDeploymentReceiptMock.contractAddress,
        },
      )
      expect(eventsServiceMock.emitTokenDeployedEvent).toHaveBeenCalledTimes(0)
    })

    it('no token found, deployer not found - skip', async () => {
      tokensServiceMock.findTokenBy.mockImplementationOnce(async () => null)
      chainServiceMock.findReceipt.mockResolvedValueOnce({})
      operationsServiceMock.create.mockImplementationOnce(
        async () => operationEntityMock,
      )
      await listener.onEvent(
        uuidMock,
        orchestrateDeploymentReceiptMock,
        {
          ...txContextMock,
        },
        chainNameMock,
        eventMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
      expect(tokensServiceMock.save).toHaveBeenCalledTimes(0)
      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(0)

      expect(eventsServiceMock.emitTokenDeployedEvent).toHaveBeenCalledTimes(0)
    })

    it('success - no token found', async () => {
      tokensServiceMock.findTokenBy.mockImplementationOnce(async () => null)
      tokensServiceMock.save.mockImplementationOnce(async () => tokenEntityMock)
      operationsServiceMock.create.mockImplementationOnce(
        async () => operationEntityMock,
      )
      await listener.onEvent(
        uuidMock,
        orchestrateDeploymentReceiptMock,
        {
          ...txContextMock,
          from: addressMock,
        },
        chainNameMock,
        eventMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationType: TokenOperationType.Deploy,
        status: EntityStatus.Confirmed,
        transactionId: uuidMock,
        chainName: chainNameMock,
      })

      expect(tokensServiceMock.save).toHaveBeenCalledTimes(1)
      expect(tokensServiceMock.save).toHaveBeenCalledWith({
        id: undefined,
        status: EntityStatus.Confirmed,
        type: TokenType.ERC20,
        name: eventMock.decodedData.name,
        symbol: eventMock.decodedData.symbol,
        decimals: 18,
        deployerAddress: addressMock,
        contractAddress: orchestrateDeploymentReceiptMock.contractAddress,
        operationId: expect.any(String),
        transactionId: uuidMock,
        createdBy: undefined,
        createdAt: expect.any(Date),
        chainName: chainNameMock,
      })
      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(0)

      expect(eventsServiceMock.emitTokenDeployedEvent).toHaveBeenCalledTimes(1)
    })
  })

  describe('onError', () => {
    it('success', async () => {
      await listener.onError(uuidMock, {})

      expect(tokensServiceMock.update).toHaveBeenCalledTimes(1)
      expect(tokensServiceMock.update).toHaveBeenCalledWith(
        { transactionId: uuidMock },
        {
          status: EntityStatus.Failed,
        },
      )
    })
  })
})
