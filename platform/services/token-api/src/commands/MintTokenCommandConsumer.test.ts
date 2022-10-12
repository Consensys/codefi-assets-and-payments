import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { MintTokenCommandBuilder } from '@codefi-assets-and-payments/messaging-events'
import { TokenType } from '@codefi-assets-and-payments/ts-types'
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
  tokenIdMock,
  txConfigMock,
} from '../../test/mocks'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { MintTokenCommandConsumer } from './MintTokenCommandConsumer'

describe('mintTokenCommandConsumer', () => {
  let consumer: MintTokenCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensManagerServiceMock: jest.Mocked<TokensManagerService>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let eventsServiceMock: jest.Mocked<EventsService>

  beforeEach(() => {
    tokensManagerServiceMock = createMockInstance(TokensManagerService)
    loggerMock = createMockLogger()
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    eventsServiceMock = createMockInstance(EventsService)

    consumer = new MintTokenCommandConsumer(
      tokensManagerServiceMock,
      loggerMock,
      m2mTokenServiceMock,
      eventsServiceMock,
    )
  })

  describe('onMessage', () => {
    it('sends ERC20 transaction', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)

      const mintTokenCommand = MintTokenCommandBuilder.get(
        TokenType.ERC20,
        operationIdMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .txConfig(txConfigMock)
        .account(addressMock)
        .amount(amountMock)
        .idempotencyKey(idempotencyKeyMock)
        .build()

      await consumer.onMessage(mintTokenCommand)

      expect(tokensManagerServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.mint).toHaveBeenCalledWith(
        TokenType.ERC20,
        addressMock,
        amountMock,
        tenantIdMock,
        subjectMock,
        txConfigMock,
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

      const mintTokenCommand = MintTokenCommandBuilder.get(
        TokenType.ERC721,
        operationIdMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .txConfig(txConfigMock)
        .account(addressMock)
        .tokenId(tokenIdMock)
        .idempotencyKey(idempotencyKeyMock)
        .build()

      await consumer.onMessage(mintTokenCommand)

      expect(tokensManagerServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.mint).toHaveBeenCalledWith(
        TokenType.ERC721,
        addressMock,
        tokenIdMock,
        tenantIdMock,
        subjectMock,
        txConfigMock,
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
