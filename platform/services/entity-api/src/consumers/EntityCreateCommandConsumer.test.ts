import { IEntityCreateCommand } from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  entityMock,
  initialAdminsMock,
  initialWalletsMock,
  storeMappingsMock,
  subjectMock,
  tenantIdMock,
  walletAddressMock,
} from '../../test/mocks'
import { EntityService } from '../services/EntityService'
import { EntityCreateCommandConsumer } from './EntityCreateCommandConsumer'

describe('EntityCreateCommandConsumer', () => {
  let consumer: EntityCreateCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let entityServiceMock: jest.Mocked<EntityService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    entityServiceMock = createMockInstance(EntityService)

    consumer = new EntityCreateCommandConsumer(loggerMock, entityServiceMock)
  })

  describe('onMessage', () => {
    const entityCreateCommand: IEntityCreateCommand = {
      ...entityMock,
      entityId: entityMock.id,
      tenantId: tenantIdMock,
      metadata: JSON.stringify(entityMock.metadata),
      initialAdmins: initialAdminsMock,
      initialWallets: initialWalletsMock.map((wallet) => ({
        address: wallet.address || null,
        type: wallet.type,
        metadata: JSON.stringify(wallet.metadata || null),
      })),
      defaultWallet: walletAddressMock,
      createdBy: subjectMock,
      stores: storeMappingsMock,
    }

    it('(OK) processes message', async () => {
      await consumer.onMessage(entityCreateCommand)

      expect(entityServiceMock.create).toHaveBeenCalledWith(
        {
          ...entityMock,
          tenantId: entityCreateCommand.tenantId,
          initialAdmins: initialAdminsMock,
          initialWallets: initialWalletsMock.map((wallet) => ({
            address: wallet.address || null,
            type: wallet.type,
            metadata: wallet.metadata || null,
          })),
          defaultWallet: walletAddressMock,
          stores: storeMappingsMock,
        },
        subjectMock,
      )
    })

    it('(OK) logs error when message cannot be processed', async () => {
      entityServiceMock.create.mockRejectedValueOnce(new Error())

      await consumer.onMessage(entityCreateCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
