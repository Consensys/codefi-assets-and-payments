import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, fetchEntities } from './utils/requests'
import { testModule } from './utils/testCommonUtils'
import { v4 as uuidv4 } from 'uuid'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { tenantMock } from '../test/mocks'
import { decodeToken, extractTenantIdFromToken } from '@codefi-assets-and-payments/auth'
import { EntityCreateRequest, TenantCreateRequest } from '@codefi-assets-and-payments/ts-types'
import { MAX_PAGINATED_LIMIT } from '../src/validation/paginatedQueryRequestProperties'
require('dotenv').config()

jest.setTimeout(60000)

describe('Entity search', () => {
  const totalItems = 15
  let entities: EntityCreateRequest[]

  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>

  let authToken: string

  beforeAll(async () => {
    appModule = await testModule()

    // Initialise DB repositories
    tenantRepo = appModule.get<Repository<TenantEntity>>(
      getRepositoryToken(TenantEntity),
    )
    entityRepo = appModule.get<Repository<EntityEntity>>(
      getRepositoryToken(EntityEntity),
    )
    walletRepo = appModule.get<Repository<WalletEntity>>(
      getRepositoryToken(WalletEntity),
    )
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})

    // Create JWT Tokens
    authToken = await getTokenWithTenantId1EntityId1(appModule)
    const decodedToken = decodeToken(authToken)
    const tenantId1 = extractTenantIdFromToken(decodedToken)

    entities = [...Array(totalItems)].map((_, i) => ({
      id: uuidv4(),
      name: `Entity ${i}`,
      metadata: {
        sharedValue: i % 2,
        uniqueValue: `${i}`,
      },
    }))

    const createTenantRequest: TenantCreateRequest = {
      ...tenantMock,
      id: tenantId1,
      initialEntities: entities,
    }
    await createTenant(createTenantRequest, authToken)
  })

  afterAll(async () => {
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})
    await appModule.close()
  })

  it('Return all items when limit is equal or above the total', async () => {
    const { data: result } = await fetchEntities(
      {
        skip: 0,
        limit: totalItems,
      },
      authToken,
    )

    expect(result).toEqual({
      items: [...Array(totalItems)].map((_, i) => {
        const index = totalItems - i - 1
        return expect.objectContaining({
          name: `Entity ${index}`,
          metadata: {
            sharedValue: index % 2,
            uniqueValue: `${index}`,
          },
        })
      }),
      count: totalItems,
      skip: 0,
      limit: totalItems,
    })
  })

  it('Return items in multiple batches', async () => {
    const limit = 6

    let returnedItems = 0
    while (returnedItems < totalItems) {
      const { data: result } = await fetchEntities(
        {
          skip: returnedItems,
          limit,
        },
        authToken,
      )

      expect(result).toEqual({
        items: [...Array(Math.min(limit, totalItems - returnedItems))].map(
          (_, i) => {
            const index = totalItems - returnedItems - i - 1
            return expect.objectContaining({
              name: `Entity ${index}`,
              metadata: {
                sharedValue: index % 2,
                uniqueValue: `${index}`,
              },
            })
          },
        ),
        count: totalItems,
        skip: returnedItems,
        limit,
      })

      returnedItems += result.items.length
    }

    expect(returnedItems).toEqual(totalItems)
  })

  it('Return items by ids', async () => {
    const ids = entities
      .map((entity, i) => (i % 2 === 0 ? entity.id : undefined))
      .filter((id) => id)

    const { data: result } = await fetchEntities({ ids }, authToken)

    const expectedItems = Math.ceil(totalItems / 2)
    expect(result).toEqual({
      items: expect.arrayContaining(
        ids.map((id) =>
          expect.objectContaining({
            id,
          }),
        ),
      ),
      count: expectedItems,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Return items by name', async () => {
    const { data: result } = await fetchEntities(
      {
        name: 'Entity 1',
      },
      authToken,
    )

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          name: 'Entity 1',
          metadata: {
            sharedValue: 1,
            uniqueValue: '1',
          },
        }),
      ],
      count: 1,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Return items by metadata unique value', async () => {
    const { data: result } = await fetchEntities(
      {
        metadata: {
          uniqueValue: '4',
        },
      },
      authToken,
    )

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          name: 'Entity 4',
          metadata: {
            sharedValue: 0,
            uniqueValue: '4',
          },
        }),
      ],
      count: 1,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Return items by metadata shared value', async () => {
    const { data: result } = await fetchEntities(
      {
        metadata: {
          sharedValue: 1,
        },
      },
      authToken,
    )

    const expectedItems = Math.floor(totalItems / 2)
    expect(result).toEqual({
      items: [...Array(expectedItems)].map(() =>
        expect.objectContaining({
          metadata: expect.objectContaining({
            sharedValue: 1,
          }),
        }),
      ),
      count: expectedItems,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Return items by metadata containing multiple options', async () => {
    const { data: result } = await fetchEntities(
      {
        metadataWithOptions: {
          uniqueValue: ['4', '7'],
        },
      },
      authToken,
    )

    expect(result).toEqual({
      items: expect.arrayContaining([
        expect.objectContaining({
          name: 'Entity 4',
          metadata: {
            sharedValue: 0,
            uniqueValue: '4',
          },
        }),
        expect.objectContaining({
          name: 'Entity 7',
          metadata: {
            sharedValue: 1,
            uniqueValue: '7',
          },
        }),
      ]),
      count: 2,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })
})
