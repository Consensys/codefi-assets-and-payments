declare module 'k6/x/kafka' {
  export class Reader {
    public close()
  }

  export class Writer {
    public close()
  }

  export interface WriterMessage {
    key?: string
    value: string
  }

  export interface ReaderMessage {
    value: any
  }

  /**
   * Create a new Writer object for writing messages to Kafka.
   *
   * @constructor
   * @param   brokers     An array of brokers.
   * @param   topic       The topic to write to.
   * @param   auth        The authentication credentials for SASL PLAIN/SCRAM.
   * @param   compression The Compression algorithm.
   * @returns             A Writer object.
   */
  export function writer(
    brokers: string[],
    topic: string,
    auth: string,
    compression: string,
  ): Writer

  /**
   * Write a sequence of messages to Kafka.
   *
   * @function
   * @param   writer      The writer object created with the writer constructor.
   * @param   messages    An array of message objects containing an optional key and a value.
   * @param   keySchema   An optional Avro/JSONSchema schema for the key.
   * @param   valueSchema An optional Avro/JSONSchema schema for the value.
   * @returns             A string containing the error.
   */
  export function produce(
    writer: Writer,
    messages: WriterMessage[],
    keySchema: string,
    valueSchema: string,
  ): string

  /**
   * Write a sequence of messages to Kafka with a specific serializer/deserializer.
   *
   * @function
   * @param   writer              The writer object created with the writer constructor.
   * @param   messages            An array of message objects containing an optional key and a value.
   * @param   configurationJson   Serializer, deserializer and schemaRegistry configuration.
   * @param   keySchema           An optional Avro/JSONSchema schema for the key.
   * @param   valueSchema         An optional Avro/JSONSchema schema for the value.
   * @returns                     A string containing the error.
   */
  export function produceWithConfiguration(
    writer: Writer,
    messages: WriterMessage[],
    configurationJson: string,
    keySchema: string,
    valueSchema: string,
  ): string

  /**
   * Create a new Reader object for reading messages from Kafka.
   *
   * @constructor
   * @param   brokers     An array of brokers.
   * @param   topic       The topic to read from.
   * @param   partition   The partition.
   * @param   groupID     The group ID.
   * @param   offset      The offset to begin reading from.
   * @param   auth        Authentication credentials for SASL PLAIN/SCRAM.
   * @returns             A Reader object.
   */
  export function reader(
    brokers: string[],
    topic: string,
    partition: number,
    groupID: string,
    offset: number,
    auth: string,
  ): Reader

  /**
   * Read a sequence of messages from Kafka.
   *
   * @function
   * @param   reader      The reader object created with the reader constructor.
   * @param   limit       How many messages should be read in one go, which blocks. Defaults to 1.
   * @param   keySchema   An optional Avro/JSONSchema schema for the key.
   * @param   valueSchema An optional Avro/JSONSchema schema for the value.
   * @param   timeout     Maximum time in milliseconds to wait for the requested number of messages.
   * @returns             An array of consumed messages.
   */
  export function consume(
    reader: Reader,
    limit: number,
    keySchema: string,
    valueSchema: string,
    timeout: number,
  ): ReaderMessage[]

  /**
   * Read a sequence of messages from Kafka.
   *
   * @function
   * @param   reader              The reader object created with the reader constructor.
   * @param   limit               How many messages should be read in one go, which blocks. Defaults to 1.
   * @param   configurationJson   Serializer, deserializer and schemaRegistry configuration.
   * @param   keySchema           An optional Avro/JSONSchema schema for the key.
   * @param   valueSchema         An optional Avro/JSONSchema schema for the value.
   * @param   timeout             Maximum time in milliseconds to wait for the requested number of messages.
   * @returns                     An array of consumed messages.
   */
  export function consumeWithConfiguration(
    reader: Reader,
    limit: number,
    configurationJson: string,
    keySchema: string,
    valueSchema: string,
    timeout: number,
  ): ReaderMessage[]

  /**
   * Create a topic in Kafka. It does nothing if the topic exists.
   *
   * @function
   * @param   address             The broker address.
   * @param   topic               The topic name.
   * @param   partitions          The number of partitions.
   * @param   replicationFactor   The replication factor in a clustered setup.
   * @param   compression         The compression algorithm.
   * @param   auth                Authentication credentials for SASL PLAIN/SCRAM.
   * @returns                     A string containing the error.
   */
  export function createTopic(
    address: string,
    topic: string,
    partitions: number,
    replicationFactor: number,
    compression: string,
    auth: string,
  ): string

  /**
   * Delete a topic from Kafka. It raises an error if the topic doesn't exist.
   *
   * @function
   * @param   address The broker address.
   * @param   topic   The topic name.
   * @param   auth    Authentication credentials for SASL PLAIN/SCRAM.
   * @returns         A string containing the error.
   */
  export function deleteTopic(
    address: string,
    topic: string,
    auth: string,
  ): string

  /**
   * List all topics in Kafka.
   *
   * @function
   * @param   address The broker address.
   * @param   auth    Authentication credentials for SASL PLAIN/SCRAM.
   * @returns         A nested list of strings containing a list of topics and the error (if any).
   */
  export function listTopics(address: string, auth: string): [string[], string]
}
