require('dotenv').config()
import { deleteUsers, getAuth0ManagementClient } from './utils/cleanups'
import { userCreateCommand } from './utils/requests'
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
import { UserModule } from '../src/modules/UserModule'
import {
  Commands,
  Events,
  IUserCreateCommand,
  IUserCreatedEvent,
} from '@consensys/messaging-events'
import {
  entityIdMock,
  tenantIdMock,
  userCreateCommandMock,
} from '../test/mocks'
import { v4 as uuidv4 } from 'uuid'
import { generateRandomNumber } from './utils/randomGenerator'

jest.setTimeout(600000)

const userIds: string[] = []

describe('create users', () => {
  let auth0Client: ManagementClient
  let appModule: TestingModule
  let kafkaProducer: KafkaProducer
  let kafkaConsumer: KafkaConsumer
  let testKafkaConsumerUserCreatedResult: TestKafkaConsumer
  let consumerUuid

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
        UserModule,
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
      Commands.userCreateCommand,
      Events.userCreatedEvent,
    ])

    testKafkaConsumerUserCreatedResult = appModule.get(
      TEST_KAFKA_CONSUMER_PROVIDER_1,
    )

    kafkaConsumer = appModule.get(KafkaConsumer)

    testKafkaConsumerUserCreatedResult.topic = Events.userCreatedEvent.getMessageName()
    console.log(
      `testKafkaConsumerUserCreatedResult listening to topic=${testKafkaConsumerUserCreatedResult.topic}`,
    )

    const groupId1 = `integration_${uuidv4()}`

    consumerUuid = await kafkaConsumer.addSubscriber(
      testKafkaConsumerUserCreatedResult,
      groupId1,
    )
  })

  it('should be able to create a user using userCreateCommand', async () => {
    const email = `consensys.codefiqa+${generateRandomNumber(7)}@gmail.com`
    const userCreateCommandMessage: IUserCreateCommand = {
      ...userCreateCommandMock,
      email: email,
    }

    testKafkaConsumerUserCreatedResult.setFilter(
      decodedMessage => decodedMessage.email === email,
    )

    await userCreateCommand(kafkaProducer, userCreateCommandMessage)

    const userCreatedEventReceived: IUserCreatedEvent = await testKafkaConsumerUserCreatedResult.getConsumedMessage()

    userIds.push(userCreatedEventReceived.userId)
    expect(userCreatedEventReceived.userId).toBeDefined()
    expect(userCreatedEventReceived.email).toBe(email)
    expect(userCreatedEventReceived.name).toBe(userCreateCommandMock.name)
    expect(userCreatedEventReceived.appMetadata).toBeDefined()
    expect(userCreatedEventReceived.tenantId).toBe(tenantIdMock)
    expect(userCreatedEventReceived.entityId).toBe(entityIdMock)
  })

  it('should not create user without email - throws Unprocessable entity', async () => {
    const userCreateCommandMessage: IUserCreateCommand = {
      ...userCreateCommandMock,
      email: undefined,
    }
    await expect(
      userCreateCommand(kafkaProducer, userCreateCommandMessage),
    ).rejects.toThrow('invalid "string": undefined')
  })

  afterEach(async () => {
    testKafkaConsumerUserCreatedResult.clearFilter()
  })

  afterAll(async () => {
    if (userIds.length > 0) {
      await deleteUsers(auth0Client, userIds)
    }
    if (kafkaConsumer) await kafkaConsumer.disconnect(consumerUuid)
    await appModule.close()
  })
})
