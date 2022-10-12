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
  WalletDeleteCommandBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { KafkaConsumer, KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
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
} from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, fetchWallet, deleteWallet } from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
require('dotenv').config()

jest.setTimeout(60000)

describe('Wallet delete operation', () => {
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

    await kafkaProducer.registerProducerEvents([Commands.walletDeleteCommand])

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
    it('Success when deleting a wallet', async () => {
      const walletToDelete = initialWalletsMock[0]
      const deleteWalletCommand = WalletDeleteCommandBuilder.get(
        tenantId1,
        entityId1,
        walletToDelete.address,
      ).build()

      // Send command
      await kafkaProducer.send(
        Commands.walletDeleteCommand,
        deleteWalletCommand,
      )

      // Check IWalletOperationEvent message
      const walletDeletedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Deleted',
      )
      expect(walletDeletedEvent).toEqual(
        expect.objectContaining({
          ...walletToDelete,
          metadata: JSON.stringify(walletToDelete.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Expect wallet to not return using endpoint
      await expect(
        fetchWallet(entityId1, walletToDelete.address, authToken),
      ).rejects.toThrow()

      // Expect wallet to be soft deleted
      const wallet = await walletRepo.findOne(
        { address: walletToDelete.address },
        { withDeleted: true },
      )
      expect(wallet).toEqual(
        expect.objectContaining({
          ...walletToDelete,
          deletedDate: expect.any(Date),
        }),
      )
    })
  })

  describe('HTTP Endpoints', () => {
    it('Success when deleting a wallet', async () => {
      const walletToDelete = initialWalletsMock[0]

      // Send request to delete a wallet
      await deleteWallet(entityId1, walletToDelete.address, authToken)

      // Check IWalletOperationEvent message
      const walletDeletedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Deleted',
      )
      expect(walletDeletedEvent).toEqual(
        expect.objectContaining({
          ...walletToDelete,
          metadata: JSON.stringify(walletToDelete.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Expect wallet to not return using endpoint
      await expect(
        fetchWallet(entityId1, walletToDelete.address, authToken),
      ).rejects.toThrow()

      // Expect wallet to be soft deleted
      const wallet = await walletRepo.findOne(
        { address: walletToDelete.address },
        { withDeleted: true },
      )
      expect(wallet).toEqual(
        expect.objectContaining({
          ...walletToDelete,
          deletedDate: expect.any(Date),
        }),
      )
    })

    it('Throws when deleting the default wallet', async () => {
      const walletToDelete = initialWalletsMock.find(
        (w) => w.address === walletAddressMock,
      )

      // Expect delete request to throw
      await expect(
        deleteWallet(entityId1, walletToDelete.address, authToken),
      ).rejects.toThrow()

      // Expect wallet to not be deleted
      const { data: result } = await fetchWallet(
        entityId1,
        walletAddressMock,
        authToken,
      )
      expect(result).toEqual(expect.objectContaining(walletToDelete))
    })
  })
})
