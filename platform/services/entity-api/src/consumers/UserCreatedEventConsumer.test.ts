import { IUserCreatedEvent } from '@codefi-assets-and-payments/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { entityIdMock, tenantIdMock } from '../../test/mocks'
import { EntityService } from '../services/EntityService'
import { TenantService } from '../services/TenantService'
import { UserCreatedEventConsumer } from './UserCreatedEventConsumer'

describe('UserCreatedEventConsumer', () => {
  let consumer: UserCreatedEventConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tenantServiceMock: jest.Mocked<TenantService>
  let entityServiceMock: jest.Mocked<EntityService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    tenantServiceMock = createMockInstance(TenantService)
    entityServiceMock = createMockInstance(EntityService)

    consumer = new UserCreatedEventConsumer(
      loggerMock,
      tenantServiceMock,
      entityServiceMock,
    )
  })

  describe('onMessage', () => {
    it('(OK) processes message', async () => {
      const userCreatedEvent = {
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        email: 'email',
        name: 'Admin Name',
      } as IUserCreatedEvent

      await consumer.onMessage(userCreatedEvent)

      expect(tenantServiceMock.updateAdminStatus).toHaveBeenCalledWith(
        userCreatedEvent.tenantId,
        userCreatedEvent.email,
        userCreatedEvent.name,
      )
      expect(entityServiceMock.updateAdminStatus).toHaveBeenCalledWith(
        userCreatedEvent.tenantId,
        userCreatedEvent.entityId,
        userCreatedEvent.email,
        userCreatedEvent.name,
      )
    })

    it('(OK) logs error when processing message throws', async () => {
      const userCreatedEvent = {
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        email: 'email',
        name: 'Admin Name',
      } as IUserCreatedEvent

      entityServiceMock.updateAdminStatus.mockRejectedValueOnce(new Error())

      await consumer.onMessage(userCreatedEvent)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
