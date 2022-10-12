/* Example: ErrorName should be a unique name that is specific to a microservice */
export enum ErrorName {
  //Blockchain
  BlockchainConnectionException = 'BlockchainConnectionException',
  MethodNotFoundException = 'MethodNotFoundException',
  TransactionRevertedException = 'TransactionRevertedException',

  //Application
  EntityNotFoundException = 'EntityNotFoundException',
  ValidationException = 'ValidationException',
  BadRequestException = 'BadRequestException',
  UnauthorizedException = 'UnauthorizedException',
  ServiceUnavailableException = 'ServiceUnavailableException',

  //Database
  DatabaseConnectionException = 'DatabaseConnectionException',
  IntegrityConstraintViolationException = 'IntegrityConstraintViolationException',

  //Configuration
  ConfigurationException = 'ConfigurationException',

  //Kafka / Messaging
  KafkaException = 'KafkaException',
  MessagingConnectionException = 'MessagingConnectionException',

  //Microservices
  MicroServiceConnectionException = 'MicroServiceConnectionException',
}
