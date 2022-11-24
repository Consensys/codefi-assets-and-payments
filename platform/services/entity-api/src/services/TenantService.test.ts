import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { Repository, UpdateResult } from 'typeorm'
import {
  DEFAULT_INITIAL_ENTITY_NAME,
  TenantService,
  TENANT_ADMIN_ROLE,
} from './TenantService'
import { TenantEntity } from '../data/entities/TenantEntity'
import {
  entityIdMock,
  initialAdminsMock,
  initialEntitiesMock,
  storeMappingsMock,
  subjectMock,
  tenantIdMock,
  tenantMock,
  tenantUpdateMock,
} from '../../test/mocks'
import { AdminApiService } from './AdminApiService'
import { EntityStatus, TenantCreateRequest } from '@consensys/ts-types'
import { KafkaProducer } from '@consensys/nestjs-messaging'
import {
  Commands,
  Events,
  MessageDataOperation,
} from '@consensys/messaging-events'
import { EntityNotFoundException } from '@consensys/error-handler'
import { EntityService } from './EntityService'
import { EntityEntity } from '../data/entities/EntityEntity'
import { StoreService } from './StoreService'

describe('TenantService', () => {
  let service: TenantService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tenantRepositoryMock: jest.Mocked<Repository<TenantEntity>>
  let entityServiceMock: jest.Mocked<EntityService>
  let adminApiServiceMock: jest.Mocked<AdminApiService>
  let storeServiceMock: jest.Mocked<StoreService>
  let kafkaProducerMock: jest.Mocked<KafkaProducer>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    tenantRepositoryMock = createMockInstance(Repository as any)
    entityServiceMock = createMockInstance(EntityService)
    adminApiServiceMock = createMockInstance(AdminApiService)
    storeServiceMock = createMockInstance(StoreService)
    kafkaProducerMock = createMockInstance(KafkaProducer)
    service = new TenantService(
      loggerMock,
      tenantRepositoryMock,
      entityServiceMock,
      adminApiServiceMock,
      storeServiceMock,
      kafkaProducerMock,
    )
  })

  describe('getAll', () => {
    it('(OK) success', async () => {
      const filter = {}

      const findResult = [[], 0]
      tenantRepositoryMock.findAndCount.mockResolvedValueOnce(findResult as any)

      const result = await service.getAll(filter)

      expect(result).toBe(findResult)
      expect(tenantRepositoryMock.findAndCount).toHaveBeenCalledWith(filter)
    })
  })

  describe('getById', () => {
    it('(OK) succeeds if tenant exists', async () => {
      const findOneResult = {}
      tenantRepositoryMock.findOne.mockResolvedValueOnce(
        findOneResult as TenantEntity,
      )

      const result = await service.getById(tenantIdMock)

      expect(result).toBe(findOneResult)
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantIdMock },
        undefined,
      )
    })

    it('(FAIL) throws if tenant does not exist', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(service.getById(tenantIdMock)).rejects.toThrowError(
        EntityNotFoundException,
      )

      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantIdMock },
        undefined,
      )
    })
  })

  describe('create', () => {
    it('(OK) creates tenant with initial entities, initial admins, and stores', async () => {
      const tenant: TenantCreateRequest = {
        ...tenantMock,
        initialAdmins: initialAdminsMock,
        initialEntities: initialEntitiesMock,
        stores: storeMappingsMock,
      }

      entityServiceMock.create.mockImplementation((entity) =>
        Promise.resolve({
          id: entity.id,
        } as EntityEntity),
      )

      const findOneResult = {
        ...tenantMock,
        initialAdmins: initialAdminsMock.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      tenantRepositoryMock.findOne.mockResolvedValueOnce(
        findOneResult as TenantEntity,
      )

      const result = await service.create(tenant, subjectMock)

      expect(result).toBe(findOneResult)
      expect(tenantRepositoryMock.insert).toHaveBeenCalledWith({
        ...tenant,
        initialAdmins: tenant.initialAdmins.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
        createdBy: subjectMock,
        stores: undefined,
      })
      for (const entity of initialEntitiesMock) {
        expect(entityServiceMock.create).toHaveBeenCalledWith(
          { ...entity, tenantId: tenant.id },
          subjectMock,
        )
      }
      expect(adminApiServiceMock.createAdmins).toHaveBeenCalledWith(
        initialAdminsMock,
        [TENANT_ADMIN_ROLE],
        tenantMock.id,
        initialEntitiesMock[0].id,
      )
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantMock.id },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.tenantOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          tenantId: findOneResult.id,
          name: findOneResult.name,
          products: findOneResult.products,
          defaultNetworkKey: findOneResult.defaultNetworkKey,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      expect(storeServiceMock.setTenantMappings).toHaveBeenCalledWith(
        storeMappingsMock,
        tenantIdMock,
      )
    })

    it('(OK) created tenant with default metadata and admins', async () => {
      const tenant: TenantCreateRequest = {
        ...tenantMock,
        metadata: undefined,
      }

      const entityCreateResult = { id: entityIdMock }
      entityServiceMock.create.mockResolvedValueOnce(
        entityCreateResult as EntityEntity,
      )

      const findOneResult = {
        ...tenantMock,
        metadata: {},
        initialAdmins: [],
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      tenantRepositoryMock.findOne.mockResolvedValueOnce(
        findOneResult as TenantEntity,
      )

      const result = await service.create(tenant, subjectMock)

      expect(result).toBe(findOneResult)
      expect(tenantRepositoryMock.insert).toHaveBeenCalledWith({
        ...tenant,
        metadata: {},
        initialAdmins: [],
        createdBy: subjectMock,
      })
      expect(entityServiceMock.create).toHaveBeenCalledWith(
        { tenantId: tenant.id, name: DEFAULT_INITIAL_ENTITY_NAME },
        subjectMock,
      )
      expect(adminApiServiceMock.createAdmins).toHaveBeenCalledWith(
        undefined,
        [TENANT_ADMIN_ROLE],
        tenantMock.id,
        entityCreateResult.id,
      )
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantMock.id },
        undefined,
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.tenantOperationEvent,
        {
          operation: MessageDataOperation.CREATE,
          tenantId: findOneResult.id,
          name: findOneResult.name,
          products: findOneResult.products,
          defaultNetworkKey: findOneResult.defaultNetworkKey,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })
  })

  describe('update', () => {
    it('(OK) updates tenant', async () => {
      const findOneResult = {
        ...tenantMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      tenantRepositoryMock.findOne.mockResolvedValue(
        findOneResult as TenantEntity,
      )

      const result = await service.update(tenantIdMock, tenantUpdateMock)

      expect(result).toBe(findOneResult)
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantMock.id },
        undefined,
      )
      expect(tenantRepositoryMock.update).toHaveBeenCalledWith(
        { id: tenantIdMock },
        tenantUpdateMock,
      )
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantMock.id },
        undefined,
      )
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledTimes(2)
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.tenantOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          tenantId: findOneResult.id,
          name: findOneResult.name,
          products: findOneResult.products,
          defaultNetworkKey: findOneResult.defaultNetworkKey,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
    })

    it('(OK) updates tenant with stores', async () => {
      const tenantRequest = {
        ...tenantUpdateMock,
        stores: storeMappingsMock,
      }
      const findOneResult = {
        ...tenantMock,
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      tenantRepositoryMock.findOne.mockResolvedValue(
        findOneResult as TenantEntity,
      )

      const result = await service.update(tenantIdMock, tenantRequest)

      expect(result).toBe(findOneResult)
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantMock.id },
        undefined,
      )
      expect(tenantRepositoryMock.update).toHaveBeenCalledWith(
        { id: tenantIdMock },
        { ...tenantRequest, stores: undefined },
      )
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantMock.id },
        undefined,
      )
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledTimes(2)
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.tenantOperationEvent,
        {
          operation: MessageDataOperation.UPDATE,
          tenantId: findOneResult.id,
          name: findOneResult.name,
          products: findOneResult.products,
          defaultNetworkKey: findOneResult.defaultNetworkKey,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      expect(storeServiceMock.setTenantMappings).toHaveBeenCalledWith(
        storeMappingsMock,
        tenantIdMock,
        {
          removeExisting: true,
        },
      )
    })

    it('(FAIL) throws if tenant does not exist', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(
        service.update(tenantIdMock, tenantUpdateMock),
      ).rejects.toThrowError(EntityNotFoundException)

      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantIdMock },
        undefined,
      )
      expect(tenantRepositoryMock.update).toHaveBeenCalledTimes(0)
      expect(kafkaProducerMock.send).toHaveBeenCalledTimes(0)
    })
  })

  describe('delete', () => {
    it('(OK) deletes tenant', async () => {
      const findOneResult = {
        ...tenantMock,
        entities: [{ id: entityIdMock }],
        createdBy: subjectMock,
        createdAt: new Date(),
      }
      tenantRepositoryMock.findOne.mockResolvedValueOnce(
        findOneResult as TenantEntity,
      )
      const softDeleteResult = {}
      tenantRepositoryMock.softDelete.mockResolvedValueOnce(
        softDeleteResult as UpdateResult,
      )

      const result = await service.delete(tenantIdMock)

      expect(result).toBe(softDeleteResult)
      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantMock.id },
        { relations: ['entities'] },
      )
      expect(tenantRepositoryMock.softDelete).toHaveBeenCalledWith({
        id: tenantIdMock,
      })
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Events.tenantOperationEvent,
        {
          operation: MessageDataOperation.DELETE,
          tenantId: findOneResult.id,
          name: findOneResult.name,
          products: findOneResult.products,
          defaultNetworkKey: findOneResult.defaultNetworkKey,
          metadata: JSON.stringify(findOneResult.metadata),
          createdBy: findOneResult.createdBy,
          createdAt: findOneResult.createdAt.toISOString(),
        },
      )
      expect(kafkaProducerMock.send).toHaveBeenCalledWith(
        Commands.entityDeleteCommand,
        {
          tenantId: tenantIdMock,
          entityId: entityIdMock,
        },
      )
      expect(storeServiceMock.setTenantMappings).toHaveBeenCalledWith(
        [],
        tenantIdMock,
        { removeExisting: true },
      )
    })

    it('(FAIL) throws if tenant does not exist', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce(undefined)

      await expect(service.delete(tenantIdMock)).rejects.toThrowError(
        EntityNotFoundException,
      )

      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantMock.id },
        { relations: ['entities'] },
      )
      expect(tenantRepositoryMock.softDelete).toHaveBeenCalledTimes(0)
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
      } as TenantEntity
      tenantRepositoryMock.findOne.mockResolvedValueOnce(findOneResult)

      await service.updateAdminStatus(tenantIdMock, adminEmail, adminName)

      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantIdMock },
        undefined,
      )
      expect(tenantRepositoryMock.update).toHaveBeenCalledWith(
        { id: tenantIdMock },
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
      const adminEmail = 'wrong email'
      const adminName = initialAdminsMock[adminUpdatedIndex].name
      const findOneResult = {
        initialAdmins: initialAdminsMock.map((admin) => ({
          ...admin,
          status: EntityStatus.Pending,
        })),
      } as TenantEntity
      tenantRepositoryMock.findOne.mockResolvedValueOnce(findOneResult)

      await service.updateAdminStatus(tenantIdMock, adminEmail, adminName)

      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith(
        { id: tenantIdMock },
        undefined,
      )
      expect(tenantRepositoryMock.update).toHaveBeenCalledTimes(0)
    })
  })
})
