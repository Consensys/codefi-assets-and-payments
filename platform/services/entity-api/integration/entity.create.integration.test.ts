import {
  Commands,
  Events,
  IEntityOperationEvent,
  IEntityWallet,
  ITenantOperationEvent,
  IUserCreateCommand,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import { EntityCreateCommandBuilder } from '@codefi-assets-and-payments/messaging-events'
import { KafkaConsumer, KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import {
  EntityCreateRequest,
  EntityStatus,
  TenantCreateRequest,
  WalletType,
} from '@codefi-assets-and-payments/ts-types'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import {
  entityIdMock,
  entityMock,
  initialAdminsMock,
  initialWalletsMock,
  storeIdReal,
  storeMappingsMock,
  tenantIdMock,
  tenantMock,
} from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import {
  createTenant,
  createEntity,
  fetchWallets,
  fetchOrchestrateAccount,
} from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import {
  decodeToken,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
} from '@codefi-assets-and-payments/auth'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
import { ethereumAddressRegEx } from '../src/utils/utils'
import { EntityStoreEntity } from '../src/data/entities/EntityStoreEntity'
import { TenantStoreEntity } from '../src/data/entities/TenantStoreEntity'
require('dotenv').config()

jest.setTimeout(60000)

describe('Entity create operation', () => {
  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>
  let tenantStoreRepo: Repository<TenantStoreEntity>
  let entityStoreRepo: Repository<EntityStoreEntity>
  let kafkaProducer: KafkaProducer
  let kafkaConsumer: KafkaConsumer
  let userCreatedCommandSubscriber: TestKafkaSubscriber<IUserCreateCommand>
  let tenantOperationEventSubscriber: TestKafkaSubscriber<ITenantOperationEvent>
  let entityOperationEventSubscriber: TestKafkaSubscriber<IEntityOperationEvent>
  let walletOperationEventSubscriber: TestKafkaSubscriber<IWalletOperationEvent>

  let authToken: string
  let sub: string
  let tenantId1: string
  let entityId1: string

  beforeAll(async () => {
    const userCreatedCommandSubscriberName = 'userCreatedCommandSubscriber'
    const tenantOperationEventSubscriberName = 'tenantOperationEventSubscriber'
    const entityOperationEventSubscriberName = 'entityOperationEventSubscriber'
    const walletOperationEventSubscriberName = 'walletOperationEventSubscriber'
    appModule = await testModule([
      userCreatedCommandSubscriberName,
      tenantOperationEventSubscriberName,
      entityOperationEventSubscriberName,
      walletOperationEventSubscriberName,
    ])

    // Set up producers and subscribers
    kafkaProducer = appModule.get(KafkaProducer)
    kafkaConsumer = appModule.get(KafkaConsumer)

    await kafkaProducer.registerProducerEvents([Commands.entityCreateCommand])

    userCreatedCommandSubscriber = await subscribeToMessage(
      appModule,
      kafkaConsumer,
      Commands.userCreateCommand,
      userCreatedCommandSubscriberName,
    )
    await userCreatedCommandSubscriber.cleanMessages()

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
    await userCreatedCommandSubscriber.cleanMessages()
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
    }
    await createTenant(createTenantRequest, authToken)
    await tenantOperationEventSubscriber.consumeMessage('Tenant Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Updated')
    await walletOperationEventSubscriber.consumeMessage('Wallet Created')
  })

  afterEach(async () => {
    // Clear DB and pending messages
    await userCreatedCommandSubscriber.cleanMessages()
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
    it('Success when creating a new entity with initial admins', async () => {
      const createEntityCommand = EntityCreateCommandBuilder.get(
        tenantId1,
        entityMock.name,
      )
        .entityId(entityId1)
        .metadata(JSON.stringify(entityMock.metadata))
        .initialAdmins(initialAdminsMock)
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.entityCreateCommand,
        createEntityCommand,
      )

      // Check IEntityOperationEvent message
      const entityCreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Created',
      )
      expect(entityCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entityId1,
          tenantId: tenantId1,
          name: entityMock.name,
          metadata: JSON.stringify(entityMock.metadata),
          defaultWallet: '',
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Updated',
      )
      expect(entityUpdatedEvent.defaultWallet).toMatch(ethereumAddressRegEx)

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          address: expect.any(String),
          entityId: entityId1,
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      for (let i = 0; i < initialAdminsMock.length; i++) {
        const admin = initialAdminsMock[i]

        const createAdminCommand = await userCreatedCommandSubscriber.consumeMessage(
          `Create admin ${i}`,
        )

        expect(createAdminCommand).toEqual(
          expect.objectContaining({
            ...admin,
            appMetadata: JSON.stringify({}),
            applicationClientId: null,
            connection: null,
            password: null,
            emailVerified: false,
            roles: ['Entity Admin'],
            tenantId: tenantId1,
            entityId: entityId1,
            product: null,
          }),
        )
      }
    })

    it('Success when creating a new entity with initial wallets', async () => {
      const defaultWallet = initialWalletsMock[1].address
      const createEntityCommand = EntityCreateCommandBuilder.get(
        tenantId1,
        entityMock.name,
      )
        .entityId(entityId1)
        .metadata(JSON.stringify(entityMock.metadata))
        .initialWallets(
          initialWalletsMock.map((wallet) => ({
            address: wallet.address || null,
            type: wallet.type,
            metadata: JSON.stringify(wallet.metadata),
          })),
        )
        .defaultWallet(defaultWallet)
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.entityCreateCommand,
        createEntityCommand,
      )

      // Check IEntityOperationEvent message
      const entityCreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Created',
      )
      expect(entityCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entityId1,
          tenantId: tenantId1,
          name: entityMock.name,
          metadata: JSON.stringify(entityMock.metadata),
          defaultWallet: '',
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Updated',
      )
      expect(entityUpdatedEvent.defaultWallet).toEqual(defaultWallet)

      // Check IWalletOperationEvent messages
      for (let i = 0; i < initialWalletsMock.length; i++) {
        const wallet = initialWalletsMock[i]

        const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
          `Wallet ${i} Created`,
        )

        expect(walletCreatedEvent).toEqual(
          expect.objectContaining({
            operation: MessageDataOperation.CREATE,
            address: wallet.address || expect.any(String),
            entityId: entityId1,
            type: wallet.type,
            metadata: JSON.stringify(wallet.metadata),
            createdBy: sub,
            createdAt: expect.any(String),
          }),
        )
      }
    })

    it('Success when creating a new entity with stores and initial wallets', async () => {
      const initialWallets = [
        ...initialWalletsMock,
        {
          address: null,
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: {},
        },
        {
          address: null,
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: {},
        },
      ]
      const initialWalletsBuilder: IEntityWallet[] = initialWallets.map(
        (wallet) => ({
          ...wallet,
          address: wallet.address,
          metadata: JSON.stringify(wallet.metadata),
        }),
      )
      const stores = [
        ...storeMappingsMock,
        {
          walletType: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          storeId: storeIdReal,
        },
      ]

      const createEntityCommand = EntityCreateCommandBuilder.get(
        tenantId1,
        entityMock.name,
      )
        .entityId(entityId1)
        .metadata(JSON.stringify(entityMock.metadata))
        .initialWallets(initialWalletsBuilder)
        .stores(stores)
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.entityCreateCommand,
        createEntityCommand,
      )

      // Check IEntityOperationEvent message
      const entityCreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Created',
      )
      expect(entityCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entityId1,
          tenantId: tenantId1,
          name: entityMock.name,
          metadata: JSON.stringify(entityMock.metadata),
          defaultWallet: '',
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Updated',
      )
      expect(entityUpdatedEvent.defaultWallet).toMatch(ethereumAddressRegEx)

      // Check wallets
      const { data: wallets } = await fetchWallets(entityId1, {}, authToken)
      expect(wallets.items).toEqual(
        initialWallets.reverse().map((wallet) =>
          expect.objectContaining({
            address: wallet.address || expect.any(String),
            type: wallet.type,
            metadata: wallet.metadata || {},
          }),
        ),
      )

      // Check events
      await walletOperationEventSubscriber.consumeMessage('Wallet Created')

      // Check resulting entity store mappings
      const entityStores = await entityStoreRepo.find({})
      expect(entityStores.length).toBe(3)

      entityStores.forEach((entityStore, index) => {
        expect(entityStore).toEqual(
          expect.objectContaining({
            tenantId: tenantIdMock,
            entityId: entityIdMock,
            ...stores[index],
          }),
        )
      })

      const azureWallets = wallets.items.filter(
        (wallet) => wallet.type === WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      )
      expect(azureWallets.length).toBe(2)

      for (const wallet of azureWallets) {
        // Check store ID field on wallet in database
        expect(wallet.storeId).toEqual(storeIdReal)

        // Check store ID according to Orchestrate
        const orchestrateAccount = await fetchOrchestrateAccount(
          wallet.address,
          authToken,
        )
        expect(orchestrateAccount.data.storeID).toBe(storeIdReal)
      }
    })
  })

  describe('HTTP Endpoints', () => {
    it('Success when creating a new entity with initial admins', async () => {
      const createEntityRequest: EntityCreateRequest = {
        ...entityMock,
        id: entityId1,
        initialAdmins: initialAdminsMock,
      }

      // Send request and check result
      const { data: createEntityResult } = await createEntity(
        createEntityRequest,
        authToken,
      )
      const { data: wallets } = await fetchWallets(entityId1, {}, authToken)
      expect(createEntityResult).toEqual(
        expect.objectContaining({
          ...createEntityRequest,
          initialAdmins: initialAdminsMock.map((admin) => ({
            ...admin,
            status: EntityStatus.Pending,
          })),
          defaultWallet: wallets.items[0].address,
        }),
      )
      expect(wallets.items).toEqual([
        expect.objectContaining({
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          metadata: {},
        }),
      ])

      // Check events
      await entityOperationEventSubscriber.consumeMessage('Entity Created')
      await entityOperationEventSubscriber.consumeMessage('Entity Updated')
      await walletOperationEventSubscriber.consumeMessage('Wallet Created')

      for (let i = 0; i < initialAdminsMock.length; i++) {
        const admin = initialAdminsMock[i]

        const createAdminCommand = await userCreatedCommandSubscriber.consumeMessage(
          `Create admin ${i}`,
        )

        expect(createAdminCommand).toEqual(
          expect.objectContaining({
            ...admin,
            appMetadata: JSON.stringify({}),
            applicationClientId: null,
            connection: null,
            password: null,
            emailVerified: false,
            roles: ['Entity Admin'],
            tenantId: tenantId1,
            entityId: entityId1,
            product: null,
          }),
        )
      }
    })

    it('Success when creating a new entity with initial wallets', async () => {
      const defaultWallet = initialWalletsMock[1].address
      const createEntityRequest: EntityCreateRequest = {
        ...entityMock,
        id: entityId1,
        initialWallets: initialWalletsMock,
        defaultWallet,
      }

      // Send request and check result
      const { data: createEntityResult } = await createEntity(
        createEntityRequest,
        authToken,
      )
      const { data: wallets } = await fetchWallets(entityId1, {}, authToken)
      expect(createEntityResult).toEqual(
        expect.objectContaining({
          ...entityMock,
          id: createEntityRequest.id,
          initialAdmins: [],
          defaultWallet,
        }),
      )
      expect(wallets.items).toEqual(
        initialWalletsMock.reverse().map((wallet) =>
          expect.objectContaining({
            address: wallet.address || expect.any(String),
            type: wallet.type,
            metadata: wallet.metadata || {},
          }),
        ),
      )

      // Check events
      await entityOperationEventSubscriber.consumeMessage('Entity Created')
      await entityOperationEventSubscriber.consumeMessage('Entity Updated')
      for (let i = 0; i < initialWalletsMock.length; i++) {
        await walletOperationEventSubscriber.consumeMessage(
          `Wallet ${i} Created`,
        )
      }
    })

    it('Success when creating a new entity with stores and initial wallets', async () => {
      const createEntityRequest: EntityCreateRequest = {
        ...entityMock,
        id: entityId1,
      }
      const initialWallets = [
        ...initialWalletsMock,
        {
          address: undefined,
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: undefined,
        },
        {
          address: undefined,
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: undefined,
        },
      ]
      const stores = [
        ...storeMappingsMock,
        {
          walletType: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          storeId: storeIdReal,
        },
      ]

      const { data: createEntityResult } = await createEntity(
        {
          ...createEntityRequest,
          initialWallets,
          stores,
        },
        authToken,
      )

      // Check result
      expect(createEntityResult).toEqual(
        expect.objectContaining({
          ...createEntityRequest,
        }),
      )

      // Check wallets
      const { data: wallets } = await fetchWallets(entityId1, {}, authToken)
      expect(wallets.items).toEqual(
        initialWallets.reverse().map((wallet) =>
          expect.objectContaining({
            address: wallet.address || expect.any(String),
            type: wallet.type,
            metadata: wallet.metadata || {},
          }),
        ),
      )

      // Check events
      await entityOperationEventSubscriber.consumeMessage('Entity Created')
      await entityOperationEventSubscriber.consumeMessage('Entity Updated')
      await walletOperationEventSubscriber.consumeMessage('Wallet Created')

      // Check resulting entity store mappings
      const entityStores = await entityStoreRepo.find({})
      expect(entityStores.length).toBe(3)

      entityStores.forEach((entityStore, index) => {
        expect(entityStore).toEqual(
          expect.objectContaining({
            tenantId: tenantIdMock,
            entityId: entityIdMock,
            ...stores[index],
          }),
        )
      })

      const azureWallets = wallets.items.filter(
        (wallet) => wallet.type === WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      )
      expect(azureWallets.length).toBe(2)

      for (const wallet of azureWallets) {
        // Check store ID field on wallet in database
        expect(wallet.storeId).toEqual(storeIdReal)

        // Check store ID according to Orchestrate
        const orchestrateAccount = await fetchOrchestrateAccount(
          wallet.address,
          authToken,
        )
        expect(orchestrateAccount.data.storeID).toBe(storeIdReal)
      }
    })
  })
})
