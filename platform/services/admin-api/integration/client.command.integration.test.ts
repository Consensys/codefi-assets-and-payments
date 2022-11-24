require('dotenv').config()

import { deleteClient, getAuth0ManagementClient } from './utils/cleanups'
import { clientCreateCommand } from './utils/requests'
import { ManagementClient } from 'auth0'
import { Test, TestingModule } from '@nestjs/testing'
import {
  KafkaConsumer,
  KafkaConsumerModule,
  KafkaProducer,
  KafkaProducerModule,
} from '@consensys/nestjs-messaging'
import { TestKafkaConsumer } from './utils/TestKafkaConsumer'
import { LoggerModule } from '@consensys/observability'
import { Commands, Events, IClientCreatedEvent } from '@consensys/messaging-events'
import { clientCreateCommandMock } from '../test/mocks'
import { v4 as uuidv4 } from 'uuid'
import { ClientModule } from '../src/modules/ClientModule'

jest.setTimeout(600000)

describe('Client Create Command', () => {
  let auth0Client: ManagementClient
  let appModule: TestingModule
  let kafkaProducer: KafkaProducer
  let kafkaConsumer: KafkaConsumer
  let clientCreatedEventConsumer: TestKafkaConsumer
  let clientIds: string[] = []

  const TEST_KAFKA_CONSUMER_PROVIDER_1 = 'TEST_KAFKA_CONSUMER_PROVIDER_1'

  beforeAll(async () => {
    auth0Client = await getAuth0ManagementClient()
    appModule = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: 'info',
          },
        }),
        ClientModule,
        KafkaConsumerModule,
        KafkaProducerModule,
      ],
      providers: [
        {
          provide: TEST_KAFKA_CONSUMER_PROVIDER_1,
          useClass: TestKafkaConsumer,
        },
      ],
    }).compile()

    kafkaProducer = appModule.get(KafkaProducer)
    await kafkaProducer.registerProducerEvents([
      Commands.clientCreateCommand,
      Events.userCreatedEvent,
    ])

    kafkaConsumer = appModule.get(KafkaConsumer)
    clientCreatedEventConsumer = appModule.get(TEST_KAFKA_CONSUMER_PROVIDER_1)
    clientCreatedEventConsumer.topic =
      Events.clientCreatedEvent.getMessageName()
    const groupId = `integration_${uuidv4()}`
    await kafkaConsumer.addSubscriber(clientCreatedEventConsumer, groupId)
  })

  afterAll(async () => {
    if (clientIds.length > 0) await deleteClient(auth0Client, clientIds)
    if (kafkaConsumer) await kafkaConsumer.disconnectAllConsumers()
    await appModule.close()
  })

  beforeEach(async () => {
    clientCreatedEventConsumer.msg = undefined
    clientCreatedEventConsumer.clearFilter()
  })

  it('success creating client', async () => {
    clientCreatedEventConsumer.setFilter(
      (message) => message.name === clientCreateCommandMock.name,
    )

    await clientCreateCommand(kafkaProducer, clientCreateCommandMock)

    const clientCreatedEventReceived: IClientCreatedEvent =
      await clientCreatedEventConsumer.getConsumedMessage()
    clientIds.push(clientCreatedEventReceived.clientId)

    expect(clientCreatedEventReceived).toEqual(
      expect.objectContaining({
        appType: clientCreateCommandMock.appType,
        clientId: expect.any(String),
        clientSecret: expect.any(String),
        entityId: clientCreateCommandMock.entityId,
        name: clientCreateCommandMock.name,
        product: clientCreateCommandMock.product,
        tenantId: clientCreateCommandMock.tenantId,
      }),
    )
  })
})
