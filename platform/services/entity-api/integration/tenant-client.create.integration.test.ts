import { TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TenantEntity } from '../src/data/entities/TenantEntity'
import { getTokenWithTenantId1EntityId1 } from './utils/jwtTokens'
import { createTenant, createTenantClient } from './utils/requests'
import {
  subscribeToMessage,
  testModule,
  waitForEntity,
} from './utils/testCommonUtils'
import { ClientType, EntityStatus } from '@codefi-assets-and-payments/ts-types'
import { ClientEntity } from '../src/data/entities/ClientEntity'
import {
  clientIdMock,
  entityClientCreateRequestMock,
  tenantIdMock,
  tenantMock,
} from '../test/mocks'
import { EntityEntity } from '../src/data/entities/EntityEntity'
import { WalletEntity } from '../src/data/entities/WalletEntity'
import { IClientCreateCommand } from '@codefi-assets-and-payments/messaging-events/dist/messages/commands/ClientCreateCommand'
import { TestKafkaSubscriber } from './utils/TestKafkaSubscriber'
import { Commands, Events } from '@codefi-assets-and-payments/messaging-events'
import { KafkaConsumer, KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'

require('dotenv').config()

jest.setTimeout(60000)

describe('Tenant Client Create', () => {
  let appModule: TestingModule
  let tenantRepo: Repository<TenantEntity>
  let entityRepo: Repository<EntityEntity>
  let walletRepo: Repository<WalletEntity>
  let clientRepo: Repository<ClientEntity>
  let authToken: string
  let kafkaProducer: KafkaProducer
  let kafkaConsumer: KafkaConsumer
  let clientCreateCommandSubscriber: TestKafkaSubscriber<IClientCreateCommand>

  beforeAll(async () => {
    const clientCreateCommandSubscriberName = 'clientCreateCommandSubscriber'

    appModule = await testModule([clientCreateCommandSubscriberName])

    tenantRepo = appModule.get<Repository<TenantEntity>>(
      getRepositoryToken(TenantEntity),
    )
    entityRepo = appModule.get<Repository<EntityEntity>>(
      getRepositoryToken(EntityEntity),
    )
    walletRepo = appModule.get<Repository<WalletEntity>>(
      getRepositoryToken(WalletEntity),
    )
    clientRepo = appModule.get<Repository<ClientEntity>>(
      getRepositoryToken(ClientEntity),
    )
    await clientRepo.delete({})
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})

    authToken = await getTokenWithTenantId1EntityId1(appModule)

    kafkaProducer = appModule.get(KafkaProducer)
    await kafkaProducer.registerProducerEvents([Events.clientCreatedEvent])

    kafkaConsumer = appModule.get(KafkaConsumer)
    clientCreateCommandSubscriber = await subscribeToMessage(
      appModule,
      kafkaConsumer,
      Commands.clientCreateCommand,
      clientCreateCommandSubscriberName,
      'IntegrationClientCreateCommand',
    )
  })

  beforeEach(async () => {
    await clientCreateCommandSubscriber.cleanMessages()
    await createTenant(tenantMock, authToken)
  })

  afterEach(async () => {
    await clientRepo.delete({})
    await walletRepo.delete({})
    await entityRepo.delete({})
    await tenantRepo.delete({})
  })

  afterAll(async () => {
    await kafkaConsumer.disconnectAllConsumers()
    await appModule.close()
  })

  it('Success creating with pending status and single page as type', async () => {
    const response = await createTenantClient(
      tenantIdMock,
      { type: ClientType.SinglePage },
      authToken,
    )

    expect(response).toHaveProperty('status', 201)

    expect(
      await clientRepo.find({
        order: {
          createdAt: 'DESC',
        },
      }),
    ).toEqual([
      {
        id: expect.any(String),
        tenantId: tenantIdMock,
        entityId: null,
        name: tenantMock.name,
        status: EntityStatus.Pending,
        type: ClientType.SinglePage,
        clientId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedDate: null,
      },
    ])

    const clientCreateCommand =
      await clientCreateCommandSubscriber.consumeMessage(
        'Client Create Command',
      )

    expect(clientCreateCommand).toEqual(
      expect.objectContaining({
        allowedLogoutUrls: [],
        allowedOrigins: [],
        callbacks: [],
        clientMetadata: null,
        entityId: null,
        initiateLoginUri: null,
        isEmailOnly: false,
        jwtConfiguration: null,
        logoUri: null,
        product: 'assets',
        sso: null,
        tenantId: tenantIdMock,
        webOrigins: [],
        name: tenantMock.name,
        description: tenantMock.name,
        appType: ClientType.SinglePage,
        grantTypes: [
          'password',
          'authorization_code',
          'implicit',
          'refresh_token',
        ],
      }),
    )
  })

  it('Success creating with pending status and non-interactive as type', async () => {
    const response = await createTenantClient(
      tenantIdMock,
      { type: ClientType.NonInteractive },
      authToken,
    )

    expect(response).toHaveProperty('status', 201)

    expect(
      await clientRepo.find({
        order: {
          createdAt: 'DESC',
        },
      }),
    ).toEqual([
      {
        id: expect.any(String),
        tenantId: tenantIdMock,
        entityId: null,
        name: `${tenantMock.name} - M2M`,
        status: EntityStatus.Pending,
        type: ClientType.NonInteractive,
        clientId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedDate: null,
      },
    ])

    const clientCreateCommand =
      await clientCreateCommandSubscriber.consumeMessage(
        'Client Create Command',
      )

    expect(clientCreateCommand).toEqual(
      expect.objectContaining({
        allowedLogoutUrls: [],
        allowedOrigins: [],
        callbacks: [],
        clientMetadata: null,
        entityId: null,
        initiateLoginUri: null,
        isEmailOnly: false,
        jwtConfiguration: null,
        logoUri: null,
        product: 'assets',
        sso: null,
        tenantId: tenantIdMock,
        webOrigins: [],
        name: `${tenantMock.name} - M2M`,
        description: `${tenantMock.name} - M2M`,
        appType: ClientType.NonInteractive,
        grantTypes: [
          'password',
          'authorization_code',
          'implicit',
          'refresh_token',
          'client_credentials',
        ],
      }),
    )
  })

  it('Success updating to confirmed status when receiving client created event', async () => {
    await createTenantClient(
      tenantIdMock,
      entityClientCreateRequestMock,
      authToken,
    )

    await kafkaProducer.send(Events.clientCreatedEvent, {
      tenantId: tenantIdMock,
      entityId: null,
      name: tenantMock.name,
      appType: ClientType.SinglePage,
      product: 'assets',
      clientId: clientIdMock,
      clientSecret: 'testSecret',
    })

    await waitForEntity<ClientEntity>(
      clientRepo,
      (client) =>
        client.tenantId === tenantIdMock &&
        client.name === tenantMock.name &&
        client.status === EntityStatus.Confirmed &&
        client.clientId === clientIdMock,
    )

    await clientCreateCommandSubscriber.consumeMessage('Client Created Command')
  })
})
