import { M2mTokenService } from '@consensys/auth'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'

import {
  authHeadersMock,
  authTokenMock,
  createMockLogger,
  deployTokenCommandMock,
} from '../../test/mocks'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { DeployTokenCommandConsumer } from './DeployTokenCommandConsumer'

describe('deployTokenCommandConsumer', () => {
  let consumer: DeployTokenCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensManagerServiceMock: jest.Mocked<TokensManagerService>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let eventsServiceMock: jest.Mocked<EventsService>

  beforeEach(() => {
    tokensManagerServiceMock = createMockInstance(TokensManagerService)
    loggerMock = createMockLogger()
    m2mTokenServiceMock = createMockInstance(M2mTokenService)
    eventsServiceMock = createMockInstance(EventsService)

    consumer = new DeployTokenCommandConsumer(
      tokensManagerServiceMock,
      loggerMock,
      m2mTokenServiceMock,
      eventsServiceMock,
    )
  })

  describe('onMessage', () => {
    it('deploys token', async () => {
      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(authTokenMock)

      await consumer.onMessage(deployTokenCommandMock)

      expect(tokensManagerServiceMock.deploy).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.deploy).toHaveBeenCalledWith(
        { ...deployTokenCommandMock, config: deployTokenCommandMock.txConfig },
        deployTokenCommandMock.tenantId,
        deployTokenCommandMock.entityId,
        deployTokenCommandMock.subject,
        authTokenMock,
        authHeadersMock,
      )
    })
  })
})
