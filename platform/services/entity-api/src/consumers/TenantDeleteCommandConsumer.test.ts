import { ITenantDeleteCommand } from '@codefi-assets-and-payments/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { tenantIdMock } from '../../test/mocks'
import { TenantService } from '../services/TenantService'
import { TenantDeleteCommandConsumer } from './TenantDeleteCommandConsumer'

describe('TenantDeleteCommandConsumer', () => {
  let consumer: TenantDeleteCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tenantServiceMock: jest.Mocked<TenantService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    tenantServiceMock = createMockInstance(TenantService)

    consumer = new TenantDeleteCommandConsumer(loggerMock, tenantServiceMock)
  })

  describe('onMessage', () => {
    const tenantDeleteCommand: ITenantDeleteCommand = {
      tenantId: tenantIdMock,
    }

    it('(OK) processes message', async () => {
      await consumer.onMessage(tenantDeleteCommand)

      expect(tenantServiceMock.delete).toHaveBeenCalledWith(tenantIdMock)
    })

    it('(OK) logs error when message cannot be processed', async () => {
      tenantServiceMock.delete.mockRejectedValueOnce(new Error())

      await consumer.onMessage(tenantDeleteCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
