import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, fetchTenants } from './utils/requests'
import { testModule } from './utils/testCommonUtils'
import { v4 as uuidv4 } from 'uuid'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { TenantCreateRequest } from '@codefi-assets-and-payments/ts-types'
import { MAX_PAGINATED_LIMIT } from '../src/validation/paginatedQueryRequestProperties'
require('dotenv').config()

jest.setTimeout(60000)

describe('Tenant search', () => {
  const totalItems = 15
  let tenants: TenantCreateRequest[]

  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>

  let authToken: string

  beforeAll(async () => {
    const tenantOperationEventSubscriberName = 'tenantOperationEventSubscriber'
    appModule = await testModule([tenantOperationEventSubscriberName])

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

    tenants = [...Array(totalItems)].map((_, i) => ({
      id: uuidv4(),
      name: `Tenant ${i}`,
      products: {
        assets: i === 3 || i === 9 ? true : false,
      },
      defaultNetworkKey: `Chain${i}`,
      metadata: {
        sharedValue: i % 2,
        uniqueValue: `${i}`,
      },
    }))

    for (let i = 0; i < tenants.length; i++) {
      await createTenant(tenants[i], authToken)
    }
  })

  afterAll(async () => {
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})
    await appModule.close()
  })

  it('Return all items when limit is equal or above the total', async () => {
    const { data: result } = await fetchTenants(
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
          name: `Tenant ${index}`,
          products: {
            assets: index === 3 || index === 9 ? true : false,
          },
          defaultNetworkKey: `Chain${index}`,
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
      const { data: result } = await fetchTenants(
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
              name: `Tenant ${index}`,
              products: {
                assets: index === 3 || index === 9 ? true : false,
              },
              defaultNetworkKey: `Chain${index}`,
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

  it('Return items by name', async () => {
    const { data: result } = await fetchTenants(
      {
        name: 'Tenant 1',
      },
      authToken,
    )

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          name: 'Tenant 1',
          products: {
            assets: false,
          },
          defaultNetworkKey: 'Chain1',
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

  it('Return items by products', async () => {
    const { data: result } = await fetchTenants(
      {
        products: { assets: true },
      },
      authToken,
    )

    expect(result).toEqual({
      items: expect.arrayContaining([
        expect.objectContaining({
          name: 'Tenant 3',
          products: {
            assets: true,
          },
          defaultNetworkKey: 'Chain3',
          metadata: {
            sharedValue: 1,
            uniqueValue: '3',
          },
        }),
        expect.objectContaining({
          name: 'Tenant 9',
          products: {
            assets: true,
          },
          defaultNetworkKey: 'Chain9',
          metadata: {
            sharedValue: 1,
            uniqueValue: '9',
          },
        }),
      ]),
      count: 2,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Return items by defaultNetworkKey', async () => {
    const { data: result } = await fetchTenants(
      {
        defaultNetworkKey: 'Chain5',
      },
      authToken,
    )

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          name: 'Tenant 5',
          products: {
            assets: false,
          },
          defaultNetworkKey: 'Chain5',
          metadata: {
            sharedValue: 1,
            uniqueValue: '5',
          },
        }),
      ],
      count: 1,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Return items by metadata unique value', async () => {
    const { data: result } = await fetchTenants(
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
          name: 'Tenant 4',
          products: {
            assets: false,
          },
          defaultNetworkKey: 'Chain4',
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
    const { data: result } = await fetchTenants(
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
      count: Math.floor(totalItems / 2),
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })
})
