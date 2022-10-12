export enum LocalErrorName {
  // Controllers
  ControllerValidationException = 'ControllerValidationException',
  InsufficientPermissionsException = 'InsufficientPermissionsException',

  // Tenants
  TenantNotFoundException = 'TenantNotFoundException',

  // Entities
  EntityNotFoundException = 'EntityNotFoundException',
  DefaultWalletDoesNotExistException = 'DefaultWalletDoesNotExistException',

  // Wallets
  WalletNotFoundException = 'WalletNotFoundException',
  OrchestrateWalletNotRegisteredException = 'OrchestrateWalletNotRegisteredException',
  NoWalletAddressProvidedException = 'NoWalletAddressProvidedException',
  DefaultWalletDeletedException = 'DefaultWalletDeletedException',
  NoStoreMappingException = 'NoStoreMappingException',

  // Store Mappings
  InvalidStoreMappingException = 'InvalidStoreMappingException',

  // Clients
  DuplicateClientException = 'DuplicateClientException',
  ClientTypeNotSupportedException = 'ClientTypeNotSupportedException',
}
