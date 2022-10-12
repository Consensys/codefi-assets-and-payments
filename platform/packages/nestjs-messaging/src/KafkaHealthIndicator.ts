import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { KafkaConsumer } from './KafkaConsumer';

// https://github.com/apache/kafka/blob/2.4.0/clients/src/main/java/org/apache/kafka/common/ConsumerGroupState.java#L25
const HEALTHY_CONSUMER_STATES = [
  'PreparingRebalance',
  'CompletingRebalance',
  'Stable',
];

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(private kafkaConsumer: KafkaConsumer) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const consumers = this.kafkaConsumer.getConsumers();

    const reports = await Promise.all(
      consumers.map(async (consumer) => {
        const groupDescription = await consumer.describeGroup();
        return {
          groupId: groupDescription.groupId,
          state: groupDescription.state,
          members: groupDescription.members?.map((member) => ({
            memberId: member.memberId,
            clientId: member.clientId,
          })),
        };
      }),
    );

    const isHealthy = reports.every((report) =>
      HEALTHY_CONSUMER_STATES.includes(report.state),
    );
    const result = this.getStatus(key, isHealthy, { reports });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('Kafka check failed', result);
  }
}
