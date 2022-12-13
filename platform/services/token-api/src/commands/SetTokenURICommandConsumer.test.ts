import { M2mTokenService } from '@consensys/auth'
import { SetTokenURICommandBuilder } from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'

import {
  authHeadersMock,
  authTokenMock,
  createMockLogger,
  entityIdMock,
  idempotencyKeyMock,
  operationIdMock,
  subjectMock,
  tenantIdMock,
  tokenEntityIdMock,
  tokenIdMock,
  txConfigMock,
  uriMock,
} from '../../test/mocks'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { SetTokenURICommandConsumer } from './SetTokenURICommandConsumer'

describe('setTokenURICommandConsumer', () => {
  let consumer: SetTokenURICommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensManagerServiceMock: jest.Mocked<TokensManagerService>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let eventsServiceMock: jest.Mocked<EventsService>

  beforeEach(() => {
    tokensManagerServiceMock = createMockInstance(TokensManagerService)
    loggerMock = createMockLogger()
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    eventsServiceMock = createMockInstance(EventsService)

    consumer = new SetTokenURICommandConsumer(
      tokensManagerServiceMock,
      loggerMock,
      m2mTokenServiceMock,
      eventsServiceMock,
    )
  })

  describe('onMessage', () => {
    it('sends ERC721 transaction', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)

      const setTokenURICommand = SetTokenURICommandBuilder.get(
        tokenIdMock,
        uriMock,
        operationIdMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .txConfig(txConfigMock)
        .idempotencyKey(idempotencyKeyMock)
        .tokenEntityId(tokenEntityIdMock)
        .build()

      await consumer.onMessage(setTokenURICommand)

      expect(tokensManagerServiceMock.setTokenURI).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.setTokenURI).toHaveBeenCalledWith(
        tokenIdMock,
        uriMock,
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
