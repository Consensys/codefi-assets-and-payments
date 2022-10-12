import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, fetchTenantClients } from './utils/requests'
import { testModule } from './utils/testCommonUtils'
import { ClientType, EntityStatus } from '@codefi-assets-and-payments/ts-types'
import { ClientEntity } from '../src/data/entities/ClientEntity'
import { clientIdMock, tenantIdMock, tenantMock } from '../test/mocks'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { v4 as uuidv4 } from 'uuid'
import { MAX_PAGINATED_LIMIT } from '../src/validation/paginatedQueryRequestProperties'

require('dotenv').config()

jest.setTimeout(60000)

describe('Tenant Client Get', () => {
  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>
  let clientRepo: Repository<ClientEntity>
  let authToken: string

  beforeAll(async () => {
    appModule = await testModule()

    tenantRepo = appModule.get<Repository<TenantEntity>>(
      getRepositoryToken(TenantEntity),
    )
    entityRepo = appModule.get<Repository<EntityEntity>>(
      getRepositoryToken(EntityEntity),
    )
    walletRepo = appModule.get<Repository<WalletEntity>>(
      getRepositoryToken(WalletEntity),
    )
    clientRepo = appModule.get<Repository<ClientEntity>>(
      getRepositoryToken(ClientEntity),
    )
    await clientRepo.delete({})
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})

    authToken = await getTokenWithTenantId1EntityId1(appModule)
  })

  beforeEach(async () => {
    await createTenant(tenantMock, authToken)

    await clientRepo.insert({
      id: uuidv4(),
      tenantId: tenantIdMock,
      entityId: undefined,
      name: tenantMock.name,
      status: EntityStatus.Confirmed,
      type: ClientType.SinglePage,
      clientId: clientIdMock,
    })

    await clientRepo.insert({
      id: uuidv4(),
      tenantId: tenantIdMock,
      entityId: undefined,
      name: `${tenantMock.name} - M2M`,
      status: EntityStatus.Pending,
      type: ClientType.NonInteractive,
      clientId: null,
    })
  })

  afterEach(async () => {
    await clientRepo.delete({})
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})
  })

  afterAll(async () => {
    await appModule.close()
  })

  it('Success with no clients', async () => {
    await clientRepo.delete({})

    const { data: result } = await fetchTenantClients(
      tenantIdMock,
      {},
      authToken,
    )

    expect(result).toEqual({
      items: [],
      count: 0,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Success with no query', async () => {
    const { data: result } = await fetchTenantClients(
      tenantIdMock,
      {},
      authToken,
    )

    expect(result).toEqual({
      items: [
        {
          name: `${tenantMock.name} - M2M`,
          status: EntityStatus.Pending,
          type: ClientType.NonInteractive,
          clientId: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedDate: null,
        },
        {
          name: tenantMock.name,
          status: EntityStatus.Confirmed,
          type: ClientType.SinglePage,
          clientId: clientIdMock,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedDate: null,
        },
      ],
      count: 2,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Success with query', async () => {
    const { data: result } = await fetchTenantClients(
      tenantIdMock,
      {
        name: tenantMock.name,
        status: EntityStatus.Confirmed,
        type: ClientType.SinglePage,
        clientId: clientIdMock,
      },
      authToken,
    )

    expect(result).toEqual({
      items: [
        {
          name: tenantMock.name,
          status: EntityStatus.Confirmed,
          type: ClientType.SinglePage,
          clientId: clientIdMock,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedDate: null,
        },
      ],
      count: 1,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Success with skip', async () => {
    const { data: result } = await fetchTenantClients(
      tenantIdMock,
      { skip: 1 },
      authToken,
    )

    expect(result).toEqual({
      items: [
        {
          name: tenantMock.name,
          status: EntityStatus.Confirmed,
          type: ClientType.SinglePage,
          clientId: clientIdMock,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedDate: null,
        },
      ],
      count: 2,
      skip: 1,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Success with limit', async () => {
    const { data: result } = await fetchTenantClients(
      tenantIdMock,
      { limit: 1 },
      authToken,
    )

    expect(result).toEqual({
      items: [
        {
          name: `${tenantMock.name} - M2M`,
          status: EntityStatus.Pending,
          type: ClientType.NonInteractive,
          clientId: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedDate: null,
        },
      ],
      count: 2,
      skip: 0,
      limit: 1,
    })
  })
})
