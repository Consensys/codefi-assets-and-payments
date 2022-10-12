import { IWalletDeleteCommand } from '@codefi-assets-and-payments/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { entityIdMock, tenantIdMock, walletAddressMock } from '../../test/mocks'
import { WalletService } from '../services/WalletService'
import { WalletDeleteCommandConsumer } from './WalletDeleteCommandConsumer'

describe('WalletDeleteCommandConsumer', () => {
  let consumer: WalletDeleteCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let walletServiceMock: jest.Mocked<WalletService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    walletServiceMock = createMockInstance(WalletService)

    consumer = new WalletDeleteCommandConsumer(loggerMock, walletServiceMock)
  })

  describe('onMessage', () => {
    const walletDeleteCommand: IWalletDeleteCommand = {
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      address: walletAddressMock,
    }

    it('(OK) processes message', async () => {
      await consumer.onMessage(walletDeleteCommand)

      expect(walletServiceMock.delete).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
      )
    })

    it('(OK) logs error when message cannot be processed', async () => {
      walletServiceMock.delete.mockRejectedValueOnce(new Error())

      await consumer.onMessage(walletDeleteCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
