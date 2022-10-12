import { IWalletUpdateCommand } from '@codefi-assets-and-payments/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import {
  walletUpdateMock,
  walletAddressMock,
  tenantIdMock,
  entityIdMock,
} from '../../test/mocks'
import { EntityService } from '../services/EntityService'
import { WalletUpdateCommandConsumer } from './WalletUpdateCommandConsumer'

describe('WalletUpdateCommandConsumer', () => {
  let consumer: WalletUpdateCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let entityServiceMock: jest.Mocked<EntityService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    entityServiceMock = createMockInstance(EntityService)

    consumer = new WalletUpdateCommandConsumer(loggerMock, entityServiceMock)
  })

  describe('onMessage', () => {
    const walletUpdateCommand: IWalletUpdateCommand = {
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      address: walletAddressMock,
      metadata: JSON.stringify(walletUpdateMock.metadata),
      setAsDefault: true,
    }

    it('(OK) processes message', async () => {
      await consumer.onMessage(walletUpdateCommand)

      expect(entityServiceMock.updateWalletForEntity).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
        walletUpdateMock,
        true,
      )
    })

    it('(OK) logs error when message cannot be processed', async () => {
      entityServiceMock.updateWalletForEntity.mockRejectedValueOnce(new Error())

      await consumer.onMessage(walletUpdateCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
