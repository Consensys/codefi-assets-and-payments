import { check } from 'k6'
import {
  reader,
  writer,
  produceWithConfiguration,
  consumeWithConfiguration,
  Writer,
  Reader,
} from 'k6/x/kafka'
import { cfg } from './config'

const configuration = JSON.stringify({
  consumer: {
    keyDeserializer: '',
    valueDeserializer: 'io.confluent.kafka.serializers.KafkaAvroDeserializer',
  },
  producer: {
    keySerializer: '',
    valueSerializer: 'io.confluent.kafka.serializers.KafkaAvroSerializer',
  },
  schemaRegistry: {
    url: cfg().kafka.schemaRegistry,
  },
})

const brokers = cfg().kafka.brokers

export class ConsumerList {
  constructor(public consumers: Reader[] = []) {}

  close() {
    for (const consumer of this.consumers) {
      consumer.close()
    }
  }
}

export const createProducer = (topic: string): Writer => {
  return writer(brokers, topic, null, null)
}

export const createConsumers = (
  topic: string,
  partitionCount = 1,
): ConsumerList => {
  const consumers = []

  for (let partition = 0; partition < partitionCount; partition++) {
    consumers.push(reader(brokers, topic, partition, '', null, null))
  }

  return new ConsumerList(consumers)
}

export const sendMessage = (producer: Writer, payload: any, schema: any) => {
  let errors = produceWithConfiguration(
    producer,
    [
      {
        value: JSON.stringify(payload),
      },
    ],
    configuration,
    null,
    JSON.stringify(schema),
  )

  if (errors !== undefined) {
    console.log(errors)
  }

  check(errors, {
    'Message Sent': (errors) => errors == undefined,
  })
}

export const waitForMessage = (
  consumerList: ConsumerList,
  schema: any,
  filter: (messageData: any) => boolean,
  timeout = cfg().kafka.waitTimeout,
) => {
  const startTime = new Date().getTime()
  let currentTime = startTime
  let messageFound = false
  const schemaString = JSON.stringify(schema)

  while (currentTime - startTime < timeout) {
    for (const consumer of consumerList.consumers) {
      let messages = []

      try {
        messages = consumeWithConfiguration(
          consumer,
          1,
          configuration,
          null,
          schemaString,
          cfg().kafka.consumeTimeout,
        )
      } catch (e) {}

      if (messages.find((message) => filter(message.value))) {
        messageFound = true
        break
      }
    }

    if (messageFound) break

    currentTime = new Date().getTime()
  }

  check(messageFound, {
    'Message Received': (messageFound) => messageFound,
  })
}
