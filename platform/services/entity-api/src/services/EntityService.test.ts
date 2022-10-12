import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Repository, UpdateResult } from 'typeorm'
import { EntityService, ENTITY_ADMIN_ROLE } from './EntityService'
import { EntityEntity } from '../data/entities/EntityEntity'
import {
  entityIdMock,
  entityMock,
  entityUpdateMock,
  initialAdminsMock,
  initialWalletsMock,
  storeMappingsMock,
  subjectMock,
  tenantIdMock,
  walletAddressMock,
  walletAddressMock3,
  walletAddressWithoutChecksumMock,
  walletMock,
  walletUpdateMock,
} from '../../test/mocks'
import { AdminApiService } from './AdminApiService'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import { WalletService } from './WalletService'
import {
  EntityCreateRequest,
  EntityStatus,
  EntityUpdateRequest,
  WalletType,
} from '@codefi-assets-and-payments/ts-types'
import {
  Commands,
  Events,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import { WalletEntity } from '../data/entities/WalletEntity'
import {
  EntityNotFoundException,
  ValidationException,
} from '@codefi-assets-and-payments/error-handler'
import { StoreService } from './StoreService'

describe('EntityService', () => {
  let service: EntityService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let entityRepositoryMock: jest.Mocked<Repository<EntityEntity>>
  let walletServiceMock: jest.Mocked<WalletService>
  let adminApiServiceMock: jest.Mocked<AdminApiService>
  let storeServiceMock: jest.Mocked<StoreService>
  let kafkaProducerMock: jest.Mocked<KafkaProducer>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    entityRepositoryMock = createMockInstance(Repository as any)
    walletServiceMock = createMockInstance(WalletService)
    adminApiServiceMock = createMockInstance(AdminApiService)
    storeServiceMock = createMockInstance(StoreService)
    kafkaProducerMock = createMockInstance(KafkaProducer)

    service = new EntityService(
      loggerMock,
      entityRepositoryMock,
      walletServiceMock,
      adminApiServiceMock,
      storeServiceMock,
      kafkaProducerMock,
    )
  })

  describe('getAll', () => {
    it('(OK) success', async () => {
      const filter = {}

      const findResult = [[], 0]
      entityRepositoryMock.findAndCount.mockResolvedValueOnce(findResult as any)

      const result = await service.getAll(filter)

      expect(result).toBe(findResult)
      expect(entityRepositoryMock.findAndCount).toHaveBeenCalledWith(filter)
    })

    it('(OK) success with wallets included', async () => {
      const filter = {}

      const findResult = [[], 0]
      entityRepositoryMock.findAndCount.mockResolvedValueOnce(findResult as any)

      const result = await service.getAll(filter, true)

      expect(result).toBe(findResult)
      expect(entityRepositoryMock.findAndCount).toHaveBeenCalledWith({
        ...filter,
        relations: ['wallets'],
      })
    })
  })

  describe('getById', () => {
    it('(OK) succeeds if entity exists', async () => {
      const findOneResult = {}
      entityRepositoryMock.findOne.mockResolvedValueOnce(
        findOneResult as EntityEntity,
      )

      const result = await service.getById(tenantIdMock, entityIdMock)

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        undefined,
      )
    })

    it('(OK) succeeds if entity exists with wallets included', async () => {
      const findOneResult = {}
      entityRepositoryMock.findOne.mockResolvedValueOnce(
        findOneResult as EntityEntity,
      )

      const result = await service.getById(tenantIdMock, entityIdMock, true)

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        {
          relations: ['wallets'],
        },
      )
    })

    it('(FAIL) throws if entity does not exist', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.getById(tenantIdMock, entityIdMock),
      ).rejects.toThrowError(EntityNotFoundException)

      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        undefined,
      )
    })
  })

  describe('create', () => {
    it('(OK) creates entity without initial admins or wallets', async () => {
      const entityRequest: EntityCreateRequest & { tenantId: string } = {
        tenantId: tenantIdMock,
        name: entityMock.name,
      }

      const walletCreateResult = { address: walletAddressMock }
      walletServiceMock.create.mockResolvedValueOnce(
        walletCreateResult as WalletEntity,
      )

      const findOneResult = {
        ...entityMock,
        tenantId: entityRequest.tenantId,
        metadata: {},
        initialAdmins: [],
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValue(findOneResult)

      const result = await service.create(entityRequest, subjectMock)

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.insert).toHaveBeenCalledWith({
        id: expect.any(String),
        tenantId: entityRequest.tenantId,
        name: entityMock.name,
        metadata: {},
        initialAdmins: [],
        defaultWallet: '',
        createdBy: subjectMock,
      })
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: expect.any(String) },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      expect(walletServiceMock.create).toHaveBeenCalledWith(
        entityRequest.tenantId,
        {
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          entityId: expect.any(String),
          createdBy: subjectMock,
        },
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: expect.any(String) },
        { defaultWallet: walletCreateResult.address },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: expect.any(String) },
        undefined,
      )
      expect(adminApiServiceMock.createAdmins).toHaveBeenCalledWith(
        [],
        [ENTITY_ADMIN_ROLE],
        findOneResult.tenantId,
        expect.any(String),
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: expect.any(String) },
        undefined,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(3)
    })

    it('(OK) creates entity with initial admins, initial wallets, and stores', async () => {
      const entityRequest: EntityCreateRequest & { tenantId: string } = {
        ...entityMock,
        tenantId: tenantIdMock,
        initialAdmins: initialAdminsMock,
        initialWallets: initialWalletsMock,
        defaultWallet: walletAddressMock,
        stores: storeMappingsMock,
      }

      walletServiceMock.create.mockImplementation((tenantId, wallet) =>
        Promise.resolve({
          address: wallet.address,
        } as WalletEntity),
      )

      const findOneResult = {
        ...entityMock,
        tenantId: entityRequest.tenantId,
        initialAdmins: initialAdminsMock.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValue(findOneResult)

      const result = await service.create(entityRequest, subjectMock)

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.insert).toHaveBeenCalledWith({
        ...entityMock,
        tenantId: entityRequest.tenantId,
        initialAdmins: initialAdminsMock.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
        defaultWallet: '',
        createdBy: subjectMock,
      })
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      for (const wallet of initialWalletsMock) {
        expect(walletServiceMock.create).toHaveBeenCalledWith(tenantIdMock, {
          ...wallet,
          entityId: entityRequest.id,
          createdBy: subjectMock,
        })
      }
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        { defaultWallet: entityRequest.defaultWallet },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(adminApiServiceMock.createAdmins).toHaveBeenCalledWith(
        findOneResult.initialAdmins,
        [ENTITY_ADMIN_ROLE],
        entityRequest.tenantId,
        entityRequest.id,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(3)
      expect(storeServiceMock.setEntityMappings).toHaveBeenCalledWith(
        storeMappingsMock,
        tenantIdMock,
        entityIdMock,
      )
    })

    it('(OK) creates entity with initial wallets without passing a default', async () => {
      const entityRequest: EntityCreateRequest & { tenantId: string } = {
        ...entityMock,
        tenantId: tenantIdMock,
        initialWallets: initialWalletsMock,
      }

      walletServiceMock.create.mockImplementation((tenantId, wallet) =>
        Promise.resolve({
          address: wallet.address,
        } as WalletEntity),
      )

      const findOneResult = {
        ...entityMock,
        tenantId: entityRequest.tenantId,
        initialAdmins: [],
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValue(findOneResult)

      const result = await service.create(entityRequest, subjectMock)

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.insert).toHaveBeenCalledWith({
        ...entityMock,
        tenantId: entityRequest.tenantId,
        initialAdmins: [],
        defaultWallet: '',
        createdBy: subjectMock,
      })
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      for (const wallet of initialWalletsMock) {
        expect(walletServiceMock.create).toHaveBeenCalledWith(
          entityRequest.tenantId,
          {
            ...wallet,
            entityId: entityRequest.id,
            createdBy: subjectMock,
          },
        )
      }
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        { defaultWallet: entityRequest.initialWallets[0].address },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(3)
    })

    it('(OK) creates entity with checksum default wallet and non-checksum address in wallets', async () => {
      const entityRequest: EntityCreateRequest & { tenantId: string } = {
        ...entityMock,
        tenantId: tenantIdMock,
        initialAdmins: initialAdminsMock,
        initialWallets: [
          initialWalletsMock[0],
          {
            ...initialWalletsMock[1],
            address: walletAddressWithoutChecksumMock,
          },
          initialWalletsMock[2],
        ],
        defaultWallet: walletAddressMock,
      }

      walletServiceMock.create.mockImplementation((tenantId, wallet) =>
        Promise.resolve({
          address: wallet.address,
        } as WalletEntity),
      )

      const findOneResult = {
        ...entityMock,
        tenantId: entityRequest.tenantId,
        initialAdmins: initialAdminsMock.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValue(findOneResult)

      const result = await service.create(entityRequest, subjectMock)

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.insert).toHaveBeenCalledWith({
        ...entityMock,
        tenantId: entityRequest.tenantId,
        initialAdmins: initialAdminsMock.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
        defaultWallet: '',
        createdBy: subjectMock,
      })
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      for (const wallet of initialWalletsMock) {
        expect(walletServiceMock.create).toHaveBeenCalledWith(tenantIdMock, {
          ...wallet,
          entityId: entityRequest.id,
          createdBy: subjectMock,
        })
      }
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        { defaultWallet: entityRequest.defaultWallet },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(adminApiServiceMock.createAdmins).toHaveBeenCalledWith(
        findOneResult.initialAdmins,
        [ENTITY_ADMIN_ROLE],
        entityRequest.tenantId,
        entityRequest.id,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: entityRequest.tenantId, id: entityRequest.id },
        undefined,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(3)
    })

    it('(FAIL) throws when default wallet given with no initial wallets', async () => {
      const entityRequest: EntityCreateRequest & { tenantId: string } = {
        ...entityMock,
        tenantId: tenantIdMock,
        defaultWallet: walletAddressMock,
      }

      await expect(
        service.create(entityRequest, subjectMock),
      ).rejects.toThrowError(ValidationException)
      expect(entityRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(walletServiceMock.create).toHaveBeenCalledTimes(0)
      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(0)
      expect(adminApiServiceMock.createAdmins).toHaveBeenCalledTimes(0)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) throws when default wallet given not part of initial wallets array', async () => {
      const entityRequest: EntityCreateRequest & { tenantId: string } = {
        ...entityMock,
        tenantId: tenantIdMock,
        initialWallets: initialWalletsMock,
        defaultWallet: walletAddressMock3,
      }

      await expect(
        service.create(entityRequest, subjectMock),
      ).rejects.toThrowError(ValidationException)
      expect(entityRepositoryMock.insert).toHaveBeenCalledTimes(0)
      expect(walletServiceMock.create).toHaveBeenCalledTimes(0)
      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(0)
      expect(adminApiServiceMock.createAdmins).toHaveBeenCalledTimes(0)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('update', () => {
    it('(OK) updates entity', async () => {
      const entityUpdateRequest: EntityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet: walletAddressMock,
      }

      const findOneResult = {
        ...entityMock,
        tenantId: tenantIdMock,
        wallets: initialWalletsMock,
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValue(findOneResult)

      const result = await service.update(
        tenantIdMock,
        entityIdMock,
        entityUpdateRequest,
      )

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        entityUpdateRequest,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) updates entity with stores', async () => {
      const entityUpdateRequest: EntityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet: walletAddressMock,
        stores: storeMappingsMock,
      }

      const findOneResult = {
        ...entityMock,
        tenantId: tenantIdMock,
        wallets: initialWalletsMock,
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValue(findOneResult)

      const result = await service.update(
        tenantIdMock,
        entityIdMock,
        entityUpdateRequest,
      )

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { ...entityUpdateRequest, stores: undefined },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      expect(storeServiceMock.setEntityMappings).toHaveBeenCalledWith(
        storeMappingsMock,
        tenantIdMock,
        entityIdMock,
        {
          removeExisting: true,
        },
      )
    })

    it('(OK) updates entity with non-checksum default wallet and checksum address in wallets', async () => {
      const entityUpdateRequest: EntityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet: walletAddressWithoutChecksumMock,
      }

      const findOneResult = {
        ...entityMock,
        tenantId: tenantIdMock,
        wallets: initialWalletsMock,
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValue(findOneResult)

      const result = await service.update(
        tenantIdMock,
        entityIdMock,
        entityUpdateRequest,
      )

      expect(result).toBe(findOneResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        entityUpdateRequest,
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) updates wallet and sets it as default with checksum address given non-checksum address', async () => {
      walletServiceMock.update.mockResolvedValueOnce({
        ...walletMock,
        ...walletUpdateMock,
        entityId: entityIdMock,
      } as WalletEntity)

      const findOneResult = {
        ...entityMock,
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValueOnce(findOneResult)

      const result = await service.updateWalletForEntity(
        tenantIdMock,
        entityIdMock,
        walletAddressWithoutChecksumMock,
        walletUpdateMock,
        true,
      )

      expect(result).toEqual({
        ...walletMock,
        ...walletUpdateMock,
        entityId: entityIdMock,
      })
      expect(walletServiceMock.update).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        walletAddressWithoutChecksumMock,
        walletUpdateMock,
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { defaultWallet: walletAddressMock },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })

    it('(FAIL) throws if entity does not exist', async () => {
      const entityUpdateRequest: EntityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet: walletAddressMock,
      }

      entityRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.update(tenantIdMock, entityIdMock, entityUpdateRequest),
      ).rejects.toThrowError(EntityNotFoundException)

      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })

    it('(FAIL) throws when default wallet given not part of wallets array', async () => {
      const entityUpdateRequest: EntityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet: walletAddressMock3,
      }

      const findOneResult = {
        wallets: initialWalletsMock,
      }
      entityRepositoryMock.findOne.mockResolvedValue(
        findOneResult as EntityEntity,
      )

      await expect(
        service.update(tenantIdMock, entityIdMock, entityUpdateRequest),
      ).rejects.toThrowError(ValidationException)

      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('delete', () => {
    it('(OK) deletes entity', async () => {
      const findOneResult = {
        ...entityMock,
        wallets: initialWalletsMock,
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValueOnce(findOneResult)
      const softDeleteResult = {}
      entityRepositoryMock.softDelete.mockResolvedValueOnce(
        softDeleteResult as UpdateResult,
      )

      const result = await service.delete(tenantIdMock, entityIdMock)

      expect(result).toBe(softDeleteResult)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(entityRepositoryMock.softDelete).toHaveBeenCalledWith({
        tenantId: tenantIdMock,
        id: entityIdMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.DELETE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      for (const wallet of findOneResult.wallets) {
        expect(kafkaProducerMock.send).toHaveBeenCalledWith(
          Commands.walletDeleteCommand,
          {
            tenantId: tenantIdMock,
            entityId: entityIdMock,
            address: wallet.address,
          },
        )
      }
      expect(storeServiceMock.setEntityMappings).toHaveBeenCalledWith(
        [],
        tenantIdMock,
        entityIdMock,
        { removeExisting: true },
      )
    })

    it('(FAIL) throws if entity does not exist', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.delete(tenantIdMock, entityIdMock),
      ).rejects.toThrowError(EntityNotFoundException)

      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { relations: ['wallets'] },
      )
      expect(entityRepositoryMock.softDelete).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('createWalletForEntity', () => {
    it('(OK) creates wallet and sets it as default', async () => {
      const createWalletRequest = {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
      }

      walletServiceMock.create.mockResolvedValueOnce(
        createWalletRequest as WalletEntity,
      )

      const findOneResult = {
        ...entityMock,
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValueOnce(findOneResult)

      const result = await service.createWalletForEntity(
        tenantIdMock,
        createWalletRequest,
        true,
      )

      expect(result).toEqual(createWalletRequest)
      expect(walletServiceMock.create).toHaveBeenCalledWith(
        tenantIdMock,
        createWalletRequest,
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { defaultWallet: createWalletRequest.address },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) creates wallet without setting it as default', async () => {
      const createWalletRequest = {
        ...walletMock,
        entityId: entityIdMock,
        createdBy: subjectMock,
      }

      walletServiceMock.create.mockResolvedValueOnce(
        createWalletRequest as WalletEntity,
      )

      const result = await service.createWalletForEntity(
        tenantIdMock,
        createWalletRequest,
        false,
      )

      expect(result).toEqual(createWalletRequest)
      expect(walletServiceMock.create).toHaveBeenCalledWith(
        tenantIdMock,
        createWalletRequest,
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(0)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('updateWalletForEntity', () => {
    it('(OK) updates wallet and sets it as default', async () => {
      walletServiceMock.update.mockResolvedValueOnce({
        ...walletMock,
        ...walletUpdateMock,
        entityId: entityIdMock,
      } as WalletEntity)

      const findOneResult = {
        ...entityMock,
        defaultWallet: walletAddressMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValueOnce(findOneResult)

      const result = await service.updateWalletForEntity(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
        walletUpdateMock,
        true,
      )

      expect(result).toEqual({
        ...walletMock,
        ...walletUpdateMock,
        entityId: entityIdMock,
      })
      expect(walletServiceMock.update).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
        walletUpdateMock,
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        { defaultWallet: walletAddressMock },
      )
      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.entityOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          entityId: findOneResult.id,
          tenantId: findOneResult.tenantId,
          name: findOneResult.name,
          defaultWallet: findOneResult.defaultWallet,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) updates wallet without setting it as default', async () => {
      walletServiceMock.update.mockResolvedValueOnce({
        ...walletMock,
        ...walletUpdateMock,
        entityId: entityIdMock,
      } as WalletEntity)

      const result = await service.updateWalletForEntity(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
        walletUpdateMock,
        false,
      )

      expect(result).toEqual({
        ...walletMock,
        ...walletUpdateMock,
        entityId: entityIdMock,
      })
      expect(walletServiceMock.update).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        walletAddressMock,
        walletUpdateMock,
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(0)
      expect(entityRepositoryMock.findOne).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('updateAdminStatus', () => {
    it('(OK) updates status of the admin', async () => {
      const adminUpdatedIndex = 0
      const adminEmail = initialAdminsMock[adminUpdatedIndex].email
      const adminName = initialAdminsMock[adminUpdatedIndex].name
      const findOneResult = {
        initialAdmins: initialAdminsMock.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValueOnce(findOneResult)

      await service.updateAdminStatus(
        tenantIdMock,
        entityIdMock,
        adminEmail,
        adminName,
      )

      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        undefined,
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        {
          initialAdmins: initialAdminsMock.map((admin, i) => ({
            ...admin,
            status:
              i === adminUpdatedIndex
                ? EntityStatus.Confirmed
                : EntityStatus.Pending,
          })),
        },
      )
    })

    it('(OK) does nothing if admin does not exist', async () => {
      const adminUpdatedIndex = 0
      const adminEmail = initialAdminsMock[adminUpdatedIndex].email
      const adminName = 'wrong name'
      const findOneResult = {
        initialAdmins: initialAdminsMock.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
      } as EntityEntity
      entityRepositoryMock.findOne.mockResolvedValueOnce(findOneResult)

      await service.updateAdminStatus(
        tenantIdMock,
        entityIdMock,
        adminEmail,
        adminName,
      )

      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith(
        { tenantId: tenantIdMock, id: entityIdMock },
        undefined,
      )
      expect(entityRepositoryMock.update).toHaveBeenCalledTimes(0)
    })
  })
})
