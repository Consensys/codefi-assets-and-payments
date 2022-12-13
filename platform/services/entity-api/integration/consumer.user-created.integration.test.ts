import { Events, IUserCreatedEvent } from '@consensys/messaging-events'
import { KafkaProducer } from '@consensys/nestjs-messaging'
import { EntityStatus, TenantCreateRequest } from '@consensys/ts-types'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { entityMock, tenantMock } from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import {
  publishUserCreatedEvent,
  createTenant,
  fetchEntity,
  fetchTenant,
} from './utils/requests'
import {
  adminConfirmed,
  retryRepoFindAllCondition,
  testModule,
} from './utils/testCommonUtils'
import {
  decodeToken,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
} from '@consensys/auth'
import { sleep } from '../src/utils/utils'
require('dotenv').config()

jest.setTimeout(120000)

describe('User created event consumer ', () => {
  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>
  let kafkaProducer: KafkaProducer

  let authToken: string
  let tenantId1: string
  let entityId1: string

  const tenantAdmins = [
    {
      name: 'Tenant Admin 1',
      email: 'tenant.1@email.com',
    },
    {
      name: 'Tenant Admin 2',
      email: 'tenant.2@email.com',
    },
  ]
  const entityAdmins = [
    {
      name: 'Entity Admin 1',
      email: 'entity.1@email.com',
    },
    {
      name: 'Entity Admin 2',
      email: 'entity.2@email.com',
    },
  ]

  beforeAll(async () => {
    appModule = await testModule()

    // Set up producers and subscribers
    kafkaProducer = appModule.get(KafkaProducer)

    await kafkaProducer.registerProducerEvents([Events.userCreatedEvent])

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
    tenantId1 = extractTenantIdFromToken(decodedToken)
    entityId1 = extractEntityIdFromToken(decodedToken)
  })

  beforeEach(async () => {
    // Clear DB and pending messages
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})

    // Create new tenant
    const createTenantRequest: TenantCreateRequest = {
      ...tenantMock,
      id: tenantId1,
      initialAdmins: tenantAdmins,
      initialEntities: [
        {
          id: entityId1,
          name: entityMock.name,
          initialAdmins: entityAdmins,
        },
      ],
    }
    await createTenant(createTenantRequest, authToken)
  })

  afterEach(async () => {
    // Clear DB and pending messages
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})
  })

  afterAll(async () => {
    await appModule.close()
  })

  it('Success when updating initial admin for tenant and entity', async () => {
    // Simulate admin-api creating admins
    const admins = [...tenantAdmins, ...entityAdmins]
    admins.forEach((admin) => {
      const adminCreatedEvent: IUserCreatedEvent = {
        email: admin.email,
        name: admin.name,
        tenantId: tenantId1,
        entityId: entityId1,
        userId: uuidv4(),
        appMetadata: JSON.stringify({}),
        userMetadata: JSON.stringify({}),
        emailVerified: false,
        picture: 'picture',
      }
      publishUserCreatedEvent(kafkaProducer, adminCreatedEvent)
    })

    for (const admin of tenantAdmins) {
      await retryRepoFindAllCondition(tenantRepo, adminConfirmed, false, [
        tenantId1,
        admin.email,
        admin.name,
      ])
    }

    for (const admin of entityAdmins) {
      await retryRepoFindAllCondition(entityRepo, adminConfirmed, false, [
        entityId1,
        admin.email,
        admin.name,
      ])
    }
  })
})
