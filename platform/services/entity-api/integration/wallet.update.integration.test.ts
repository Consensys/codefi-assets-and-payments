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
  WalletUpdateCommandBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { KafkaProducer, KafkaConsumer } from '@codefi-assets-and-payments/nestjs-messaging'
import { TenantCreateRequest } from '@codefi-assets-and-payments/ts-types'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import {
  entityMock,
  initialWalletsMock,
  tenantMock,
  walletAddressMock,
  walletUpdateMock,
} from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, fetchEntity, updateWallet } from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
require('dotenv').config()

jest.setTimeout(60000)

describe('Wallet update operation', () => {
  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>
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

    await kafkaProducer.registerProducerEvents([Commands.walletUpdateCommand])

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
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})

    // Create initial tenant
    const tenantRequest: TenantCreateRequest = {
      ...tenantMock,
      id: tenantId1,
      initialEntities: [
        {
          id: entityId1,
          name: entityMock.name,
          initialWallets: initialWalletsMock,
          defaultWallet: walletAddressMock,
        },
      ],
    }
    await createTenant(tenantRequest, authToken)
    await tenantOperationEventSubscriber.consumeMessage('Tenant Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Updated')
    const walletEvents = initialWalletsMock.map((_, i) =>
      walletOperationEventSubscriber.consumeMessage(`Wallet ${i} Created`),
    )
    await Promise.all(walletEvents)
  })

  afterEach(async () => {
    // Clear DB and pending messages
    await tenantOperationEventSubscriber.cleanMessages()
    await entityOperationEventSubscriber.cleanMessages()
    await walletOperationEventSubscriber.cleanMessages()
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})
  })

  afterAll(async () => {
    await kafkaConsumer.disconnectAllConsumers()
    await appModule.close()
  })

  describe('Kafka Commands', () => {
    it('Success when updating a wallet', async () => {
      const walletToUpdate = initialWalletsMock[0]
      const updateWalletCommand = WalletUpdateCommandBuilder.get(
        tenantId1,
        entityId1,
        walletToUpdate.address,
        JSON.stringify(walletUpdateMock.metadata),
      ).build()

      // Send command
      await kafkaProducer.send(
        Commands.walletUpdateCommand,
        updateWalletCommand,
      )

      // Check IWalletOperationEvent message
      const walletUpdatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Updated',
      )
      expect(walletUpdatedEvent).toEqual(
        expect.objectContaining({
          ...walletToUpdate,
          metadata: JSON.stringify(walletUpdateMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )
    })

    it('Success when updating a wallet and setting it as default', async () => {
      const walletToUpdate = initialWalletsMock[0]
      const updateWalletCommand = WalletUpdateCommandBuilder.get(
        tenantId1,
        entityId1,
        walletToUpdate.address,
        JSON.stringify(walletUpdateMock.metadata),
      )
        .setAsDefault(true)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.walletUpdateCommand,
        updateWalletCommand,
      )

      // Check IWalletOperationEvent message
      const walletUpdatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Updated',
      )
      expect(walletUpdatedEvent).toEqual(
        expect.objectContaining({
          ...walletToUpdate,
          metadata: JSON.stringify(walletUpdateMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check IEntityOperationEvent message
      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Updated',
      )
      expect(entityUpdatedEvent).toEqual(
        expect.objectContaining({
          entityId: entityId1,
          defaultWallet: walletToUpdate.address,
        }),
      )
    })
  })

  describe('HTTP Endpoints', () => {
    it('Success when updating a wallet', async () => {
      const walletToUpdate = initialWalletsMock[0]

      const { data: updateWalletResult } = await updateWallet(
        entityId1,
        walletToUpdate.address,
        walletUpdateMock,
        authToken,
      )
      expect(updateWalletResult).toEqual(
        expect.objectContaining({
          ...walletToUpdate,
          metadata: walletUpdateMock.metadata,
          updatedAt: expect.any(String),
        }),
      )

      const { data: entityResult } = await fetchEntity(entityId1, authToken)
      expect(entityResult.defaultWallet).toEqual(walletAddressMock)

      // Check IWalletOperationEvent message
      const walletUpdatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Updated',
      )
      expect(walletUpdatedEvent).toEqual(
        expect.objectContaining({
          ...walletToUpdate,
          metadata: JSON.stringify(walletUpdateMock.metadata),
          createdBy: sub,
          createdAt: updateWalletResult.createdAt,
        }),
      )
    })

    it('Success when updating a wallet and setting it as default', async () => {
      const walletToUpdate = initialWalletsMock[0]

      const { data: updateWalletResult } = await updateWallet(
        entityId1,
        walletToUpdate.address,
        walletUpdateMock,
        authToken,
        true,
      )
      expect(updateWalletResult).toEqual(
        expect.objectContaining({
          ...walletToUpdate,
          metadata: walletUpdateMock.metadata,
          updatedAt: expect.any(String),
        }),
      )

      const { data: entityResult } = await fetchEntity(entityId1, authToken)
      expect(entityResult.defaultWallet).toEqual(walletToUpdate.address)

      // Check IWalletOperationEvent message
      const walletUpdatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Updated',
      )
      expect(walletUpdatedEvent).toEqual(
        expect.objectContaining({
          ...walletToUpdate,
          metadata: JSON.stringify(walletUpdateMock.metadata),
          createdBy: sub,
          createdAt: updateWalletResult.createdAt,
        }),
      )

      // Check IEntityOperationEvent message
      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Updated',
      )
      expect(entityUpdatedEvent).toEqual(
        expect.objectContaining({
          entityId: entityId1,
          defaultWallet: walletToUpdate.address,
        }),
      )
    })
  })
})
