import { IEntityUpdateCommand } from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  entityIdMock,
  entityUpdateMock,
  storeMappingsMock,
  tenantIdMock,
  walletAddressMock,
} from '../../test/mocks'
import { EntityService } from '../services/EntityService'
import { EntityUpdateCommandConsumer } from './EntityUpdateCommandConsumer'

describe('EntityUpdateCommandConsumer', () => {
  let consumer: EntityUpdateCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let entityServiceMock: jest.Mocked<EntityService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    entityServiceMock = createMockInstance(EntityService)

    consumer = new EntityUpdateCommandConsumer(loggerMock, entityServiceMock)
  })

  describe('onMessage', () => {
    const entityUpdateCommand: IEntityUpdateCommand = {
      ...entityUpdateMock,
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      defaultWallet: walletAddressMock,
      metadata: JSON.stringify(entityUpdateMock.metadata),
      stores: storeMappingsMock,
    }

    it('(OK) processes message', async () => {
      await consumer.onMessage(entityUpdateCommand)

      expect(entityServiceMock.update).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.update).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        {
          ...entityUpdateMock,
          defaultWallet: walletAddressMock,
          stores: storeMappingsMock,
        },
      )
    })

    it('(OK) logs error when message cannot be processed', async () => {
      entityServiceMock.update.mockRejectedValueOnce(new Error())

      await consumer.onMessage(entityUpdateCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
