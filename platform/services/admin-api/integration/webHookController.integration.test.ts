require('dotenv').config()
import { authRegistrationHookPost, deleteUserAuth0 } from './utils/requests'
import { Test } from '@nestjs/testing'
import { KafkaConsumerModule, KafkaConsumer } from '@consensys/nestjs-messaging'
import { TestKafkaConsumer } from './utils/TestKafkaConsumer'
import { Events, IUserCreatedEvent } from '@consensys/messaging-events'
import { AuthHookRegisterRequest } from '../src/requests/AuthHookRegisterRequest'
import { createTokenWithPermissions } from './utils/jwt'
import { generateRandomText } from './utils/randomGenerator'
import { ManagementClient } from 'auth0'
import { getAuth0ManagementClient } from './utils/cleanups'
import { v4 as uuid4 } from 'uuid'

jest.setTimeout(600000)

let testKafkaConsumer: TestKafkaConsumer
let userId
let kafkaConsumer: KafkaConsumer

describe('webHookController', () => {
  let auth0Client: ManagementClient
  let consumerUuid

  beforeAll(async () => {
    auth0Client = await getAuth0ManagementClient()

    const testModule = await Test.createTestingModule({
      imports: [KafkaConsumerModule],
      providers: [TestKafkaConsumer],
    }).compile()

    kafkaConsumer = testModule.get(KafkaConsumer)
    testKafkaConsumer = testModule.get(TestKafkaConsumer)
    testKafkaConsumer.topic = Events.userCreatedEvent.getMessageName()
    const groupId = `integration_${uuid4()}`
    console.log(`Consumer group id=${groupId}`)
    consumerUuid = await kafkaConsumer.addSubscriber(testKafkaConsumer, groupId)
  })

  it('registration hook - localhost', async () => {
    // local integration only test as this is only half flow, prev test cover it all
    if (process.env.PIPELINE) return
    const randomClientId = generateRandomText(9, 'test-client_')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const userNamePasswordHookRequest: AuthHookRegisterRequest = require('./requests/usernamePasswordAuth.json')
    userNamePasswordHookRequest.user.user_id = randomClientId
    const result = await authRegistrationHookPost(
      userNamePasswordHookRequest,
      await createTokenWithPermissions(),
    )
    const consumedMessage: IUserCreatedEvent = await testKafkaConsumer.getConsumedMessage()
    expect(consumedMessage.userId).toBe(randomClientId)
    expect(result.data.registered).toBeTruthy()
  })

  it('registration hook - missing properties - returns false', async () => {
    const token = await createTokenWithPermissions()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const userNamePasswordHookRequest: AuthHookRegisterRequest = require('./requests/usernamePasswordAuth.json')
    delete userNamePasswordHookRequest.user.user_id
    const result = await authRegistrationHookPost(
      userNamePasswordHookRequest,
      token,
    )
    expect(result.data.registered).toBeFalsy()
  })

  afterAll(async () => {
    if (userId) await deleteUserAuth0(auth0Client, userId)
    if (kafkaConsumer) await kafkaConsumer.disconnect(consumerUuid)
  })
})
