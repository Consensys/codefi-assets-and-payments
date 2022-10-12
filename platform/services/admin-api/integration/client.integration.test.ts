import {
  createClientPost,
  deleteClientRequest,
  getAllClients,
  getAllInfuraClients,
  getClientById,
  updateClient,
} from './utils/requests'
import { validCreateClientRequest } from '../test/mocks'
import {
  createTokenWithoutPermissions,
  createTokenWithPermissions,
} from './utils/jwt'
import { deleteClient, getAuth0ManagementClient } from './utils/cleanups'
import { KafkaConsumer, KafkaConsumerModule } from '@codefi-assets-and-payments/nestjs-messaging'
import { Test } from '@nestjs/testing'
import { TestKafkaConsumer } from './utils/TestKafkaConsumer'
import { Events, IClientCreatedEvent } from '@codefi-assets-and-payments/messaging-events'
import { Auth0Module } from '../src/modules/Auth0Module'
import { LoggerModule } from '@codefi-assets-and-payments/observability'
import cfg from '../src/config'
import { ManagementClient } from 'auth0'
import { ClientGetAllResponse } from '../src/responses/ClientGetAllResponse'
import { sleep } from '../src/utils/sleep'
import { ConfigConstants } from '../src/config/ConfigConstants'
import { v4 as uuid4 } from 'uuid'

require('dotenv').config()

jest.setTimeout(600000)

describe('/client', () => {
  const clientIds = []

  let auth0Client: ManagementClient
  let testKafkaConsumer: TestKafkaConsumer
  let kafkaConsumer: KafkaConsumer
  let consumerUuid

  beforeAll(async () => {
    const testModule = await Test.createTestingModule({
      imports: [
        KafkaConsumerModule,
        LoggerModule.forRoot({
          pinoHttp: {
            level: cfg().core.logLevel,
          },
        }),
        Auth0Module,
      ],
      providers: [TestKafkaConsumer],
    }).compile()
    auth0Client = await getAuth0ManagementClient()

    kafkaConsumer = testModule.get(KafkaConsumer)
    testKafkaConsumer = testModule.get(TestKafkaConsumer)
    testKafkaConsumer.topic = Events.clientCreatedEvent.getMessageName()
    const groupId = `integration_${uuid4()}`
    console.log(`Consumer group id=${groupId}`)
    consumerUuid = await kafkaConsumer.addSubscriber(testKafkaConsumer, groupId)
  })

  it('create client - success', async () => {
    const token = await createTokenWithPermissions()
    const response = await createClientPost(validCreateClientRequest, token)
    expect(response.status).toBe(201)
    clientIds.push(response.data.clientId)

    // Check kafka msg sent
    const consumedMessage: IClientCreatedEvent =
      await testKafkaConsumer.getConsumedMessage()
    expect(consumedMessage.clientId).toBe(response.data.clientId)
  })

  it('create client - not enough permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await createClientPost(validCreateClientRequest, token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('create client - fail invalid body', async () => {
    const token = await createTokenWithPermissions()
    await expect(
      createClientPost(
        { ...validCreateClientRequest, grantTypes: { a: 'a' } },
        token,
      ),
    ).rejects.toThrow('Request failed with status code 422')
  })

  it('get all clients - success', async () => {
    const token = await createTokenWithPermissions()
    const response = await getAllClients(0, 10, token)

    const data: ClientGetAllResponse = response.data

    expect(response.status).toBe(200)
    expect(data.items.length).toBeGreaterThan(0)
  })

  it('get all clients - filters by connection', async () => {
    const token = await createTokenWithPermissions()

    const responseWithoutFilter = await getAllClients(0, 100, token)
    const response = await getAllClients(
      0,
      100,
      token,
      ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
    )

    expect(response.status).toBe(200)
    expect(response.data.items.length).toBeGreaterThan(0)
    expect(response.data.items.length).toBeLessThanOrEqual(
      responseWithoutFilter.data.items.length,
    )
  })

  it('get all infura clients', async () => {
    const token = await createTokenWithPermissions()

    const responseWithoutFilter = await getAllClients(0, 100, token)
    const response = await getAllInfuraClients(0, 100, token)

    expect(response.status).toBe(200)

    // To be added when frontend client created during initial config
    //expect(response.data.items.length).toBeGreaterThan(0)

    expect(response.data.items.length).toBeLessThanOrEqual(
      responseWithoutFilter.data.items.length,
    )
  })

  it('get all clients - not enough permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await getAllClients(0, 10, token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('get client - success', async () => {
    const token = await createTokenWithPermissions()
    const client = await createClientPost(validCreateClientRequest, token)
    const response = await getClientById(client.data.clientId, token)
    clientIds.push(response.data.clientId)
    expect(response.status).toBe(200)
  })

  it('get client - not enough permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await getClientById(clientIds[0], token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('update client - success', async () => {
    const token = await createTokenWithPermissions()
    const response = await updateClient(
      {
        ...validCreateClientRequest,
        description: 'test_some_description_updated',
      },
      clientIds[0],
      token,
    )
    expect(response.status).toBe(200)
    expect(response.data.description).toEqual('test_some_description_updated')
  })

  it('update client - not enough permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await updateClient(
        {
          ...validCreateClientRequest,
          description: 'test_some_description_updated',
        },
        clientIds[0],
        token,
      )
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('delete client - success', async () => {
    const token = await createTokenWithPermissions()
    await sleep(10000)
    const response = await deleteClientRequest(clientIds[0], token)
    expect(response.status).toBe(201)
  })

  it('delete client - not enough permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await deleteClientRequest(clientIds[0], token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  afterAll(async () => {
    if (clientIds.length > 0) {
      await deleteClient(auth0Client, clientIds)
    }
    if (kafkaConsumer) await kafkaConsumer.disconnectAllConsumers()
  })
})
