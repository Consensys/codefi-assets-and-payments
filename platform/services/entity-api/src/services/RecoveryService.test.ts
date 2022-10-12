import {
  IEntityOperationEvent,
  ITenantOperationEvent,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import { ProductType, WalletType } from '@codefi-assets-and-payments/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { EntityEntity } from '../data/entities/EntityEntity'
import { TenantEntity } from '../data/entities/TenantEntity'
import { WalletEntity } from '../data/entities/WalletEntity'
import { Repository } from 'typeorm'
import {
  entityIdMock,
  storeIdMock,
  tenantIdMock,
  walletAddressMock,
} from '../../test/mocks'
import { RecoveryService } from './RecoveryService'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'

describe('RecoveryService', () => {
  let service: RecoveryService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let walletRepositoryMock: jest.Mocked<Repository<WalletEntity>>
  let entityRepositoryMock: jest.Mocked<Repository<EntityEntity>>
  let tenantRepositoryMock: jest.Mocked<Repository<TenantEntity>>

  const createdAtMock = new Date()
  const metadataMock = { test: 'value' }

  const tenantEventMock = {
    operation: MessageDataOperation.CREATE,
    tenantId: tenantIdMock,
    name: 'tenantName',
    products: {
      [ProductType.assets]: true,
      [ProductType.payments]: true,
      [ProductType.compliance]: false,
      [ProductType.staking]: false,
      [ProductType.workflows]: false,
    },
    defaultNetworkKey: 'TestKey',
    metadata: JSON.stringify(metadataMock),
    createdBy: 'testUser',
    createdAt: createdAtMock.toISOString(),
  } as ITenantOperationEvent

  const entityEventMock = {
    operation: MessageDataOperation.CREATE,
    entityId: entityIdMock,
    tenantId: tenantIdMock,
    name: 'entityName',
    defaultWallet: walletAddressMock,
    metadata: JSON.stringify(metadataMock),
    createdBy: 'testUser',
    createdAt: createdAtMock.toISOString(),
  } as IEntityOperationEvent

  const walletEventMock = {
    operation: MessageDataOperation.CREATE,
    entityId: entityIdMock,
    address: walletAddressMock,
    type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
    storeId: storeIdMock,
    metadata: JSON.stringify(metadataMock),
    createdBy: 'testUser',
    createdAt: createdAtMock.toISOString(),
  } as IWalletOperationEvent

  const expectedTenantEntity = {
    id: tenantEventMock.tenantId,
    name: tenantEventMock.name,
    products: {
      [ProductType.assets]: true,
      [ProductType.payments]: true,
    },
    defaultNetworkKey: tenantEventMock.defaultNetworkKey,
    metadata: metadataMock,
    initialAdmins: [],
    createdBy: tenantEventMock.createdBy,
    createdAt: createdAtMock,
  }

  const expectedEntityEntity = {
    id: entityEventMock.entityId,
    tenantId: entityEventMock.tenantId,
    name: entityEventMock.name,
    metadata: metadataMock,
    initialAdmins: [],
    defaultWallet: entityEventMock.defaultWallet,
    createdBy: entityEventMock.createdBy,
    createdAt: createdAtMock,
  }

  const expectedWalletEntity = {
    address: walletEventMock.address,
    entityId: walletEventMock.entityId,
    tenantId: tenantIdMock,
    type: walletEventMock.type,
    storeId: storeIdMock,
    metadata: metadataMock,
    createdBy: walletEventMock.createdBy,
    createdAt: createdAtMock,
  }

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    walletRepositoryMock = createMockInstance(Repository as any)
    entityRepositoryMock = createMockInstance(Repository as any)
    tenantRepositoryMock = createMockInstance(Repository as any)

    service = new RecoveryService(
      loggerMock,
      walletRepositoryMock,
      entityRepositoryMock,
      tenantRepositoryMock,
    )
  })

  describe('processTenantOperationEvent', () => {
    it('inserts tenant', async () => {
      await service.processTenantOperationEvent(tenantEventMock)
      expect(tenantRepositoryMock.insert).toHaveBeenCalledTimes(1)
      expect(tenantRepositoryMock.insert).toHaveBeenCalledWith(
        expectedTenantEntity,
      )
    })

    it('skips tenant insert if already exists', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        id: tenantEventMock.tenantId,
      } as TenantEntity)
      await service.processTenantOperationEvent(tenantEventMock)
      expect(tenantRepositoryMock.insert).toHaveBeenCalledTimes(0)
    })

    it('updates tenant', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        id: tenantEventMock.tenantId,
      } as TenantEntity)

      await service.processTenantOperationEvent({
        ...tenantEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(tenantRepositoryMock.update).toHaveBeenCalledTimes(1)
      expect(tenantRepositoryMock.update).toHaveBeenCalledWith(
        tenantEventMock.tenantId,
        {
          ...expectedTenantEntity,
          updatedAt: expect.any(Date),
        },
      )
    })

    it('skips tenant update if tenant not found', async () => {
      await service.processTenantOperationEvent({
        ...tenantEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(tenantRepositoryMock.update).toHaveBeenCalledTimes(0)
    })

    it('deletes tenant', async () => {
      tenantRepositoryMock.findOne.mockResolvedValue({
        id: tenantEventMock.tenantId,
      } as TenantEntity)

      await service.processTenantOperationEvent({
        ...tenantEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(tenantRepositoryMock.softDelete).toHaveBeenCalledTimes(1)
      expect(tenantRepositoryMock.softDelete).toHaveBeenCalledWith(
        tenantEventMock.tenantId,
      )
    })

    it('skips tenant delete if already deleted', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        id: tenantEventMock.tenantId,
      } as TenantEntity)

      await service.processTenantOperationEvent({
        ...tenantEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(tenantRepositoryMock.softDelete).toHaveBeenCalledTimes(0)
    })
  })

  describe('processEntityOperationEvent', () => {
    it('inserts entity', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        id: entityEventMock.tenantId,
      } as TenantEntity)

      await service.processEntityOperationEvent(entityEventMock)

      expect(entityRepositoryMock.insert).toHaveBeenCalledTimes(1)
      expect(entityRepositoryMock.insert).toHaveBeenCalledWith(
        expectedEntityEntity,
      )
    })

    it('throws when inserting entity if tenant not found', async () => {
      await expect(
        service.processEntityOperationEvent(entityEventMock),
      ).rejects.toThrowError(
        new EntityNotFoundException(
          LocalErrorName.EntityNotFoundException,
          `Cannot find tenant '${entityEventMock.tenantId}' for entity: ${entityEventMock.name}`,
          { event: entityEventMock },
        ),
      )
    })

    it('skips entity insert if already exists', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        id: entityEventMock.entityId,
      } as EntityEntity)
      await service.processEntityOperationEvent(entityEventMock)
      expect(entityRepositoryMock.insert).toHaveBeenCalledTimes(0)
    })

    it('updates entity', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        id: entityEventMock.entityId,
      } as EntityEntity)

      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        id: entityEventMock.tenantId,
      } as TenantEntity)

      await service.processEntityOperationEvent({
        ...entityEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(1)
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        entityEventMock.entityId,
        {
          ...expectedEntityEntity,
          updatedAt: expect.any(Date),
        },
      )
    })

    it('skips entity update if entity not found', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        id: entityEventMock.tenantId,
      } as TenantEntity)

      await service.processEntityOperationEvent({
        ...entityEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(0)
    })

    it('throws when updating entity if tenant not found', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        id: entityEventMock.entityId,
      } as EntityEntity)

      await expect(
        service.processEntityOperationEvent({
          ...entityEventMock,
          operation: MessageDataOperation.UPDATE,
        }),
      ).rejects.toThrowError(
        new EntityNotFoundException(
          LocalErrorName.EntityNotFoundException,
          `Cannot find tenant '${entityEventMock.tenantId}' for entity: ${entityEventMock.name}`,
          { event: entityEventMock },
        ),
      )
    })

    it('deletes entity', async () => {
      entityRepositoryMock.findOne.mockResolvedValue({
        id: entityEventMock.tenantId,
      } as EntityEntity)

      await service.processEntityOperationEvent({
        ...entityEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(entityRepositoryMock.softDelete).toHaveBeenCalledTimes(1)
      expect(entityRepositoryMock.softDelete).toHaveBeenCalledWith(
        entityEventMock.entityId,
      )
    })

    it('skips entity delete if already deleted', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        id: entityEventMock.entityId,
      } as EntityEntity)

      await service.processEntityOperationEvent({
        ...entityEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(entityRepositoryMock.softDelete).toHaveBeenCalledTimes(0)
    })
  })

  describe('processWalletOperationEvent', () => {
    it('inserts wallet', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        id: walletEventMock.entityId,
        tenantId: tenantIdMock,
      } as EntityEntity)

      await service.processWalletOperationEvent(walletEventMock)

      expect(walletRepositoryMock.insert).toHaveBeenCalledTimes(1)
      expect(walletRepositoryMock.insert).toHaveBeenCalledWith(
        expectedWalletEntity,
      )
    })

    it('skips wallet insert if already exists', async () => {
      walletRepositoryMock.findOne.mockResolvedValueOnce({
        address: walletEventMock.address,
      } as WalletEntity)
      await service.processWalletOperationEvent(walletEventMock)
      expect(walletRepositoryMock.insert).toHaveBeenCalledTimes(0)
    })

    it('throws when inserting wallet if entity not found', async () => {
      await expect(
        service.processWalletOperationEvent(walletEventMock),
      ).rejects.toThrowError(
        new EntityNotFoundException(
          LocalErrorName.EntityNotFoundException,
          `Cannot find entity '${walletEventMock.entityId}' for wallet: ${walletEventMock.address}`,
          { event: entityEventMock },
        ),
      )
    })

    it('updates wallet', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        id: walletEventMock.entityId,
        tenantId: tenantIdMock,
      } as EntityEntity)

      walletRepositoryMock.findOne.mockResolvedValueOnce({
        address: walletEventMock.address,
      } as WalletEntity)

      await service.processWalletOperationEvent({
        ...walletEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(walletRepositoryMock.update).toHaveBeenCalledTimes(1)
      expect(walletRepositoryMock.update).toHaveBeenCalledWith(
        walletEventMock.address,
        {
          ...expectedWalletEntity,
          updatedAt: expect.any(Date),
        },
      )
    })

    it('skips wallet update if wallet not found', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        id: walletEventMock.entityId,
        tenantId: tenantIdMock,
      } as EntityEntity)

      await service.processWalletOperationEvent({
        ...walletEventMock,
        operation: MessageDataOperation.UPDATE,
      })

      expect(walletRepositoryMock.update).toHaveBeenCalledTimes(0)
    })

    it('throws when updating wallet if entity not found', async () => {
      walletRepositoryMock.findOne.mockResolvedValueOnce({
        address: walletEventMock.address,
      } as WalletEntity)

      await expect(
        service.processWalletOperationEvent({
          ...walletEventMock,
          operation: MessageDataOperation.UPDATE,
        }),
      ).rejects.toThrowError(
        new EntityNotFoundException(
          LocalErrorName.EntityNotFoundException,
          `Cannot find entity '${walletEventMock.entityId}' for wallet: ${walletEventMock.address}`,
          { event: entityEventMock },
        ),
      )
    })

    it('deletes wallet', async () => {
      walletRepositoryMock.findOne.mockResolvedValue({
        address: walletEventMock.address,
      } as WalletEntity)

      await service.processWalletOperationEvent({
        ...walletEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(walletRepositoryMock.softDelete).toHaveBeenCalledTimes(1)
      expect(walletRepositoryMock.softDelete).toHaveBeenCalledWith(
        walletEventMock.address,
      )
    })

    it('skips wallet delete if already deleted', async () => {
      walletRepositoryMock.findOne.mockResolvedValueOnce({
        address: walletEventMock.address,
      } as WalletEntity)

      await service.processWalletOperationEvent({
        ...walletEventMock,
        operation: MessageDataOperation.DELETE,
      })

      expect(walletRepositoryMock.softDelete).toHaveBeenCalledTimes(0)
    })
  })
})
