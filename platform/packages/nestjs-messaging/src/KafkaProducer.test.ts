import { Kafka } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { KafkaProducer } from './KafkaProducer';
import createMockInstance from 'jest-create-mock-instance';
import { ApmService } from '@codefi-assets-and-payments/observability';

describe('KafkaProducer', () => {
  const mockEvent = {
    messageSchema: 'testSchema',
    getMessageName: () => 'testEvent',
    fullyQualifiedName: () => 'testQualifiedName',
  };
  const registerMockResult = {
    id: '1',
  };
  const encodedMockValue = Buffer.from('test');
  const mockPayload = {
    property: 'value',
  };

  let clientMock: Kafka;
  let schemaRegistryMock: SchemaRegistry;
  let apmService: ApmService;
  let producer: KafkaProducer;

  let mockProducer;

  beforeEach(() => {
    mockProducer = {
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn(),
    };
    clientMock = createMockInstance(Kafka);
    apmService = createMockInstance(ApmService);
    schemaRegistryMock = createMockInstance(SchemaRegistry);
    clientMock.producer = jest.fn().mockImplementationOnce(() => mockProducer);
    producer = new KafkaProducer(clientMock, schemaRegistryMock, apmService);
  });

  describe('registerProducerEvents', () => {
    it('registerProducerEvents success', async () => {
      schemaRegistryMock.register = jest
        .fn()
        .mockImplementationOnce(() => registerMockResult);
      await producer.registerProducerEvents([mockEvent]);
      expect(schemaRegistryMock.register).toBeCalledWith(
        mockEvent.messageSchema,
      );
    });

    it('registerProducerEvents schema registry fails', async () => {
      schemaRegistryMock.register = jest.fn().mockImplementationOnce(() => {
        throw new Error();
      });
      await expect(
        producer.registerProducerEvents([mockEvent]),
      ).rejects.toThrowError();
    });
  });

  describe('send', () => {
    it('send success', async () => {
      schemaRegistryMock.encode = jest
        .fn()
        .mockImplementationOnce(() => encodedMockValue);
      schemaRegistryMock.register = jest
        .fn()
        .mockImplementationOnce(() => registerMockResult);
      await producer.registerProducerEvents([mockEvent]);
      await producer.send(mockEvent, mockPayload);
      expect(schemaRegistryMock.encode).toHaveBeenCalledWith(
        registerMockResult.id,
        mockPayload,
      );
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: mockEvent.getMessageName(),
        messages: [
          {
            value: encodedMockValue,
          },
        ],
      });
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
      expect(clientMock.producer).toHaveBeenCalledTimes(1);
      expect(mockProducer.send).toHaveBeenCalledTimes(1);
      expect(schemaRegistryMock.encode).toHaveBeenCalledTimes(1);
    });

    it('send twice, connects once', async () => {
      schemaRegistryMock.encode = jest
        .fn()
        .mockImplementationOnce(() => encodedMockValue);
      schemaRegistryMock.register = jest
        .fn()
        .mockImplementationOnce(() => registerMockResult);
      await producer.registerProducerEvents([mockEvent]);
      await producer.send(mockEvent, mockPayload);
      await producer.send(mockEvent, mockPayload);
      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
      expect(clientMock.producer).toHaveBeenCalledTimes(1);
      expect(mockProducer.send).toHaveBeenCalledTimes(2);
      expect(schemaRegistryMock.encode).toHaveBeenCalledTimes(2);
    });

    it('send fails if no event is registered', async () => {
      await expect(producer.send(mockEvent, mockPayload)).rejects.toThrowError(
        'Provided event has no registered schema',
      );
    });
  });

  describe('disconnect', () => {
    it('disconnect called', async () => {
      await producer.disconnect();
      expect(mockProducer.disconnect).toBeCalledWith();
    });
  });
});
