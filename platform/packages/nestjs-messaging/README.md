# @consensys/nestjs-messaging

This is a package that exposes NestJS modules and classes ready to interact with Kafka using [Kafka.js](https://kafka.js.org/).
It serializes messages values using [AVRO](https://avro.apache.org/) and for uses [Confluent Schema Registry](https://www.confluent.io/confluent-schema-registry/) to track the currently saved messages schemas.

It should be used with `@consensys/messaging-events`

## How to use

To use this package in a NestJS microservice:

#### `main.ts`

##### Register events the microservice will produce

This is necessary because `KafkaProducer` will keep an internal cache with the `schemaId` from Schema Registry that will be used to encode the payload using the correct schema, then consumers will decode the payload knowing what was the schema that encoded it

```
async function bootstrap() {
[...]
  const kafkaProducer: KafkaProducer = app.get(KafkaProducer)

  kafkaProducer.registerProducerEvents([
    Events.someEvent
  ]).catch(error => {
    // treat the error
  })
[...]
}
```


`Events.someEvent` can be anything that implements `MicroserviceEvent` from `@consensys/messaging-events`

##### Register subscribers 

```
async function bootstrap() {
[...]
  const kafkaConsumer: KafkaConsumer = app.get(KafkaConsumer)
  const someConsumer: KafkaSubscriber = app.get(SomeConsumer)


  Promise.all([
    kafkaConsumer.addSubscriber(someConsumer)
  ]).catch(error => {
    // treat the error
  })
[...]
}
```

#### Produce messages

Producer can be imported in any microservice NestJS Module to be injected in the services.

```
send(event: MicroserviceEvent, payload: any): Promise<void>;

```

The message will be serialized using the schema corresponding to `MicroserviceEvent` that was registered or cached at the startup

#### Consume messages

Consumers need to be created in the microservice implementing `KafkaSubscriber`, example:

```
@Injectable()
export class SomeConsumer implements KafkaSubscriber {

  public topic = Events.someEvent.eventName

  onMessage(message: any) {
    // act on received message
  }
}
```

They can be `@Injectable`, part of modules and can inject other providers (for example database providers)

## Environment variables

Any microservice that uses this package can use these env variables to configure it:

* `KAFKA_BROKER` default: `localhost:9092`
* `KAFKA_CLIENT_ID` 
* `KAFKA_GROUP_ID` - It is **important** that different microservices have different group IDs
* `SCHEMA_REGISTRY_HOST` default: `http://localhost:8081`
* `SCHEMA_REGISTRY_MAX_RETRY_TIME_IN_SECS` default: 5 (integer)
* `SCHEMA_REGISTRY_INITIAL_RETRY_TIME_IN_SECS` default: 0.1 (float)
* `SCHEMA_REGISTRY_RETRY_FACTOR` default: 0.2 (float)
* `SCHEMA_REGISTRY_RETRY_MULTIPLIER` default: 2 (integer)
* `SCHEMA_REGISTRY_RETRY_RETRIES` default: 5 (integer)
* `CONSUMER_HOST_IP` allows the creation of a new Kafka client for KafkaConsumer
* `KAFKA_CONSUMER_SUBSCRIBE_FROM_BEGINNING` default: false - defines consumer behaviour when it is being initialised
* `KAFKA_CONSUMER_OPTIONS` default: {} - consumer options as a json string
* `KAFKA_PRODUCER_OPTIONS` default: {} - producer options as a json string
