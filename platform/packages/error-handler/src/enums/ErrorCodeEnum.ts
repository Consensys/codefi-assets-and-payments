export enum ErrorCode {
  Blockchain = 'EBLK00',
  BlockchainTransaction = 'EBLK01',
  BlockchainConnection = 'EBLK02',
  BlockchainContractDeployment = 'EBLK03',

  Application = 'EAPP00',
  ApplicationNotFound = 'EAPP01',
  ApplicationRequest = 'EAPP02',
  ApplicationPermission = 'EAPP03',
  ApplicationValidation = 'EAPP04',
  ApplicationType = 'EAPP05',
  ApplicationConflict = 'EAPP06',

  Database = 'EDAT00',

  Configuration = 'ECOF00',

  Kafka = 'EKAF00',

  MessageConnection = 'EMSG01',
  ProcessingMessage = 'EMSG02',

  MicroserviceConnection = 'EMSC01',

  ExternalDependencyError = 'EXT01',
}
