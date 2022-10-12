import {
  decodeToken,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
} from '@codefi-assets-and-payments/auth'
import {
  Commands,
  Events,
  IWalletOperationEvent,
  TenantCreateCommandBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { KafkaProducer, KafkaConsumer } from '@codefi-assets-and-payments/nestjs-messaging'
import { TenantCreateRequest, WalletType } from '@codefi-assets-and-payments/ts-types'
import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import {
  getTokenWithTenantId1EntityId1,
  getTokenWithTenantId1EntityId2,
} from './utils/jwtTokens'
import { entityMock, tenantMock } from '../test/mocks'
import { createTenant } from './utils/requests'
import { subscribeToMessage, testModule } from './utils/testCommonUtils'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
import { OrchestrateAccountsService } from '@codefi-assets-and-payments/nestjs-orchestrate'
require('dotenv').config()

jest.setTimeout(60000)

describe('Orchestrate Wallet Tenants', () => {
  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>
  let kafkaProducer: KafkaProducer
  let kafkaConsumer: KafkaConsumer
  let walletOperationEventSubscriber: TestKafkaSubscriber<IWalletOperationEvent>

  let authToken1: string
  let tenantId1: string
  let entityId1: string
  let authToken2: string

  let orchestrateAccountsService: OrchestrateAccountsService

  beforeAll(async () => {
    const walletOperationEventSubscriberName = 'walletOperationEventSubscriber'
    appModule = await testModule([walletOperationEventSubscriberName])

    // Set up producers and subscribers
    kafkaProducer = appModule.get(KafkaProducer)
    kafkaConsumer = appModule.get(KafkaConsumer)

    await kafkaProducer.registerProducerEvents([Commands.tenantCreateCommand])

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
    authToken1 = await getTokenWithTenantId1EntityId1(appModule)
    const decodedToken1 = decodeToken(authToken1)
    tenantId1 = extractTenantIdFromToken(decodedToken1)
    entityId1 = extractEntityIdFromToken(decodedToken1)

    authToken2 = await getTokenWithTenantId1EntityId2(appModule)

    orchestrateAccountsService = appModule.get(OrchestrateAccountsService)
  })

  beforeEach(async () => {
    // Clear DB and pending messages
    await walletOperationEventSubscriber.cleanMessages()
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})
  })

  afterEach(async () => {
    // Clear DB and pending messages
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
    it('Wallet Access created with command', async () => {
      const createTenantCommand = TenantCreateCommandBuilder.get(
        tenantId1,
        tenantMock.name,
        tenantMock.products,
        tenantMock.defaultNetworkKey,
      )
        .metadata(JSON.stringify(tenantMock.metadata))
        .initialEntities([
          {
            entityId: entityId1,
            name: entityMock.name,
            metadata: JSON.stringify({}),
            initialAdmins: [],
            initialWallets: [],
            defaultWallet: null,
          },
        ])
        .createdBy('')
        .build()

      // Send command
      await kafkaProducer.send(
        Commands.tenantCreateCommand,
        createTenantCommand,
      )

      // Check IWalletOperationEvent message
      const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
        'Wallet Created',
      )
      expect(walletCreatedEvent).toEqual(
        expect.objectContaining({
          entityId: entityId1,
          address: expect.any(String),
          type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        }),
      )

      const registeredWithUserToken1 = await orchestrateAccountsService.isRegistered(
        walletCreatedEvent.address,
        authToken1,
      )
      expect(registeredWithUserToken1).toEqual(true)

      const registeredWithUserToken2 = await orchestrateAccountsService.isRegistered(
        walletCreatedEvent.address,
        authToken2,
      )
      expect(registeredWithUserToken2).toEqual(false)
    })
  })

  describe('HTTP Endpoints', () => {
    it.each([[1], [2]])(
      'Wallet Access created with http with tenantId%i',
      async (nthToken) => {
        const authToken = nthToken === 1 ? authToken1 : authToken2
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

        // Check IWalletOperationEvent message
        const walletCreatedEvent = await walletOperationEventSubscriber.consumeMessage(
          'Wallet Created',
        )
        expect(walletCreatedEvent).toEqual(
          expect.objectContaining({
            entityId: entityId1,
            address: expect.any(String),
            type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          }),
        )

        const registeredWithUserToken1 = await orchestrateAccountsService.isRegistered(
          walletCreatedEvent.address,
          authToken1,
        )
        expect(registeredWithUserToken1).toEqual(true)

        const registeredWithUserToken2 = await orchestrateAccountsService.isRegistered(
          walletCreatedEvent.address,
          authToken2,
        )
        expect(registeredWithUserToken2).toEqual(false)
      },
    )
  })
})
