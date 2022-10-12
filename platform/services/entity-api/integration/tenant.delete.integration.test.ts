import { decodeToken, extractTenantIdFromToken } from '@codefi-assets-and-payments/auth'
import {
  Commands,
  Events,
  IEntityOperationEvent,
  ITenantOperationEvent,
  IWalletOperationEvent,
  TenantDeleteCommandBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { KafkaProducer, KafkaConsumer } from '@codefi-assets-and-payments/nestjs-messaging'
import { TenantCreateRequest } from '@codefi-assets-and-payments/ts-types'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { EntityStoreEntity } from '../src/data/entities/EntityStoreEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { TenantStoreEntity } from '../src/data/entities/TenantStoreEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { storeMappingsMock, tenantMock } from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, deleteTenant, fetchTenant } from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
require('dotenv').config()

jest.setTimeout(60000)

describe('Tenant delete operation', () => {
  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>
  let tenantStoreRepo: Repository<TenantStoreEntity>
  let entityStoreRepo: Repository<EntityStoreEntity>
  let kafkaProducer: KafkaProducer
  let kafkaConsumer: KafkaConsumer
  let tenantOperationEventSubscriber: TestKafkaSubscriber<ITenantOperationEvent>
  let entityOperationEventSubscriber: TestKafkaSubscriber<IEntityOperationEvent>
  let walletOperationEventSubscriber: TestKafkaSubscriber<IWalletOperationEvent>

  let authToken: string
  let tenantId1: string
  let sub: string

  let defaultEntityId: string
  let defaultWalletAddress: string

  beforeAll(async () => {
    const tenantOperationEventSubscriberName = 'tenantOperationEventSubscriber'
    const entityOperationEventSubscriberName = 'entityOperationEventSubscriber'
    const walletOperationEventSubscriberName = 'walletOperationEventSubscriber'
    appModule = await testModule([
      tenantOperationEventSubscriberName,
      entityOperationEventSubscriberName,
      walletOperationEventSubscriberName,
    ])

    // Set up producers and subscribers
    kafkaProducer = appModule.get(KafkaProducer)
    kafkaConsumer = appModule.get(KafkaConsumer)

    await kafkaProducer.registerProducerEvents([Commands.tenantDeleteCommand])

    tenantOperationEventSubscriber = await subscribeToMessage(
      appModule,
      kafkaConsumer,
      Events.tenantOperationEvent,
      tenantOperationEventSubscriberName,
    )
    await tenantOperationEventSubscriber.cleanMessages()

    entityOperationEventSubscriber = await subscribeToMessage(
      appModule,
      kafkaConsumer,
      Events.entityOperationEvent,
      entityOperationEventSubscriberName,
    )
    await entityOperationEventSubscriber.cleanMessages()

    walletOperationEventSubscriber = await subscribeToMessage(
      appModule,
      kafkaConsumer,
      Events.walletOperationEvent,
      walletOperationEventSubscriberName,
    )
    await walletOperationEventSubscriber.cleanMessages()

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
    tenantStoreRepo = appModule.get<Repository<TenantStoreEntity>>(
      getRepositoryToken(TenantStoreEntity),
    )
    entityStoreRepo = appModule.get<Repository<EntityStoreEntity>>(
      getRepositoryToken(EntityStoreEntity),
    )
    await tenantStoreRepo.delete({})
    await entityStoreRepo.delete({})
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})

    // Create JWT Tokens
    authToken = await getTokenWithTenantId1EntityId1(appModule)
    const decodedToken = decodeToken(authToken)
    sub = decodedToken.sub
    tenantId1 = extractTenantIdFromToken(decodedToken)
  })

  beforeEach(async () => {
    // Clear DB and pending messages
    await tenantOperationEventSubscriber.cleanMessages()
    await entityOperationEventSubscriber.cleanMessages()
    await walletOperationEventSubscriber.cleanMessages()
    await tenantStoreRepo.delete({})
    await entityStoreRepo.delete({})
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})

    // Create new tenant
    const createTenantRequest: TenantCreateRequest = {
      ...tenantMock,
      id: tenantId1,
      stores: storeMappingsMock,
    }
    await createTenant(createTenantRequest, authToken)
    await tenantOperationEventSubscriber.consumeMessage('Tenant Created')
    const defaultEntity = await entityOperationEventSubscriber.consumeMessage(
      'Entity Created',
    )
    defaultEntityId = defaultEntity.entityId

    await entityOperationEventSubscriber.consumeMessage('Entity Updated')
    const defaultWallet = await walletOperationEventSubscriber.consumeMessage(
      'Wallet Created',
    )
    defaultWalletAddress = defaultWallet.address
  })

  afterEach(async () => {
    // Clear DB and pending messages
    await tenantOperationEventSubscriber.cleanMessages()
    await entityOperationEventSubscriber.cleanMessages()
    await walletOperationEventSubscriber.cleanMessages()
    await tenantStoreRepo.delete({})
    await entityStoreRepo.delete({})
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})
  })

  afterAll(async () => {
    await kafkaConsumer.disconnectAllConsumers()
    await appModule.close()
  })

  describe('Kafka Commands', () => {
    it('Success when deleting a tenant', async () => {
      const deleteTenantCommand = TenantDeleteCommandBuilder.get(
        tenantId1,
      ).build()

      // Send command
      await kafkaProducer.send(
        Commands.tenantDeleteCommand,
        deleteTenantCommand,
      )

      // Check ITenantOperationEvent message
      const tenantDeletedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Deleted',
      )
      expect(tenantDeletedEvent).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          name: tenantMock.name,
          products: tenantMock.products,
          defaultNetworkKey: tenantMock.defaultNetworkKey,
          metadata: JSON.stringify(tenantMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Expect tenant to not return using endpoint
      await expect(fetchTenant(tenantId1, authToken)).rejects.toThrow()

      // Expect tenant to be soft deleted
      const tenant = await tenantRepo.findOne(
        { id: tenantId1 },
        { withDeleted: true },
      )
      expect(tenant).toEqual(
        expect.objectContaining({
          ...tenantMock,
          deletedDate: expect.any(Date),
        }),
      )

      // Check IEntityOperationEvent message
      const entityDeletedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Deleted',
      )
      expect(entityDeletedEvent.entityId).toEqual(defaultEntityId)

      // Check IWalletOperationEvent message
      const walletDeletedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Deleted',
      )
      expect(walletDeletedEvent.address).toEqual(defaultWalletAddress)
    })
  })

  describe('HTTP Endpoints', () => {
    it('Success when deleting a tenant', async () => {
      // Send request to delete a tenant
      await deleteTenant(tenantId1, authToken)

      // Check ITenantOperationEvent message
      const tenantDeletedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Deleted',
      )
      expect(tenantDeletedEvent).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          name: tenantMock.name,
          products: tenantMock.products,
          defaultNetworkKey: tenantMock.defaultNetworkKey,
          metadata: JSON.stringify(tenantMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Expect tenant to not return using endpoint
      await expect(fetchTenant(tenantId1, authToken)).rejects.toThrow()

      // Expect tenant to be soft deleted
      const tenant = await tenantRepo.findOne(
        { id: tenantId1 },
        { withDeleted: true },
      )
      expect(tenant).toEqual(
        expect.objectContaining({
          ...tenantMock,
          deletedDate: expect.any(Date),
        }),
      )

      // Check IEntityOperationEvent message
      const entityDeletedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Deleted',
      )
      expect(entityDeletedEvent.entityId).toEqual(defaultEntityId)

      // Check IWalletOperationEvent message
      const walletDeletedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Deleted',
      )
      expect(walletDeletedEvent.address).toEqual(defaultWalletAddress)
    })
  })
})
