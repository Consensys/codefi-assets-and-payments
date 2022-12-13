import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, fetchWallets } from './utils/requests'
import { testModule } from './utils/testCommonUtils'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { entityMock, tenantMock } from '../test/mocks'
import {
  TenantCreateRequest,
  WalletCreateRequest,
  WalletType,
} from '@consensys/ts-types'
import {
  decodeToken,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
} from '@consensys/auth'
import crypto from 'crypto'
import { MAX_PAGINATED_LIMIT } from '../src/validation/paginatedQueryRequestProperties'
import { toChecksumAddress } from 'web3-utils'
require('dotenv').config()

jest.setTimeout(60000)

describe('Wallet search', () => {
  const totalItems = 15
  let wallets: WalletCreateRequest[]

  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>

  let authToken: string
  let entityId1: string

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
    entityId1 = extractEntityIdFromToken(decodedToken)

    wallets = [...Array(totalItems)].map((_, i) => {
      const orchestrateAccount = i % 2 === 0
      return {
        address: orchestrateAccount
          ? undefined
          : `0x${crypto.randomBytes(20).toString('hex')}`,
        type: orchestrateAccount
          ? WalletType.INTERNAL_CODEFI_HASHICORP_VAULT
          : WalletType.EXTERNAL_OTHER,
        metadata: {
          name: `Wallet ${i}`,
        },
      }
    })

    const createTenantRequest: TenantCreateRequest = {
      ...tenantMock,
      id: tenantId1,
      initialEntities: [
        {
          id: entityId1,
          name: entityMock.name,
          initialWallets: wallets,
        },
      ],
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
    const { data: result } = await fetchWallets(
      entityId1,
      {
        skip: 0,
        limit: totalItems,
      },
      authToken,
    )

    expect(result).toEqual({
      items: [...Array(totalItems)].map((_, i) =>
        expect.objectContaining({
          metadata: {
            name: `Wallet ${totalItems - i - 1}`,
          },
        }),
      ),
      count: totalItems,
      skip: 0,
      limit: totalItems,
    })
  })

  it('Return items in multiple batches', async () => {
    const limit = 6

    let returnedItems = 0
    while (returnedItems < totalItems) {
      const { data: result } = await fetchWallets(
        entityId1,
        {
          skip: returnedItems,
          limit,
        },
        authToken,
      )

      expect(result).toEqual({
        items: [...Array(Math.min(limit, totalItems - returnedItems))].map(
          (_, i) =>
            expect.objectContaining({
              metadata: {
                name: `Wallet ${totalItems - returnedItems - i - 1}`,
              },
            }),
        ),
        count: totalItems,
        skip: returnedItems,
        limit,
      })

      returnedItems += result.items.length
    }

    expect(returnedItems).toEqual(totalItems)
  })

  it('Return items by wallet type', async () => {
    const { data: result } = await fetchWallets(
      entityId1,
      {
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
      },
      authToken,
    )

    const expectedItems = Math.ceil(totalItems / 2)
    expect(result).toEqual({
      items: [...Array(expectedItems)].map(() =>
        expect.objectContaining({
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        }),
      ),
      count: expectedItems,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })

  it('Return items by metadata name', async () => {
    const { data: result } = await fetchWallets(
      entityId1,
      {
        metadata: {
          name: 'Wallet 1',
        },
      },
      authToken,
    )

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          address: toChecksumAddress(wallets[1].address),
          type: WalletType.EXTERNAL_OTHER,
          metadata: {
            name: 'Wallet 1',
          },
        }),
      ],
      count: 1,
      skip: 0,
      limit: MAX_PAGINATED_LIMIT,
    })
  })
})
