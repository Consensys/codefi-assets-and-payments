import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import Mocked = jest.Mocked
import { KafkaConsumer, KafkaProducer } from '@consensys/nestjs-messaging'
import KafkaLifecycleService from './KafkaLifecycleService'
import { AbstractMessage } from '@consensys/messaging-events/dist/messages/AbstractMessage'

export const eventSchema = {
  type: 'record',
  name: 'testEvent',
  namespace: 'net.consensys.codefi.boilerplate',
  fields: [{ name: 'counter', type: 'int' }],
}

export class TestEvent extends AbstractMessage<ITestEvent> {
  public messageName = 'test_event'
  public messageSchema: any = eventSchema
}

export interface ITestEvent {
  counter: number
}

describe('KafkaLifecycleService', () => {
  let logger: Mocked<NestJSPinoLogger>
  let kafkaProducer: Mocked<KafkaProducer>
  let kafkaConsumer: Mocked<KafkaConsumer>
  const eventTypes = [new TestEvent()]
  const subscribers = [
    {
      topic: 'topic',
      onMessage: jest.fn(),
    },
  ]
  let service: KafkaLifecycleService

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    kafkaProducer = createMockInstance(KafkaProducer)
    kafkaConsumer = createMockInstance(KafkaConsumer)
    service = new KafkaLifecycleService(
      logger,
      {
        kafka: {
          groupId: 'api-boilerplate',
        },
      } as any,
      kafkaProducer,
      kafkaConsumer,
      eventTypes,
      subscribers,
    )
  })

  it('inits producer', async () => {
    await service.onApplicationBootstrap()

    expect(kafkaProducer.registerProducerEvents).toHaveBeenCalledWith([
      new TestEvent(),
    ])
  })

  it('inits consumer', async () => {
    await service.onApplicationBootstrap()

    expect(kafkaConsumer.addSubscriber).toHaveBeenCalledWith(
      subscribers[0],
      'api-boilerplate',
    )
  })

  it('throw an exception when fails to init a producer', async () => {
    kafkaProducer.registerProducerEvents.mockRejectedValue(
      new Error('producer error'),
    )
    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      'Failed to init producer: producer error',
    )
  })

  it('throw an exception when fails to init a consumer', async () => {
    kafkaConsumer.addSubscriber.mockRejectedValue(new Error('consumer error'))
    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      'Failed to init consumer: consumer error',
    )
  })

  it('disconnects producer', async () => {
    await service.onApplicationShutdown('SIGINT')

    expect(kafkaProducer.disconnect).toHaveBeenCalledWith()
  })

  it('does not fail if failed to shutdown a producer', async () => {
    const error = new Error('producer error')
    kafkaProducer.disconnect.mockRejectedValue(error)
    await service.onApplicationShutdown('SIGINT')

    expect(kafkaProducer.disconnect).toHaveBeenCalledWith()
    expect(logger.error).toHaveBeenCalledWith(
      error,
      'Failed to stop Kafka producer',
    )
  })

  it('disconnects consumer', async () => {
    await service.onApplicationShutdown('SIGINT')

    expect(kafkaConsumer.disconnectAllConsumers).toHaveBeenCalledWith()
  })

  it('does not fail if failed to shutdown a consumer', async () => {
    const error = new Error('consumer error')
    kafkaConsumer.disconnectAllConsumers.mockRejectedValue(error)
    await service.onApplicationShutdown('SIGINT')

    expect(kafkaProducer.disconnect).toHaveBeenCalledWith()
    expect(logger.error).toHaveBeenCalledWith(
      error,
      'Failed to stop Kafka consumer',
    )
  })
})
