import {
  decodeToken,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
} from '@consensys/auth'
import {
  Commands,
  Events,
  IEntityOperationEvent,
  ITenantOperationEvent,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@consensys/messaging-events'
import { EntityDeleteCommandBuilder } from '@consensys/messaging-events/dist/messages/commands/EntityDeleteCommand'
import { KafkaConsumer, KafkaProducer } from '@consensys/nestjs-messaging'
import { TenantCreateRequest, WalletType } from '@consensys/ts-types'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { EntityStoreEntity } from '../src/data/entities/EntityStoreEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { TenantStoreEntity } from '../src/data/entities/TenantStoreEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { entityMock, storeMappingsMock, tenantMock } from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, fetchEntity, deleteEntity } from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
require('dotenv').config()

jest.setTimeout(60000)

describe('Entity delete operation', () => {
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

    await kafkaProducer.registerProducerEvents([Commands.entityDeleteCommand])

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
          stores: storeMappingsMock,
        },
      ],
    }

    // Send request to create a tenant
    await createTenant(createTenantRequest, authToken)
    await tenantOperationEventSubscriber.consumeMessage('Tenant Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Created')
    await walletOperationEventSubscriber.consumeMessage('Wallet Created')
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
    it('Success when deleting an entity', async () => {
      const deleteEntityCommand = EntityDeleteCommandBuilder.get(
        tenantId1,
        entityId1,
      ).build()

      // Send command
      await kafkaProducer.send(
        Commands.entityDeleteCommand,
        deleteEntityCommand,
      )

      // Check IEntityOperationEvent message
      const entityDeletedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Deleted',
      )
      expect(entityDeletedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.DELETE,
          entityId: entityId1,
          tenantId: tenantId1,
          name: entityMock.name,
          metadata: JSON.stringify(entityMock.metadata),
          defaultWallet: expect.any(String),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check IWalletOperationEvent message
      const walletDeletedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Deleted',
      )
      expect(walletDeletedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.DELETE,
          address: expect.any(String),
          entityId: entityId1,
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )
    })
  })

  describe('HTTP Endpoints', () => {
    it('Success when deleting an entity', async () => {
      // Send request to delete an entity
      await deleteEntity(entityId1, authToken)

      // Expect entity to not return using endpoint
      await expect(fetchEntity(entityId1, authToken)).rejects.toThrow()

      // Expect entity to be soft deleted
      const entity = await entityRepo.findOne(
        { id: entityId1 },
        { withDeleted: true },
      )
      expect(entity).toEqual(
        expect.objectContaining({
          id: entityId1,
          tenantId: tenantId1,
          deletedDate: expect.any(Date),
        }),
      )

      // Check events
      await entityOperationEventSubscriber.consumeMessage('Entity Deleted')
      await walletOperationEventSubscriber.consumeMessage('Wallet Deleted')
    })
  })
})
