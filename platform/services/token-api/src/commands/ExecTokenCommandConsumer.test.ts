import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { ExecTokenCommandBuilder } from '@codefi-assets-and-payments/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import {
  addressMock,
  amountMock,
  authHeadersMock,
  authTokenMock,
  createMockLogger,
  entityIdMock,
  idempotencyKeyMock,
  operationIdMock,
  subjectMock,
  tenantIdMock,
  tokenEntityIdMock,
  txConfigMock,
} from '../../test/mocks'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { ExecTokenCommandConsumer } from './ExecTokenCommandConsumer'

describe('transferTokenCommandConsumer', () => {
  let consumer: ExecTokenCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensManagerServiceMock: jest.Mocked<TokensManagerService>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let eventsServiceMock: jest.Mocked<EventsService>

  beforeEach(() => {
    tokensManagerServiceMock = createMockInstance(TokensManagerService)
    loggerMock = createMockLogger()
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    eventsServiceMock = createMockInstance(EventsService)

    consumer = new ExecTokenCommandConsumer(
      tokensManagerServiceMock,
      loggerMock,
      m2mTokenServiceMock,
      eventsServiceMock,
    )
  })

  describe('onMessage', () => {
    it('sends transaction', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)

      const functionNameMock = 'mint'
      const paramsMock = [addressMock, amountMock]
      const execTokenCommand = ExecTokenCommandBuilder.get(
        functionNameMock,
        paramsMock,
        operationIdMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .txConfig(txConfigMock)
        .idempotencyKey(idempotencyKeyMock)
        .tokenEntityId(tokenEntityIdMock)
        .build()

      await consumer.onMessage(execTokenCommand)

      expect(tokensManagerServiceMock.exec).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.exec).toHaveBeenCalledWith(
        functionNameMock,
        paramsMock,
        txConfigMock,
        tenantIdMock,
        subjectMock,
        tokenEntityIdMock,
        operationIdMock,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )
    })
  })
})
