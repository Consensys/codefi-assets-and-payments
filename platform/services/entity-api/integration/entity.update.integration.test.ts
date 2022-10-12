import {
  decodeToken,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
} from '@codefi-assets-and-payments/auth'
import {
  Commands,
  Events,
  IEntityOperationEvent,
  ITenantOperationEvent,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import { EntityUpdateCommandBuilder } from '@codefi-assets-and-payments/messaging-events/dist/messages/commands/EntityUpdateCommand'
import { KafkaConsumer, KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EntityStoreEntity } from '../src/data/entities/EntityStoreEntity'
import { TenantStoreEntity } from '../src/data/entities/TenantStoreEntity'
import { Repository } from 'typeorm'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import {
  entityMock,
  entityUpdateMock,
  initialWalletsMock,
  storeMappingsMock,
  tenantMock,
} from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, updateEntity } from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
import { TenantCreateRequest, EntityUpdateRequest } from '@codefi-assets-and-payments/ts-types'
require('dotenv').config()

jest.setTimeout(60000)

describe('Entity update operation', () => {
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
  let sub: string
  let tenantId1: string
  let entityId1: string

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

    await kafkaProducer.registerProducerEvents([Commands.entityUpdateCommand])

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
    entityId1 = extractEntityIdFromToken(decodedToken)
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
      initialEntities: [
        {
          id: entityId1,
          name: entityMock.name,
          metadata: entityMock.metadata,
          initialWallets: initialWalletsMock,
          defaultWallet: initialWalletsMock[1].address,
        },
      ],
    }
    await createTenant(createTenantRequest, authToken)
    await tenantOperationEventSubscriber.consumeMessage('Tenant Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Updated')
    for (let i = 0; i < initialWalletsMock.length; i++) {
      await walletOperationEventSubscriber.consumeMessage(`Wallet ${i} Created`)
    }
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
    it('Success when updating an entity', async () => {
      const defaultWallet = initialWalletsMock[0].address
      const updateEntityCommand = EntityUpdateCommandBuilder.get(
        tenantId1,
        entityId1,
        entityUpdateMock.name,
        JSON.stringify(entityUpdateMock.metadata),
        defaultWallet,
      ).build()

      // Send command
      await kafkaProducer.send(
        Commands.entityUpdateCommand,
        updateEntityCommand,
      )

      // Check IEntityOperationEvent message
      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Updated',
      )
      expect(entityUpdatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.UPDATE,
          entityId: entityId1,
          tenantId: tenantId1,
          name: entityUpdateMock.name,
          metadata: JSON.stringify(entityUpdateMock.metadata),
          defaultWallet,
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )
    })

    it('Success when updating an entity with stores', async () => {
      const defaultWallet = initialWalletsMock[0].address
      const updateEntityCommand = EntityUpdateCommandBuilder.get(
        tenantId1,
        entityId1,
        entityUpdateMock.name,
        JSON.stringify(entityUpdateMock.metadata),
        defaultWallet,
      )
        .stores(storeMappingsMock)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.entityUpdateCommand,
        updateEntityCommand,
      )

      // Check IEntityOperationEvent message
      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Updated',
      )
      expect(entityUpdatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.UPDATE,
          entityId: entityId1,
          tenantId: tenantId1,
          name: entityUpdateMock.name,
          metadata: JSON.stringify(entityUpdateMock.metadata),
          defaultWallet,
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check resulting entity store mappings
      const entityStores = await entityStoreRepo.find({})
      expect(entityStores.length).toBe(2)
      expect(entityStores[0]).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          entityId: entityId1,
          ...storeMappingsMock[0],
        }),
      )
      expect(entityStores[1]).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          entityId: entityId1,
          ...storeMappingsMock[1],
        }),
      )
    })
  })

  describe('HTTP Endpoints', () => {
    it('Success when updating an entity', async () => {
      const defaultWallet = initialWalletsMock[0].address
      const updateEntityRequest: EntityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet,
      }

      // Send request and check result
      const { data: result } = await updateEntity(
        entityId1,
        updateEntityRequest,
        authToken,
      )
      expect(result).toEqual(
        expect.objectContaining({
          ...updateEntityRequest,
          id: entityId1,
          tenantId: tenantId1,
          defaultWallet,
        }),
      )

      // Check events
      await entityOperationEventSubscriber.consumeMessage('Entity Updated')
    })

    it('Success when updating an entity with stores', async () => {
      const defaultWallet = initialWalletsMock[0].address
      const updateEntityRequest: EntityUpdateRequest = {
        ...entityUpdateMock,
        defaultWallet,
      }

      // Send request and check result
      const { data: result } = await updateEntity(
        entityId1,
        { ...updateEntityRequest, stores: storeMappingsMock },
        authToken,
      )
      expect(result).toEqual(
        expect.objectContaining({
          ...updateEntityRequest,
          id: entityId1,
          tenantId: tenantId1,
          defaultWallet,
        }),
      )

      // Check events
      await entityOperationEventSubscriber.consumeMessage('Entity Updated')

      // Check resulting entity store mappings
      const entityStores = await entityStoreRepo.find({})
      expect(entityStores.length).toBe(2)
      expect(entityStores[0]).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          entityId: entityId1,
          ...storeMappingsMock[0],
        }),
      )
      expect(entityStores[1]).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          entityId: entityId1,
          ...storeMappingsMock[1],
        }),
      )
    })
  })
})
