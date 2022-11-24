import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { Repository } from 'typeorm'
import { TenantEntity } from '../data/entities/TenantEntity'
import {
  clientIdMock,
  clientNameMock,
  entityClientCreateRequestMock,
  entityIdMock,
  tenantIdMock,
} from '../../test/mocks'
import { AdminApiService } from './AdminApiService'
import { ClientType, EntityStatus } from '@consensys/ts-types'
import { ClientEntity } from '../data/entities/ClientEntity'
import { ClientService } from './ClientService'
import { EntityEntity } from '../data/entities/EntityEntity'

describe('ClientService', () => {
  let service: ClientService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tenantRepositoryMock: jest.Mocked<Repository<TenantEntity>>
  let entityRepositoryMock: jest.Mocked<Repository<EntityEntity>>
  let clientRepositoryMock: jest.Mocked<Repository<ClientEntity>>
  let adminApiServiceMock: jest.Mocked<AdminApiService>

  const expectedGrantTypesM2M = [
    'password',
    'authorization_code',
    'implicit',
    'refresh_token',
    'client_credentials',
  ]

  const expectedGrantTypesSPA = [
    'password',
    'authorization_code',
    'implicit',
    'refresh_token',
  ]

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    tenantRepositoryMock = createMockInstance(Repository as any)
    entityRepositoryMock = createMockInstance(Repository as any)
    clientRepositoryMock = createMockInstance(Repository as any)
    adminApiServiceMock = createMockInstance(AdminApiService)
    service = new ClientService(
      loggerMock,
      adminApiServiceMock,
      tenantRepositoryMock,
      entityRepositoryMock,
      clientRepositoryMock,
    )
  })

  describe('getAll', () => {
    it('(OK) success', async () => {
      const filter = {}
      const findResult = [[], 0]
      clientRepositoryMock.findAndCount.mockResolvedValueOnce(findResult as any)

      const result = await service.getAll(filter)

      expect(result).toBe(findResult)
      expect(clientRepositoryMock.findAndCount).toHaveBeenCalledWith(filter)
    })
  })

  describe('createClient', () => {
    it('(OK) inserts client entity with just tenant id', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        name: clientNameMock,
      } as TenantEntity)

      await service.create(
        tenantIdMock,
        undefined,
        entityClientCreateRequestMock,
      )

      expect(tenantRepositoryMock.findOne).toHaveBeenCalledWith({
        id: tenantIdMock,
      })
      expect(clientRepositoryMock.insert).toHaveBeenCalledTimes(1)
      expect(clientRepositoryMock.insert).toHaveBeenCalledWith({
        id: expect.any(String),
        tenantId: tenantIdMock,
        entityId: undefined,
        name: clientNameMock,
        status: EntityStatus.Pending,
        type: ClientType.SinglePage,
      })
    })

    it('(OK) inserts client entities with tenant id and entity id', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        name: clientNameMock,
      } as EntityEntity)

      await service.create(
        tenantIdMock,
        entityIdMock,
        entityClientCreateRequestMock,
      )

      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith({
        id: entityIdMock,
        tenantId: tenantIdMock,
      })
      expect(clientRepositoryMock.insert).toHaveBeenCalledTimes(1)
      expect(clientRepositoryMock.insert).toHaveBeenCalledWith({
        id: expect.any(String),
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        name: clientNameMock,
        status: EntityStatus.Pending,
        type: ClientType.SinglePage,
      })
    })

    it('(OK) inserts client entities with type as non-interactive', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        name: clientNameMock,
      } as EntityEntity)

      await service.create(tenantIdMock, entityIdMock, {
        type: ClientType.NonInteractive,
      })

      expect(entityRepositoryMock.findOne).toHaveBeenCalledWith({
        id: entityIdMock,
        tenantId: tenantIdMock,
      })
      expect(clientRepositoryMock.insert).toHaveBeenCalledTimes(1)
      expect(clientRepositoryMock.insert).toHaveBeenCalledWith({
        id: expect.any(String),
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        name: `${clientNameMock} - M2M`,
        status: EntityStatus.Pending,
        type: ClientType.NonInteractive,
      })
    })

    it('(OK) calls admin api service to create clients with just tenant id', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        name: clientNameMock,
      } as TenantEntity)

      await service.create(
        tenantIdMock,
        undefined,
        entityClientCreateRequestMock,
      )

      expect(adminApiServiceMock.createClient).toHaveBeenCalledTimes(1)
      expect(adminApiServiceMock.createClient).toHaveBeenCalledWith(
        clientNameMock,
        ClientType.SinglePage,
        expectedGrantTypesSPA,
        tenantIdMock,
        undefined,
      )
    })

    it('(OK) calls admin api service to create clients with tenant id and entity id', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        name: clientNameMock,
      } as EntityEntity)

      await service.create(
        tenantIdMock,
        entityIdMock,
        entityClientCreateRequestMock,
      )

      expect(adminApiServiceMock.createClient).toHaveBeenCalledTimes(1)
      expect(adminApiServiceMock.createClient).toHaveBeenCalledWith(
        clientNameMock,
        ClientType.SinglePage,
        expectedGrantTypesSPA,
        tenantIdMock,
        entityIdMock,
      )
    })

    it('(OK) calls admin api service to create clients with type as non-interactie', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        name: clientNameMock,
      } as EntityEntity)

      await service.create(tenantIdMock, entityIdMock, {
        type: ClientType.NonInteractive,
      })

      expect(adminApiServiceMock.createClient).toHaveBeenCalledTimes(1)
      expect(adminApiServiceMock.createClient).toHaveBeenCalledWith(
        `${clientNameMock} - M2M`,
        ClientType.NonInteractive,
        expectedGrantTypesM2M,
        tenantIdMock,
        entityIdMock,
      )
    })

    it('(FAIL) throws if client already exists with same tenant id and name', async () => {
      tenantRepositoryMock.findOne.mockResolvedValueOnce({
        name: clientNameMock,
      } as TenantEntity)

      clientRepositoryMock.findOne.mockResolvedValueOnce({
        tenantId: tenantIdMock,
        entityId: undefined,
        name: clientNameMock,
      } as ClientEntity)

      await expect(
        service.create(tenantIdMock, undefined, entityClientCreateRequestMock),
      ).rejects.toHaveProperty(
        'message',
        `A client already exists with the following: Tenant ID: ${tenantIdMock} | Entity ID: ${undefined} | Name: ${clientNameMock}`,
      )
    })

    it('(FAIL) throws if client already exists with same tenant id and entity id and name', async () => {
      entityRepositoryMock.findOne.mockResolvedValueOnce({
        name: clientNameMock,
      } as EntityEntity)

      clientRepositoryMock.findOne.mockResolvedValueOnce({
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        name: clientNameMock,
      } as ClientEntity)

      await expect(
        service.create(
          tenantIdMock,
          entityIdMock,
          entityClientCreateRequestMock,
        ),
      ).rejects.toHaveProperty(
        'message',
        `A client already exists with the following: Tenant ID: ${tenantIdMock} | Entity ID: ${entityIdMock} | Name: ${clientNameMock}`,
      )
    })

    it.each([ClientType.Native, ClientType.RegularWeb])(
      '(FAIL) throws if client type is %s',
      async (clientType) => {
        await expect(
          service.create(tenantIdMock, entityIdMock, { type: clientType }),
        ).rejects.toHaveProperty(
          'message',
          `Clients cannot be created with the type: ${clientType}`,
        )
      },
    )
  })

  describe('updateClientStatus', () => {
    it('(OK) updates client status to confirmed with just tenant id', async () => {
      await service.updateStatus(
        tenantIdMock,
        undefined,
        clientNameMock,
        clientIdMock,
      )

      expect(clientRepositoryMock.update).toHaveBeenCalledWith(
        {
          tenantId: tenantIdMock,
          entityId: undefined,
          name: clientNameMock,
        },
        { status: EntityStatus.Confirmed, clientId: clientIdMock },
      )
    })

    it('(OK) updates client status to confirmed with tenant id and entity id', async () => {
      await service.updateStatus(
        tenantIdMock,
        entityIdMock,
        clientNameMock,
        clientIdMock,
      )

      expect(clientRepositoryMock.update).toHaveBeenCalledWith(
        {
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          name: clientNameMock,
        },
        { status: EntityStatus.Confirmed, clientId: clientIdMock },
      )
    })
  })
})
