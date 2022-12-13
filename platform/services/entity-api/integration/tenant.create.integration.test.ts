import { decodeToken, extractTenantIdFromToken } from '@consensys/auth'
import {
  Commands,
  Events,
  IEntityOperationEvent,
  ITenantEntity,
  ITenantOperationEvent,
  IUserCreateCommand,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@consensys/messaging-events'
import { TenantCreateCommandBuilder } from '@consensys/messaging-events'
import { KafkaConsumer, KafkaProducer } from '@consensys/nestjs-messaging'
import {
  EntityCreateRequest,
  EntityStatus,
  TenantCreateRequest,
  WalletType,
} from '@consensys/ts-types'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EntityStoreEntity } from '../src/data/entities/EntityStoreEntity'
import { TenantStoreEntity } from '../src/data/entities/TenantStoreEntity'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { ethereumAddressRegEx } from '../src/utils/utils'
import {
  entityIdMock,
  entityMock,
  initialAdminsMock,
  initialWalletsMock,
  storeIdReal,
  storeMappingsMock,
  tenantIdMock,
  tenantMock,
  walletAddressMock,
} from '../test/mocks'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import {
  createTenant,
  fetchOrchestrateAccount,
  fetchTenant,
  fetchWallets,
} from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
require('dotenv').config()

jest.setTimeout(60000)

