import { ITenantCreateCommand } from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  tenantMock,
  initialAdminsMock,
  subjectMock,
  initialEntitiesMock,
  storeMappingsMock,
} from '../../test/mocks'
import { TenantService } from '../services/TenantService'
import { TenantCreateCommandConsumer } from './TenantCreateCommandConsumer'

describe('TenantCreateCommandConsumer', () => {
  let consumer: TenantCreateCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tenantServiceMock: jest.Mocked<TenantService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    tenantServiceMock = createMockInstance(TenantService)

    consumer = new TenantCreateCommandConsumer(loggerMock, tenantServiceMock)
  })

  describe('onMessage', () => {
    const tenantCreateCommand: ITenantCreateCommand = {
      ...tenantMock,
      tenantId: tenantMock.id,
      metadata: JSON.stringify(tenantMock.metadata),
      initialAdmins: initialAdminsMock,
      initialEntities: initialEntitiesMock.map((entity) => ({
        entityId: entity.id,
        name: entity.name,
        metadata: JSON.stringify(entity.metadata || {}),
        initialAdmins: initialAdminsMock,
        initialWallets:
          entity.initialWallets?.map((wallet) => ({
            address: wallet.address,
            type: wallet.type,
            metadata: JSON.stringify(wallet.metadata || {}),
          })) || null,
        defaultWallet: entity.defaultWallet || null,
      })),
      stores: storeMappingsMock,
      createdBy: subjectMock,
    }

    it('(OK) processes message', async () => {
      await consumer.onMessage(tenantCreateCommand)

      expect(tenantServiceMock.create).toHaveBeenCalledWith(
        {
          ...tenantMock,
          initialAdmins: initialAdminsMock,
          initialEntities: initialEntitiesMock.map((entity) => ({
            ...entity,
            metadata: entity.metadata || {},
            initialAdmins: initialAdminsMock,
            defaultWallet: entity.defaultWallet || null,
          })),
          stores: storeMappingsMock,
        },
        subjectMock,
      )
    })

    it('(OK) logs error when message cannot be processed', async () => {
      tenantServiceMock.create.mockRejectedValueOnce(new Error())

      await consumer.onMessage(tenantCreateCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
