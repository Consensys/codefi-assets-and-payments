import { KafkaConsumer, KafkaSubscriber } from '.';
import { Kafka } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import createMockInstance from 'jest-create-mock-instance';
import { ApmService } from '@consensys/observability';

describe('KafkaConsumer', () => {
  let clientMock: Kafka;
  let schemaRegistryMock: SchemaRegistry;
  let consumer: KafkaConsumer;
  let apmService: ApmService;

  let mockSubscriber: KafkaSubscriber;
  let mockConsumer;

  beforeEach(() => {
    clientMock = createMockInstance(Kafka);
    schemaRegistryMock = createMockInstance(SchemaRegistry);
    apmService = createMockInstance(ApmService);

    mockSubscriber = {
      onMessage: jest.fn(),
      topic: 'mockTopic',
    };
    mockConsumer = {
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      events: {
        CRASH: 'consumer.crash',
      },
    };
    consumer = new KafkaConsumer(clientMock, schemaRegistryMock, apmService);
  });

  it('addSubscriber success', async () => {
    clientMock.consumer = jest.fn().mockImplementation(() => mockConsumer);
    await consumer.addSubscriber(mockSubscriber);
    expect(clientMock.consumer).toBeCalledTimes(1);
    expect(mockConsumer.connect).toBeCalledTimes(1);
    expect(mockConsumer.subscribe).toBeCalledTimes(1);
    expect(mockConsumer.subscribe).toBeCalledWith({
      topic: mockSubscriber.topic,
      fromBeginning: true,
    });
    expect(mockConsumer.on).toHaveBeenCalledTimes(1);
    expect(mockConsumer.on).toHaveBeenCalledWith(
      mockConsumer.events.CRASH,
      expect.anything(),
    );
    expect(mockConsumer.run).toHaveBeenCalledTimes(1);
  });

  it('disconnect success', async () => {
    clientMock.consumer = jest.fn().mockImplementation(() => mockConsumer);
    const consumerUuid = await consumer.addSubscriber(mockSubscriber);
    await consumer.disconnect(consumerUuid);
    expect(mockConsumer.disconnect).toHaveBeenCalledTimes(1);
  });

  it('get subscriber', async () => {
    clientMock.consumer = jest.fn().mockImplementation(() => mockConsumer);
    const uuid = 'uuid';
    await consumer.addSubscriber(
      mockSubscriber,
      'group',
      uuid,
    );
    const subscriber = await consumer.getConsumer(uuid);
    expect(subscriber).toBeDefined();
  });

  it('disconnect all consumers', async () => {
    clientMock.consumer = jest.fn().mockImplementation(() => mockConsumer);
    await consumer.addSubscriber(mockSubscriber);
    await consumer.addSubscriber({
      ...mockSubscriber,
      topic: 'anothertopic',
    });
    await consumer.disconnectAllConsumers();
    expect(mockConsumer.disconnect).toHaveBeenCalledTimes(2);
  });

  it('disconnect success - not initialized', async () => {
    await consumer.disconnect('something');
    expect(mockConsumer.disconnect).toHaveBeenCalledTimes(0);
  });
});
