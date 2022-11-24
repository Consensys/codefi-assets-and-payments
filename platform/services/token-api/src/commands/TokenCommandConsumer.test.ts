import { M2mTokenService } from '@consensys/auth'
import { ITokenCommand } from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  authHeadersMock,
  authTokenMock,
  chainNameMock,
  createMockLogger,
  entityIdMock,
  idempotencyKeyMock,
  operationIdMock,
  subjectMock,
  tenantIdMock,
  tokenEntityIdMock,
  txConfigMock,
} from '../../test/mocks'
import config from '../config'
import { EventsService } from '../services/EventsService'
import { TokenCommandConsumer } from './TokenCommandConsumer'

const submitTransactionMock = jest.fn()
const onStopListenerMock = jest.fn()

class TestTokenCommandConsumer extends TokenCommandConsumer {
  constructor(
    logger: NestJSPinoLogger,
    m2mTokenService: M2mTokenService,
    eventsService: EventsService,
  ) {
    super(logger, m2mTokenService, eventsService, 'test_command', 'group_id')
  }

  submitTransaction = submitTransactionMock
  onStopListener = onStopListenerMock
}

describe('TestTokenCommandConsumer', () => {
  let consumer: TokenCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let eventsServiceMock: jest.Mocked<EventsService>

  let tokenCommand: ITokenCommand

  beforeEach(() => {
    submitTransactionMock.mockClear()
    loggerMock = createMockLogger()
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    eventsServiceMock = createMockInstance(EventsService)

    consumer = new TestTokenCommandConsumer(
      loggerMock,
      m2mTokenServiceMock,
      eventsServiceMock,
    )

    tokenCommand = {
      subject: subjectMock,
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      txConfig: txConfigMock,
      operationId: operationIdMock,
      idempotencyKey: idempotencyKeyMock,
      tokenEntityId: tokenEntityIdMock,
    }
  })

  describe('onMessage', () => {
    it('submits transaction successfully', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)

      await consumer.onMessage(tokenCommand)

      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        config().m2mToken.client.id,
        config().m2mToken.client.secret,
        config().m2mToken.audience,
      )

      expect(submitTransactionMock).toHaveBeenCalledTimes(1)
      expect(submitTransactionMock).toHaveBeenCalledWith(
        tokenCommand,
        authTokenMock,
        authHeadersMock,
      )

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(0)
    })

    it('emits event if m2mTokenService fails to create a token', async () => {
      const errorMessage = 'Test Error'
      m2mTokenServiceMock.createM2mToken.mockRejectedValueOnce(
        new Error(errorMessage),
      )

      await consumer.onMessage(tokenCommand)

      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        config().m2mToken.client.id,
        config().m2mToken.client.secret,
        config().m2mToken.audience,
      )

      expect(submitTransactionMock).toHaveBeenCalledTimes(0)

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(1)
      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledWith(
        operationIdMock,
        false,
        chainNameMock,
        null,
        null,
        errorMessage,
      )
    })

    it('emits event if submitTransaction fails', async () => {
      const error = { errorCode: 'XYZ' }
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)
      submitTransactionMock.mockRejectedValueOnce(error)

      delete tokenCommand.txConfig
      await consumer.onMessage(tokenCommand)

      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        config().m2mToken.client.id,
        config().m2mToken.client.secret,
        config().m2mToken.audience,
      )

      expect(submitTransactionMock).toHaveBeenCalledTimes(1)
      expect(submitTransactionMock).toHaveBeenCalledWith(
        tokenCommand,
        authTokenMock,
        authHeadersMock,
      )

      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledTimes(1)
      expect(
        eventsServiceMock.emitAsyncOperationResultEvent,
      ).toHaveBeenCalledWith(
        operationIdMock,
        false,
        undefined,
        null,
        null,
        JSON.stringify(error),
      )
    })
  })
})
