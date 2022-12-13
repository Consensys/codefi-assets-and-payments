import { M2mTokenService } from '@consensys/auth'
import { TransferTokenCommandBuilder } from '@consensys/messaging-events'
import { TokenType } from '@consensys/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'

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
import { TransferTokenCommandConsumer } from './TransferTokenCommandConsumer'

describe('transferTokenCommandConsumer', () => {
  let consumer: TransferTokenCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensManagerServiceMock: jest.Mocked<TokensManagerService>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let eventsServiceMock: jest.Mocked<EventsService>

  beforeEach(() => {
    tokensManagerServiceMock = createMockInstance(TokensManagerService)
    loggerMock = createMockLogger()
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    eventsServiceMock = createMockInstance(EventsService)

    consumer = new TransferTokenCommandConsumer(
      tokensManagerServiceMock,
      loggerMock,
      m2mTokenServiceMock,
      eventsServiceMock,
    )
  })

  describe('onMessage', () => {
    it('sends ERC20 transaction', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)

      const transferTokenCommand = TransferTokenCommandBuilder.get(
        TokenType.ERC20,
        operationIdMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .txConfig(txConfigMock)
        .recipient(addressMock)
        .amount(amountMock)
        .idempotencyKey(idempotencyKeyMock)
        .build()

      await consumer.onMessage(transferTokenCommand)

      expect(tokensManagerServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.transfer).toHaveBeenCalledWith(
        TokenType.ERC20,
        amountMock,
        addressMock,
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

      const transferTokenCommand = TransferTokenCommandBuilder.get(
        TokenType.ERC721,
        operationIdMock,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
        .txConfig(txConfigMock)
        .recipient(addressMock)
        .tokenId(tokenIdMock)
        .idempotencyKey(idempotencyKeyMock)
        .build()

      await consumer.onMessage(transferTokenCommand)

      expect(tokensManagerServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.transfer).toHaveBeenCalledWith(
        TokenType.ERC721,
        tokenIdMock,
        addressMock,
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
