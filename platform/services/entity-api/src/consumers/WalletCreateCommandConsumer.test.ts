import { IWalletCreateCommand } from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  walletMock,
  subjectMock,
  entityIdMock,
  tenantIdMock,
} from '../../test/mocks'
import { EntityEntity } from '../data/entities/EntityEntity'
import { EntityService } from '../services/EntityService'
import { WalletCreateCommandConsumer } from './WalletCreateCommandConsumer'

describe('WalletCreateCommandConsumer', () => {
  let consumer: WalletCreateCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let entityServiceMock: jest.Mocked<EntityService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    entityServiceMock = createMockInstance(EntityService)

    consumer = new WalletCreateCommandConsumer(loggerMock, entityServiceMock)
  })

  describe('onMessage', () => {
    const walletCreateCommand: IWalletCreateCommand = {
      ...walletMock,
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      metadata: JSON.stringify(walletMock.metadata),
      setAsDefault: true,
      createdBy: subjectMock,
    }

    it('(OK) processes message', async () => {
      entityServiceMock.getById.mockResolvedValueOnce({
        tenantId: tenantIdMock,
      } as EntityEntity)

      await consumer.onMessage(walletCreateCommand)

      expect(entityServiceMock.createWalletForEntity).toHaveBeenCalledWith(
        tenantIdMock,
        {
          ...walletMock,
          entityId: entityIdMock,
          createdBy: subjectMock,
        },
        true,
      )
    })

    it('(OK) logs error when message cannot be processed', async () => {
      entityServiceMock.createWalletForEntity.mockRejectedValueOnce(new Error())

      await consumer.onMessage(walletCreateCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
