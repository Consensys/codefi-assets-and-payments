import { ITenantUpdateCommand } from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  storeMappingsMock,
  tenantIdMock,
  tenantUpdateMock,
} from '../../test/mocks'
import { TenantService } from '../services/TenantService'
import { TenantUpdateCommandConsumer } from './TenantUpdateCommandConsumer'

describe('TenantUpdateCommandConsumer', () => {
  let consumer: TenantUpdateCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tenantServiceMock: jest.Mocked<TenantService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    tenantServiceMock = createMockInstance(TenantService)

    consumer = new TenantUpdateCommandConsumer(loggerMock, tenantServiceMock)
  })

  describe('onMessage', () => {
    const tenantUpdateCommand: ITenantUpdateCommand = {
      ...tenantUpdateMock,
      tenantId: tenantIdMock,
      metadata: JSON.stringify(tenantUpdateMock.metadata),
      stores: storeMappingsMock,
    }

    it('(OK) processes message', async () => {
      await consumer.onMessage(tenantUpdateCommand)

      expect(tenantServiceMock.update).toHaveBeenCalledWith(tenantIdMock, {
        ...tenantUpdateMock,
        stores: storeMappingsMock,
      })
    })

    it('(OK) logs error when message cannot be processed', async () => {
      tenantServiceMock.update.mockRejectedValueOnce(new Error())

      await consumer.onMessage(tenantUpdateCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
