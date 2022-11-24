import { decodeToken, extractTenantIdFromToken } from '@consensys/auth'
import {
  Commands,
  Events,
  IEntityOperationEvent,
  ITenantOperationEvent,
  IWalletOperationEvent,
  TenantUpdateCommandBuilder,
} from '@consensys/messaging-events'
import { KafkaConsumer, KafkaProducer } from '@consensys/nestjs-messaging'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EntityStoreEntity } from '../src/data/entities/EntityStoreEntity'
import { TenantStoreEntity } from '../src/data/entities/TenantStoreEntity'
import { Repository } from 'typeorm'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { storeMappingsMock, tenantMock, tenantUpdateMock } from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, fetchTenant, updateTenant } from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
import { TenantCreateRequest } from '@consensys/ts-types'
require('dotenv').config()

jest.setTimeout(60000)

describe('Tenant update operation', () => {
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

    await kafkaProducer.registerProducerEvents([Commands.tenantUpdateCommand])

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
    await tenantStoreRepo.delete({})
    await entityStoreRepo.delete({})
    await tenantRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})

    // Create new tenant
    const createTenantRequest: TenantCreateRequest = {
      ...tenantMock,
      id: tenantId1,
    }
    await createTenant(createTenantRequest, authToken)
    await tenantOperationEventSubscriber.consumeMessage('Tenant Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Updated')
    await walletOperationEventSubscriber.consumeMessage('Wallet Created')
  })

  afterEach(async () => {
    // Clear DB and pending messages
    await tenantOperationEventSubscriber.cleanMessages()
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
    it('Success when updating a tenant', async () => {
      const updateTenantCommand = TenantUpdateCommandBuilder.get(
        tenantId1,
        tenantUpdateMock.name,
        tenantUpdateMock.products,
        tenantUpdateMock.defaultNetworkKey,
        JSON.stringify(tenantUpdateMock.metadata),
      ).build()

      // Send command
      await kafkaProducer.send(
        Commands.tenantUpdateCommand,
        updateTenantCommand,
      )

      // Check ITenantOperationEvent message
      const tenantUpdatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Updated',
      )
      expect(tenantUpdatedEvent).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          name: tenantUpdateMock.name,
          products: tenantUpdateMock.products,
          defaultNetworkKey: tenantUpdateMock.defaultNetworkKey,
          metadata: JSON.stringify(tenantUpdateMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check stored tenant
      const { data: result } = await fetchTenant(tenantId1, authToken)
      expect(result).toEqual(
        expect.objectContaining({
          ...tenantUpdateMock,
          id: tenantId1,
          initialAdmins: [],
        }),
      )
    })

    it('Success when updating a tenant with stores', async () => {
      const updateTenantCommand = TenantUpdateCommandBuilder.get(
        tenantId1,
        tenantUpdateMock.name,
        tenantUpdateMock.products,
        tenantUpdateMock.defaultNetworkKey,
        JSON.stringify(tenantUpdateMock.metadata),
      )
        .stores(storeMappingsMock)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.tenantUpdateCommand,
        updateTenantCommand,
      )

      // Check ITenantOperationEvent message
      const tenantUpdatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Updated',
      )
      expect(tenantUpdatedEvent).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          name: tenantUpdateMock.name,
          products: tenantUpdateMock.products,
          defaultNetworkKey: tenantUpdateMock.defaultNetworkKey,
          metadata: JSON.stringify(tenantUpdateMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check stored tenant
      const { data: result } = await fetchTenant(tenantId1, authToken)
      expect(result).toEqual(
        expect.objectContaining({
          ...tenantUpdateMock,
          id: tenantId1,
          initialAdmins: [],
        }),
      )

      // Check resulting tenant store mappings
      const tenantStores = await tenantStoreRepo.find({})
      expect(tenantStores.length).toBe(2)
      expect(tenantStores[0]).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          ...storeMappingsMock[0],
        }),
      )
      expect(tenantStores[1]).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          ...storeMappingsMock[1],
        }),
      )
    })
  })

  describe('HTTP Endpoints', () => {
    it('Success when updating a tenant', async () => {
      // Send request and check result
      const { data: result } = await updateTenant(
        tenantId1,
        tenantUpdateMock,
        authToken,
      )

      expect(result).toEqual(
        expect.objectContaining({
          ...tenantUpdateMock,
          id: tenantId1,
          initialAdmins: [],
        }),
      )

      // Check ITenantOperationEvent message
      const tenantUpdatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Updated',
      )
      expect(tenantUpdatedEvent).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          name: tenantUpdateMock.name,
          products: tenantUpdateMock.products,
          defaultNetworkKey: tenantUpdateMock.defaultNetworkKey,
          metadata: JSON.stringify(tenantUpdateMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )
    })

    it('Success when updating a tenant with stores', async () => {
      // Send request and check result
      const { data: result } = await updateTenant(
        tenantId1,
        { ...tenantUpdateMock, stores: storeMappingsMock },
        authToken,
      )

      expect(result).toEqual(
        expect.objectContaining({
          ...tenantUpdateMock,
          id: tenantId1,
          initialAdmins: [],
        }),
      )

      // Check ITenantOperationEvent message
      const tenantUpdatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Updated',
      )

      expect(tenantUpdatedEvent).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          name: tenantUpdateMock.name,
          products: tenantUpdateMock.products,
          defaultNetworkKey: tenantUpdateMock.defaultNetworkKey,
          metadata: JSON.stringify(tenantUpdateMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check resulting tenant store mappings
      const tenantStores = await tenantStoreRepo.find({})
      expect(tenantStores.length).toBe(2)
      expect(tenantStores[0]).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          ...storeMappingsMock[0],
        }),
      )
      expect(tenantStores[1]).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          ...storeMappingsMock[1],
        }),
      )
    })
  })
})
