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
  WalletCreateCommandBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { KafkaProducer, KafkaConsumer } from '@codefi-assets-and-payments/nestjs-messaging'
import {
  TenantCreateRequest,
  WalletCreateRequest,
  WalletType,
} from '@codefi-assets-and-payments/ts-types'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import {
  entityMock,
  storeIdReal,
  tenantMock,
  walletAddressMock,
  walletMock,
} from '../test/mocks'
import {
  createTenant,
  updateTenant,
  fetchEntity,
  createWallet,
  fetchOrchestrateAccount,
  updateEntity,
} from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
import { OrchestrateAccountsService } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { toChecksumAddress } from 'web3-utils'
import { TenantStoreEntity } from '../src/data/entities/TenantStoreEntity'
import { EntityStoreEntity } from '../src/data/entities/EntityStoreEntity'
require('dotenv').config()

jest.setTimeout(60000)

describe('Wallet create operation', () => {
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

    await kafkaProducer.registerProducerEvents([Commands.walletCreateCommand])

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

    // Create initial tenant
    const tenantRequest: TenantCreateRequest = {
      ...tenantMock,
      id: tenantId1,
      initialEntities: [
        {
          id: entityId1,
          name: entityMock.name,
        },
      ],
    }
    await createTenant(tenantRequest, authToken)
    await tenantOperationEventSubscriber.consumeMessage('Tenant Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Created')
    await entityOperationEventSubscriber.consumeMessage('Entity Updated')
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
    it('Success when creating a new wallet and not setting it as default', async () => {
      const createWalletCommand = WalletCreateCommandBuilder.get(
        tenantId1,
        entityId1,
        WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
      )
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.walletCreateCommand,
        createWalletCommand,
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )
    })

    it('Success when creating a new wallet and setting it as default', async () => {
      const createWalletCommand = WalletCreateCommandBuilder.get(
        tenantId1,
        entityId1,
        WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
      )
        .setAsDefault(true)
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.walletCreateCommand,
        createWalletCommand,
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          metadata: JSON.stringify({}),
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
          defaultWallet: walletCreatedEvent.address,
        }),
      )
    })

    it('Success when creating a new wallet including the address and metadata', async () => {
      const createWalletCommand = WalletCreateCommandBuilder.get(
        tenantId1,
        entityId1,
        walletMock.type,
      )
        .address(walletMock.address)
        .metadata(JSON.stringify(walletMock.metadata))
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.walletCreateCommand,
        createWalletCommand,
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          ...walletMock,
          metadata: JSON.stringify(walletMock.metadata),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )
    })

    it('Success when creating a new wallet using tenant store mapping', async () => {
      const updateTenantRequest = {
        ...tenantMock,
        id: undefined,
        stores: [
          {
            storeId: storeIdReal,
            walletType: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          },
        ],
      }
      await updateTenant(tenantId1, updateTenantRequest, authToken)

      const createWalletCommand = WalletCreateCommandBuilder.get(
        tenantId1,
        entityId1,
        WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      )
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.walletCreateCommand,
        createWalletCommand,
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const newWalletAddress = walletCreatedEvent.address

      // Check store ID field on wallet in database
      const wallet = await walletRepo.findOne({
        address: newWalletAddress,
      })
      expect(wallet.storeId).toEqual(storeIdReal)

      // Check store ID according to Orchestrate
      const orchestrateAccount = await fetchOrchestrateAccount(
        newWalletAddress,
        authToken,
      )
      expect(orchestrateAccount.data.storeID).toBe(storeIdReal)
    })

    it('Success when creating a new wallet using entity store mapping', async () => {
      const defaultWallet = (await walletRepo.findOne({ entityId: entityId1 }))
        .address
      const updateEntityRequest = {
        name: entityMock.name,
        metadata: {},
        defaultWallet,
        stores: [
          {
            storeId: storeIdReal,
            walletType: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          },
        ],
      }
      await updateEntity(entityId1, updateEntityRequest, authToken)

      const createWalletCommand = WalletCreateCommandBuilder.get(
        tenantId1,
        entityId1,
        WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      )
        .createdBy(sub)
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.walletCreateCommand,
        createWalletCommand,
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const newWalletAddress = walletCreatedEvent.address

      // Check store ID field on wallet in database
      const wallet = await walletRepo.findOne({
        address: newWalletAddress,
      })
      expect(wallet.storeId).toEqual(storeIdReal)

      // Check store ID according to Orchestrate
      const orchestrateAccount = await fetchOrchestrateAccount(
        newWalletAddress,
        authToken,
      )
      expect(orchestrateAccount.data.storeID).toBe(storeIdReal)
    })
  })

  describe('HTTP Endpoints', () => {
    it('Success when creating a new wallet and not setting it as default', async () => {
      const walletRequest: WalletCreateRequest = {
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
      }

      const { data: createWalletResult } = await createWallet(
        entityId1,
        walletRequest,
        authToken,
      )
      expect(createWalletResult).toEqual(
        expect.objectContaining({
          ...walletRequest,
          address: expect.any(String),
          metadata: {},
        }),
      )

      const { data: entityResult } = await fetchEntity(entityId1, authToken)
      expect(entityResult.defaultWallet).not.toEqual(createWalletResult.address)

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          address: createWalletResult.address,
          type: createWalletResult.type,
          metadata: JSON.stringify(createWalletResult.metadata),
          createdBy: sub,
          createdAt: createWalletResult.createdAt,
        }),
      )
    })

    it('Success when creating a new wallet and setting it as default', async () => {
      const walletRequest: WalletCreateRequest = {
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
      }

      const { data: createWalletResult } = await createWallet(
        entityId1,
        walletRequest,
        authToken,
        true,
      )
      expect(createWalletResult).toEqual(
        expect.objectContaining({
          ...walletRequest,
          address: expect.any(String),
          metadata: {},
        }),
      )

      const { data: entityResult } = await fetchEntity(entityId1, authToken)
      expect(entityResult.defaultWallet).toEqual(createWalletResult.address)

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          address: createWalletResult.address,
          type: createWalletResult.type,
          metadata: JSON.stringify(createWalletResult.metadata),
          createdBy: sub,
          createdAt: createWalletResult.createdAt,
        }),
      )

      // Check IEntityOperationEvent message
      const entityUpdatedEvent = await entityOperationEventSubscriber.consumeMessage(
        'Entity Updated',
      )
      expect(entityUpdatedEvent).toEqual(
        expect.objectContaining({
          entityId: entityId1,
          defaultWallet: createWalletResult.address,
        }),
      )
    })

    it('Success when creating a new wallet including the address and metadata', async () => {
      const { data: createWalletResult } = await createWallet(
        entityId1,
        walletMock,
        authToken,
      )
      expect(createWalletResult).toEqual(expect.objectContaining(walletMock))

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          ...walletMock,
          metadata: JSON.stringify(walletMock.metadata),
          createdBy: sub,
          createdAt: createWalletResult.createdAt,
        }),
      )
    })

    it('Success when creating a new orchestrate wallet with a registered address', async () => {
      const orchestrateAccountsService = appModule.get(
        OrchestrateAccountsService,
      )
      const registeredAddress = toChecksumAddress(
        await orchestrateAccountsService.generateAccount(authToken, {}),
      )

      const createWalletRequest: WalletCreateRequest = {
        address: registeredAddress,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
      }
      const { data: createWalletResult } = await createWallet(
        entityId1,
        createWalletRequest,
        authToken,
      )
      expect(createWalletResult).toEqual(
        expect.objectContaining(createWalletRequest),
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          ...createWalletRequest,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: createWalletResult.createdAt,
        }),
      )
    })

    it('Success when creating a new wallet using tenant store mapping', async () => {
      const updateTenantRequest = {
        ...tenantMock,
        id: undefined,
        stores: [
          {
            storeId: storeIdReal,
            walletType: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          },
        ],
      }
      await updateTenant(tenantId1, updateTenantRequest, authToken)

      const walletRequest: WalletCreateRequest = {
        type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      }
      const { data: createWalletResult } = await createWallet(
        entityId1,
        walletRequest,
        authToken,
      )

      expect(createWalletResult).toEqual(
        expect.objectContaining({
          ...walletRequest,
          address: expect.any(String),
          metadata: {},
          storeId: storeIdReal,
        }),
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const newWalletAddress = walletCreatedEvent.address

      // Check store ID field on wallet in database
      const wallet = await walletRepo.findOne({
        address: newWalletAddress,
      })
      expect(wallet.storeId).toEqual(storeIdReal)

      // Check store ID according to Orchestrate
      const orchestrateAccount = await fetchOrchestrateAccount(
        newWalletAddress,
        authToken,
      )
      expect(orchestrateAccount.data.storeID).toBe(storeIdReal)
    })

    it('Success when creating a new wallet using entity store mapping', async () => {
      const defaultWallet = (await walletRepo.findOne({ entityId: entityId1 }))
        .address
      const updateEntityRequest = {
        name: entityMock.name,
        metadata: {},
        defaultWallet,
        stores: [
          {
            storeId: storeIdReal,
            walletType: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          },
        ],
      }
      await updateEntity(entityId1, updateEntityRequest, authToken)

      const walletRequest: WalletCreateRequest = {
        type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
      }
      const { data: createWalletResult } = await createWallet(
        entityId1,
        walletRequest,
        authToken,
      )

      expect(createWalletResult).toEqual(
        expect.objectContaining({
          ...walletRequest,
          address: expect.any(String),
          metadata: {},
          storeId: storeIdReal,
        }),
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_AZURE_VAULT,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: expect.any(String),
        }),
      )

      const newWalletAddress = walletCreatedEvent.address

      // Check store ID field on wallet in database
      const wallet = await walletRepo.findOne({
        address: newWalletAddress,
      })
      expect(wallet.storeId).toEqual(storeIdReal)

      // Check store ID according to Orchestrate
      const orchestrateAccount = await fetchOrchestrateAccount(
        newWalletAddress,
        authToken,
      )
      expect(orchestrateAccount.data.storeID).toBe(storeIdReal)
    })

    it('Success when creating a new orchestrate wallet with a registered address without checksum', async () => {
      const orchestrateAccountsService = appModule.get(
        OrchestrateAccountsService,
      )

      const registeredAddressWithoutChecksum = (
        await orchestrateAccountsService.generateAccount(authToken, {})
      ).toLowerCase()

      const registeredAddressWithChecksum = toChecksumAddress(
        registeredAddressWithoutChecksum,
      )

      const createWalletRequest: WalletCreateRequest = {
        address: registeredAddressWithoutChecksum,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
      }
      const { data: createWalletResult } = await createWallet(
        entityId1,
        createWalletRequest,
        authToken,
      )
      expect(createWalletResult).toEqual(
        expect.objectContaining({
          ...createWalletRequest,
          address: registeredAddressWithChecksum,
        }),
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          ...createWalletRequest,
          address: registeredAddressWithChecksum,
          metadata: JSON.stringify({}),
          createdBy: sub,
          createdAt: createWalletResult.createdAt,
        }),
      )
    })

    it('Fails when creating an orchestrate wallet with an unregistered address', async () => {
      await expect(
        createWallet(
          entityId1,
          {
            address: walletAddressMock,
            type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          },
          authToken,
        ),
      ).rejects.toThrowError()
    })

    it('Fails when creating a new wallet for an entity that does not exist', async () => {
      await expect(
        createWallet('fakeEntityId', walletMock, authToken),
      ).rejects.toThrowError()

      // Expect wallet not to exist
      const wallet = await walletRepo.findOne(
        { address: walletMock.address },
        { withDeleted: true },
      )
      expect(wallet).toBeUndefined()
    })
  })
})