describe('Tenant create operation', () => {
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

    await kafkaProducer.registerProducerEvents([Commands.tenantCreateCommand])

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
    it('Success when creating a new tenant with initial admins', async () => {
      const createTenantCommand = TenantCreateCommandBuilder.get(
        tenantId1,
        tenantMock.name,
        tenantMock.products,
        tenantMock.defaultNetworkKey,
      )
        .metadata(JSON.stringify(tenantMock.metadata))
        .initialAdmins(initialAdminsMock)
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.tenantCreateCommand,
        createTenantCommand,
      )

      // Check ITenantOperationEvent message
      const tenantCreatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Created',
      )
      expect(tenantCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          tenantId: tenantId1,
          name: tenantMock.name,
          products: tenantMock.products,
          defaultNetworkKey: tenantMock.defaultNetworkKey,
          metadata: JSON.stringify(tenantMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check IEntityOperationEvent message
      const entityCreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Created',
      )
      expect(entityCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: expect.any(String),
          tenantId: tenantId1,
          name: 'Admin Entity',
          defaultWallet: expect.any(String),
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity updated',
      )
      expect(entityUpdatedEvent.defaultWallet).toMatch(ethereumAddressRegEx)

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entityCreatedEvent.entityId,
          address: expect.any(String),
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
            roles: ['Tenant Admin'],
            tenantId: tenantId1,
            entityId: entityCreatedEvent.entityId,
            product: null,
          }),
        )
      }
    })

    it('Success when creating a new tenant with initial entities', async () => {
      const entity1: ITenantEntity = {
        entityId: entityMock.id,
        name: entityMock.name,
        metadata: JSON.stringify(entityMock.metadata),
        initialAdmins: null,
        initialWallets: initialWalletsMock.map((wallet) => ({
          address: wallet.address || null,
          type: wallet.type,
          metadata: JSON.stringify(wallet.metadata),
        })),
        defaultWallet: walletAddressMock,
      }
      const entity2: ITenantEntity = {
        entityId: uuidv4(),
        name: 'Entity 2',
        metadata: JSON.stringify({}),
        initialAdmins: null,
        initialWallets: null,
        defaultWallet: null,
      }
      const createTenantCommand = TenantCreateCommandBuilder.get(
        tenantId1,
        tenantMock.name,
        tenantMock.products,
        tenantMock.defaultNetworkKey,
      )
        .metadata(JSON.stringify(tenantMock.metadata))
        .initialEntities([entity1, entity2])
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.tenantCreateCommand,
        createTenantCommand,
      )

      // Check ITenantOperationEvent message
      const tenantCreatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Created',
      )
      expect(tenantCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          tenantId: tenantId1,
          name: createTenantCommand.name,
          metadata: createTenantCommand.metadata,
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check IEntityOperationEvent message
      const entity1CreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 1 Created',
      )
      expect(entity1CreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entity1.entityId,
          tenantId: tenantId1,
          name: entity1.name,
          defaultWallet: '',
          metadata: entity1.metadata,
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entity1UpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 1 updated',
      )
      expect(entity1UpdatedEvent.defaultWallet).toEqual(walletAddressMock)

      const entity2CreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 2 Created',
      )
      expect(entity2CreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entity2.entityId,
          tenantId: tenantId1,
          name: entity2.name,
          defaultWallet: '',
          metadata: entity2.metadata,
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entity2UpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 2 updated',
      )
      expect(entity2UpdatedEvent.defaultWallet).toMatch(ethereumAddressRegEx)

      // Check IWalletOperationEvent message
      for (let i = 0; i < entity1.initialWallets.length; i++) {
        const wallet = entity1.initialWallets[i]

        const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
          `Wallet ${i} for entity ${entity1.entityId} Created`,
        )
        expect(walletCreatedEvent).toEqual(
          expect.objectContaining({
            operation: MessageDataOperation.CREATE,
            entityId: entity1.entityId,
            address: wallet.address || expect.any(String),
            type: wallet.type,
            metadata: wallet.metadata,
            createdBy: sub,
            createdAt: expect.any(String),
          }),
        )
      }

      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        `Wallet for entity ${entity2.entityId} Created`,
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entity2.entityId,
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          metadata: entity2.metadata,
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check stored tenant
      const { data: result } = await fetchTenant(tenantId1, authToken)
      expect(result).toEqual(
        expect.objectContaining({
          ...tenantMock,
          id: tenantId1,
          initialAdmins: [],
        }),
      )
    })

    it('Success when creating a new tenant with stores and initial entities and initial wallets', async () => {
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
      const initialEntities = [
        {
          ...entityMock,
          entityId: entityMock.id,
          initialWallets,
          defaultWallet: walletAddressMock,
        },
      ]
      const initialEntitiesBuilder = initialEntities.map((entity) => ({
        ...entity,
        initialAdmins: [],
        metadata: JSON.stringify(entity.metadata),
        initialWallets: entity.initialWallets.map((wallet) => ({
          ...wallet,
          address: wallet.address || null,
          metadata: JSON.stringify(wallet.metadata),
        })),
      }))
      const stores = [
        ...storeMappingsMock,
        {
          walletType: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          storeId: storeIdReal,
        },
      ]

      const createTenantCommand = TenantCreateCommandBuilder.get(
        tenantId1,
        tenantMock.name,
        tenantMock.products,
        tenantMock.defaultNetworkKey,
      )
        .metadata(JSON.stringify(tenantMock.metadata))
        .initialEntities(initialEntitiesBuilder)
        .stores(stores)
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.tenantCreateCommand,
        createTenantCommand,
      )

      // Check ITenantOperationEvent message
      const tenantCreatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Created',
      )
      expect(tenantCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          tenantId: tenantId1,
          name: tenantMock.name,
          products: tenantMock.products,
          defaultNetworkKey: tenantMock.defaultNetworkKey,
          metadata: JSON.stringify(tenantMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      // Check IEntityOperationEvent message
      const entity1CreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 1 Created',
      )
      expect(entity1CreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: initialEntitiesBuilder[0].entityId,
          tenantId: tenantId1,
          name: initialEntitiesBuilder[0].name,
          defaultWallet: '',
          metadata: initialEntitiesBuilder[0].metadata,
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity updated',
      )
      expect(entityUpdatedEvent.defaultWallet).toMatch(ethereumAddressRegEx)

      // Check IWalletOperationEvent message
      for (let i = 0; i < initialWallets.length; i++) {
        const wallet = initialWallets[i]

        const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
          `Wallet ${i} for entity ${entityMock.id} Created`,
        )
        expect(walletCreatedEvent).toEqual(
          expect.objectContaining({
            operation: MessageDataOperation.CREATE,
            entityId: entityMock.id,
            address: expect.any(String),
            type: wallet.type,
            metadata: JSON.stringify(wallet.metadata),
            createdBy: sub,
            createdAt: expect.any(String),
          }),
        )
      }

      // Check resulting tenant store mappings
      const tenantStores = await tenantStoreRepo.find({})
      expect(tenantStores.length).toBe(3)

      tenantStores.forEach((tenantStore, index) => {
        expect(tenantStore).toEqual(
          expect.objectContaining({
            tenantId: tenantIdMock,
            ...stores[index],
          }),
        )
      })

      const { data: wallets } = await fetchWallets(entityIdMock, {}, authToken)
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
    it('Success when creating a new tenant with initial admins', async () => {
      const createTenantRequest: TenantCreateRequest = {
        ...tenantMock,
        id: tenantId1,
        initialAdmins: initialAdminsMock,
      }

      // Send request and check result
      const { data: createTenantResult } = await createTenant(
        createTenantRequest,
        authToken,
      )
      expect(createTenantResult).toEqual(
        expect.objectContaining({
          ...createTenantRequest,
          initialAdmins: initialAdminsMock.map((admin) => ({
            ...admin,
            status: EntityStatus.Pending,
          })),
        }),
      )

      // Check ITenantOperationEvent message
      const tenantCreatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Created',
      )
      expect(tenantCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          tenantId: tenantId1,
          name: createTenantRequest.name,
          metadata: JSON.stringify(createTenantRequest.metadata),
          createdBy: sub,
          createdAt: createTenantResult.createdAt,
        }),
      )

      // Check IEntityOperationEvent message
      const entityCreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Created',
      )
      expect(entityCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: expect.any(String),
          tenantId: tenantId1,
          name: 'Admin Entity',
          defaultWallet: expect.any(String),
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity updated',
      )
      expect(entityUpdatedEvent.defaultWallet).toMatch(ethereumAddressRegEx)

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: expect.any(String),
          address: expect.any(String),
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
            roles: ['Tenant Admin'],
            tenantId: tenantId1,
            entityId: entityCreatedEvent.entityId,
            product: null,
          }),
        )
      }
    })

    it('Success when creating a new tenant with initial entities', async () => {
      const entity1: EntityCreateRequest = {
        id: entityMock.id,
        name: entityMock.name,
        metadata: entityMock.metadata,
        initialWallets: initialWalletsMock,
        defaultWallet: walletAddressMock,
      }
      const entity2: EntityCreateRequest = {
        id: uuidv4(),
        name: 'Entity 2',
        metadata: {},
      }
      const createTenantRequest: TenantCreateRequest = {
        ...tenantMock,
        id: tenantId1,
        initialEntities: [entity1, entity2],
      }

      // Send request and check result
      const { data: createTenantResult } = await createTenant(
        createTenantRequest,
        authToken,
      )
      expect(createTenantResult).toEqual(
        expect.objectContaining({
          id: createTenantRequest.id,
          name: createTenantRequest.name,
          products: createTenantRequest.products,
          defaultNetworkKey: createTenantRequest.defaultNetworkKey,
          metadata: createTenantRequest.metadata,
        }),
      )

      // Check ITenantOperationEvent message
      const tenantCreatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Created',
      )
      expect(tenantCreatedEvent).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          name: createTenantRequest.name,
          metadata: JSON.stringify(createTenantRequest.metadata),
          createdBy: sub,
          createdAt: createTenantResult.createdAt,
        }),
      )

      // Check IEntityOperationEvent message
      const entity1CreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 1 Created',
      )
      expect(entity1CreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entity1.id,
          tenantId: tenantId1,
          name: entity1.name,
          defaultWallet: '',
          metadata: JSON.stringify(entity1.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entity1UpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 1 updated',
      )
      expect(entity1UpdatedEvent.defaultWallet).toEqual(walletAddressMock)

      const entity2CreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 2 Created',
      )
      expect(entity2CreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entity2.id,
          tenantId: tenantId1,
          name: entity2.name,
          defaultWallet: expect.any(String),
          metadata: JSON.stringify(entity2.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entity2UpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 2 updated',
      )
      expect(entity2UpdatedEvent.defaultWallet).toMatch(ethereumAddressRegEx)

      // Check IWalletOperationEvent message
      for (let i = 0; i < entity1.initialWallets.length; i++) {
        const wallet = entity1.initialWallets[i]

        const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
          `Wallet ${i} for entity ${entity1.id} Created`,
        )
        expect(walletCreatedEvent).toEqual(
          expect.objectContaining({
            operation: MessageDataOperation.CREATE,
            entityId: entity1.id,
            address: wallet.address || expect.any(String),
            type: wallet.type,
            metadata: JSON.stringify(wallet.metadata),
            createdBy: sub,
            createdAt: expect.any(String),
          }),
        )
      }

      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        `Wallet for entity ${entity2.id} Created`,
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entity2.id,
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )
    })

    it('Success when creating a new tenant with stores and initial entities and initial wallets', async () => {
      const initialWallets = [
        ...initialWalletsMock,
        {
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: {},
        },
        {
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: {},
        },
      ]
      const initialEntities = [
        {
          ...entityMock,
          initialWallets,
          defaultWallet: walletAddressMock,
        },
      ]
      const stores = [
        ...storeMappingsMock,
        {
          walletType: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          storeId: storeIdReal,
        },
      ]
      const createTenantRequest: TenantCreateRequest = {
        ...tenantMock,
        id: tenantId1,
        initialEntities,
        stores,
      }

      // Send request and check result
      const { data: createTenantResult } = await createTenant(
        createTenantRequest,
        authToken,
      )

      expect(createTenantResult).toEqual(
        expect.objectContaining({
          id: createTenantRequest.id,
          name: createTenantRequest.name,
          products: createTenantRequest.products,
          defaultNetworkKey: createTenantRequest.defaultNetworkKey,
          metadata: createTenantRequest.metadata,
        }),
      )

      // Check ITenantOperationEvent message
      const tenantCreatedEvent = await tenantOperationEventSubscriber.consumeMessage(
        'Tenant Created',
      )
      expect(tenantCreatedEvent).toEqual(
        expect.objectContaining({
          tenantId: tenantId1,
          name: createTenantRequest.name,
          metadata: JSON.stringify(createTenantRequest.metadata),
          createdBy: sub,
          createdAt: createTenantResult.createdAt,
        }),
      )

      // Check IEntityOperationEvent message
      const entity1CreatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 1 Created',
      )
      expect(entity1CreatedEvent).toEqual(
        expect.objectContaining({
          operation: MessageDataOperation.CREATE,
          entityId: entityMock.id,
          tenantId: tenantId1,
          name: entityMock.name,
          defaultWallet: '',
          metadata: JSON.stringify(entityMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const entity1UpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity 1 updated',
      )
      expect(entity1UpdatedEvent.defaultWallet).toEqual(walletAddressMock)

      // Check IWalletOperationEvent message
      for (let i = 0; i < initialWallets.length; i++) {
        const wallet = initialWallets[i]

        const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
          `Wallet ${i} for entity ${entityMock.id} Created`,
        )
        expect(walletCreatedEvent).toEqual(
          expect.objectContaining({
            operation: MessageDataOperation.CREATE,
            entityId: entityMock.id,
            address: expect.any(String),
            type: wallet.type,
            metadata: JSON.stringify(wallet.metadata),
            createdBy: sub,
            createdAt: expect.any(String),
          }),
        )
      }

      // Check resulting tenant store mappings
      const tenantStores = await tenantStoreRepo.find({})
      expect(tenantStores.length).toBe(3)

      tenantStores.forEach((tenantStore, index) => {
        expect(tenantStore).toEqual(
          expect.objectContaining({
            tenantId: tenantIdMock,
            ...stores[index],
          }),
        )
      })

      const { data: wallets } = await fetchWallets(entityIdMock, {}, authToken)
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
