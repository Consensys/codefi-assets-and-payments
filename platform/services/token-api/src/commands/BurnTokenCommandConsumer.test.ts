import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { BurnTokenCommandBuilder } from '@codefi-assets-and-payments/messaging-events'
import { TokenType } from '@codefi-assets-and-payments/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import {
  amountMock,
  authHeadersMock,
  authTokenMock,
  createMockLogger,
  entityIdMock,
  idempotencyKeyMock,
  operationIdMock,
  subjectMock,
  tenantIdMock,
  tokenIdMock,
  txConfigMock,
} from '../../test/mocks'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { BurnTokenCommandConsumer } from './BurnTokenCommandConsumer'

describe('burnTokenCommandConsumer', () => {
  let consumer: BurnTokenCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensManagerServiceMock: jest.Mocked<TokensManagerService>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let eventsServiceMock: jest.Mocked<EventsService>

  beforeEach(() => {
    tokensManagerServiceMock = createMockInstance(TokensManagerService)
    loggerMock = createMockLogger()
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    eventsServiceMock = createMockInstance(EventsService)

    consumer = new BurnTokenCommandConsumer(
      tokensManagerServiceMock,
      loggerMock,
      m2mTokenServiceMock,
      eventsServiceMock,
    )
  })

  describe('onMessage', () => {
    it('sends ERC20 transaction', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)

      const burnTokenCommand = BurnTokenCommandBuilder.get(
        TokenType.ERC20,
        amountMock,
        operationIdMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .txConfig(txConfigMock)
        .idempotencyKey(idempotencyKeyMock)
        .build()

      await consumer.onMessage(burnTokenCommand)

      expect(tokensManagerServiceMock.burn).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.burn).toHaveBeenCalledWith(
        amountMock,
        txConfigMock,
        tenantIdMock,
        subjectMock,
        operationIdMock,
        undefined,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )
    })

    it('sends ERC721 transaction', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)

      const burnTokenCommand = BurnTokenCommandBuilder.get(
        TokenType.ERC721,
        undefined,
        operationIdMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .txConfig(txConfigMock)
        .idempotencyKey(idempotencyKeyMock)
        .tokenId(tokenIdMock)
        .build()

      await consumer.onMessage(burnTokenCommand)

      expect(tokensManagerServiceMock.burn).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.burn).toHaveBeenCalledWith(
        tokenIdMock,
        txConfigMock,
        tenantIdMock,
        subjectMock,
        operationIdMock,
        undefined,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )
    })
  })
})
