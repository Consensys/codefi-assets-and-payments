import { KafkaConsumer } from '.';
import createMockInstance from 'jest-create-mock-instance';
import { KafkaHealthIndicator } from './KafkaHealthIndicator';
import { Consumer } from 'kafkajs';

describe('KafkaConsumer', () => {
  let kafkaConsumerMock: jest.Mocked<KafkaConsumer>;
  let kafkaHealthIndicator: KafkaHealthIndicator;
  let consumerA: Consumer;
  let consumerB: Consumer;

  beforeEach(() => {
    kafkaConsumerMock = createMockInstance(KafkaConsumer);

    kafkaHealthIndicator = new KafkaHealthIndicator(kafkaConsumerMock);

    consumerA = {
      describeGroup: jest.fn().mockResolvedValueOnce({
        groupId: 'groupA',
        state: 'Stable',
        members: [{ memberId: 'memberA', clientId: 'client1' }],
      }),
    } as any;

    consumerB = {
      describeGroup: jest.fn().mockResolvedValueOnce({
        groupId: 'groupA',
        state: 'Stable',
        members: [{ memberId: 'memberB', clientId: 'client1' }],
      }),
    } as any;
  });

  it('isHealthy returns details', async () => {
    kafkaConsumerMock.getConsumers.mockReturnValueOnce([consumerA, consumerB]);

    const result = await kafkaHealthIndicator.isHealthy('kafka');

    expect(result).toEqual({
      kafka: {
        status: 'up',
        reports: [
          {
            groupId: 'groupA',
            state: 'Stable',
            members: [
              {
                memberId: 'memberA',
                clientId: 'client1',
              },
            ],
          },
          {
            groupId: 'groupA',
            state: 'Stable',
            members: [
              {
                memberId: 'memberB',
                clientId: 'client1',
              },
            ],
          },
        ],
      },
    });
  });

  it('isHealthy returns error when a consumer is not healthy', async () => {
    consumerB = {
      describeGroup: jest.fn().mockResolvedValueOnce({
        groupId: 'groupA',
        state: 'Empty',
        members: [{ memberId: 'memberB', clientId: 'client1' }],
      }),
    } as any;

    kafkaConsumerMock.getConsumers.mockReturnValueOnce([consumerA, consumerB]);

    await expect(kafkaHealthIndicator.isHealthy('kafka')).rejects.toThrowError(
      'Kafka check failed',
    );
  });
});
