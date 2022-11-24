import { EntityOperationEventConsumer } from './EntityOperationEventConsumer'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  entityOperationEventMock,
  legalEntityMock,
  subjectMock,
  tenantEntityMock,
  tenantIdMock,
} from '../../test/mocks'
import createMockInstance from 'jest-create-mock-instance'
import { LegalEntityService } from '../services/LegalEntityService'
import { MessageDataOperation } from '@consensys/messaging-events'
import { TenantService } from '../services/TenantService'

describe('EntityOperationEventConsumer', () => {
  let entityOperationEventConsumer: EntityOperationEventConsumer
  let logger: jest.Mocked<NestJSPinoLogger>
  let legalEntityService: jest.Mocked<LegalEntityService>
  let tenantServiceMock: jest.Mocked<TenantService>

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    legalEntityService = createMockInstance(LegalEntityService)
    tenantServiceMock = createMockInstance(TenantService)

    tenantServiceMock.findOne.mockImplementationOnce(
      async () => tenantEntityMock,
    )

    entityOperationEventConsumer = new EntityOperationEventConsumer(
      logger,
      legalEntityService,
      tenantServiceMock,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('CREATE', () => {
    it('(OK) on event cache entity created', async () => {
      legalEntityService.findOne.mockImplementationOnce(async () => undefined)

      await entityOperationEventConsumer.onMessage(entityOperationEventMock)

      expect(legalEntityService.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityService.findOne).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })

      expect(legalEntityService.create).toHaveBeenCalledTimes(1)
      expect(legalEntityService.create).toHaveBeenCalledWith(
        entityOperationEventMock.entityId,
        entityOperationEventMock.name,
        entityOperationEventMock.defaultWallet,
        tenantEntityMock.defaultNetworkKey,
        entityOperationEventMock.tenantId,
        true,
        subjectMock,
        expect.any(Date),
        JSON.stringify({ tenantId: tenantIdMock }),
      )
    })

    it('(OK) on event entity already exists. Skipping...', async () => {
      legalEntityService.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )

      await entityOperationEventConsumer.onMessage(entityOperationEventMock)

      expect(legalEntityService.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityService.findOne).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })

      expect(legalEntityService.create).toHaveBeenCalledTimes(0)
    })
  })
  describe('UPDATE', () => {
    it('(OK) on event cache entity updated', async () => {
      legalEntityService.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )

      await entityOperationEventConsumer.onMessage({
        ...entityOperationEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(legalEntityService.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityService.findOne).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })

      expect(legalEntityService.update).toHaveBeenCalledTimes(1)
      expect(legalEntityService.update).toHaveBeenCalledWith(
        { id: entityOperationEventMock.entityId },
        {
          id: entityOperationEventMock.entityId,
          legalEntityName: entityOperationEventMock.name,
          ethereumAddress: entityOperationEventMock.defaultWallet,
          tenantId: entityOperationEventMock.tenantId,
          issuer: true,
          createdBy: entityOperationEventMock.createdBy,
          createdAt: new Date(entityOperationEventMock.createdAt),
          metadata: entityOperationEventMock.metadata,
        },
      )
    })

    it('(OK) on event entity does not exists. Throw to reprocess...', async () => {
      legalEntityService.findOne.mockReset()
      legalEntityService.findOne.mockImplementationOnce(async () => undefined)

      await expect(
        entityOperationEventConsumer.onMessage({
          ...entityOperationEventMock,
          operation: MessageDataOperation.UPDATE,
        }),
      ).rejects.toThrowError()

      expect(legalEntityService.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityService.findOne).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })

      expect(legalEntityService.update).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) failed to cache entityOperationEvent', async () => {
      legalEntityService.update.mockImplementation(() => {
        throw new Error('error updating entity')
      })

      await expect(
        entityOperationEventConsumer.onMessage({
          ...entityOperationEventMock,
          operation: MessageDataOperation.UPDATE,
        }),
      ).rejects.toThrowError()

      expect(legalEntityService.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityService.findOne).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })
      expect(legalEntityService.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('DELETE', () => {
    it('(OK) on event delete entity', async () => {
      legalEntityService.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )

      await entityOperationEventConsumer.onMessage({
        ...entityOperationEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(legalEntityService.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityService.findOne).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })

      expect(legalEntityService.delete).toHaveBeenCalledTimes(1)
      expect(legalEntityService.delete).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })
    })

    it('(OK) on event entity does not exists. Skipping...', async () => {
      legalEntityService.findOne.mockReset()
      legalEntityService.findOne.mockImplementationOnce(async () => undefined)

      await expect(
        entityOperationEventConsumer.onMessage({
          ...entityOperationEventMock,
          operation: MessageDataOperation.DELETE,
        }),
      ).rejects.toThrowError()

      expect(legalEntityService.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityService.findOne).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })

      expect(legalEntityService.delete).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) failed to cache entityOperationEvent', async () => {
      legalEntityService.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )
      legalEntityService.delete.mockImplementation(() => {
        throw new Error('error deleting entity')
      })

      await expect(
        entityOperationEventConsumer.onMessage({
          ...entityOperationEventMock,
          operation: MessageDataOperation.DELETE,
        }),
      ).rejects.toThrowError()

      expect(legalEntityService.findOne).toHaveBeenCalledTimes(1)
      expect(legalEntityService.findOne).toHaveBeenCalledWith({
        id: entityOperationEventMock.entityId,
      })
      expect(legalEntityService.delete).toHaveBeenCalledTimes(1)
    })
  })
  it('(OK) unknown operation', async () => {
    legalEntityService.findOne.mockImplementationOnce(
      async () => legalEntityMock,
    )

    await entityOperationEventConsumer.onMessage({
      ...entityOperationEventMock,
      operation: undefined,
    })

    expect(legalEntityService.findOne).toHaveBeenCalledTimes(0)

    expect(legalEntityService.create).toHaveBeenCalledTimes(0)
    expect(legalEntityService.update).toHaveBeenCalledTimes(0)
    expect(legalEntityService.delete).toHaveBeenCalledTimes(0)
  })
})
