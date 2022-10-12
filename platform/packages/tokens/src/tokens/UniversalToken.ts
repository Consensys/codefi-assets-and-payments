import { RawTransaction } from '../types/RawTransaction'
import BigNumber from 'bignumber.js'
import {
  ContractManager,
  TransactionConfig,
  IHeaders,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Injectable } from '@nestjs/common'

export enum CertificateValidation {
  None,
  NonceBased,
  SaltBased,
}

@Injectable()
export class UniversalToken {
  public static readonly UNIVERSAL_TOKEN_CONTRACT_NAME =
    'ERC1400HoldableCertificateToken'
  public static readonly ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME =
    'ERC1400TokensValidator'
  public static readonly ERC1820_REGISTRY = 'ERC1820Registry'
  public static readonly ERC1820_REGISTRY_ADDRESS =
    '0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24'
  public static readonly ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME_HASH =
    '0x595db897d6dbdcb800524f62aac721a55f3203c7bf80bd14e6e90920e184a21d'

  constructor(private contractManager: ContractManager) {}

  async create(
    name: string,
    symbol: string,
    granularity: string | BigNumber,
    controllers: string[],
    defaultPartitions: string[],
    extension: string,
    newOwner: string,
    certificateSigner: string,
    certificateActivated: CertificateValidation,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.deploy(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      config,
      [
        name,
        symbol,
        granularity,
        controllers,
        defaultPartitions,
        extension,
        newOwner,
        certificateSigner,
        certificateActivated,
      ],
      'constructor(string,string,uint256,address[],bytes32[],address,address,address,CertificateValidation)',
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async setTokenExtension(
    extension: string,
    interfaceLabel: string,
    removeOldExtensionRoles: boolean,
    addMinterRoleForExtension: boolean,
    addControllerRoleForExtension: boolean,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.exec(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      'setTokenExtension(address, string, bool, bool, bool)',
      config,
      [
        extension,
        interfaceLabel,
        removeOldExtensionRoles,
        addMinterRoleForExtension,
        addControllerRoleForExtension,
      ],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async issueByPartition(
    partition: string,
    tokenHolder: string,
    value: string | BigNumber,
    data: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.exec(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      'issueByPartition(bytes32 , address, uint256, bytes)',
      config,
      [partition, tokenHolder, value, data],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async transferByPartition(
    partition: string,
    to: string,
    value: string | BigNumber,
    data: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.exec(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      'transferByPartition(bytes32,address,uint256,bytes)',
      config,
      [partition, to, value, data],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async redeemByPartition(
    partition: string,
    value: string | BigNumber,
    data: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.exec(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      'redeemByPartition(bytes32,uint256,bytes)',
      config,
      [partition, value, data],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async operatorTransferByPartition(
    partition: string,
    from: string,
    to: string,
    value: string | BigNumber,
    data: string,
    operatorData: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.exec(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      'operatorTransferByPartition(bytes32,address,address,uint256,bytes,bytes)',
      config,
      [partition, from, to, value, data, operatorData],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async operatorRedeemByPartition(
    partition: string,
    tokenHolder: string,
    value: string | BigNumber,
    operatorData: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.exec(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      'operatorRedeemByPartition(bytes32,address,uint256,bytes)',
      config,
      [partition, tokenHolder, value, operatorData],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async transferOwnership(
    newOwner: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      'transferOwnership(address)',
      config,
      [newOwner],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  // Universal Token (extension contract)
  async addAllowlisted(
    token: string,
    participant: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    const contractAddress = await this.getInterfaceImplementer(
      UniversalToken.ERC1820_REGISTRY_ADDRESS,
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME_HASH,
      config,
      authToken,
      headers,
    )

    return this.contractManager.exec(
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME,
      'addAllowlisted(address, address)',
      { ...config, to: contractAddress },
      [token, participant],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async removeAllowlisted(
    token: string,
    participant: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    const contractAddress = await this.getInterfaceImplementer(
      UniversalToken.ERC1820_REGISTRY_ADDRESS,
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME_HASH,
      config,
      authToken,
      headers,
    )

    return this.contractManager.exec(
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME,
      'removeAllowlisted(address, address)',
      { ...config, to: contractAddress },
      [token, participant],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async hold(
    token: string,
    holdId: string,
    recipient: string,
    notary: string,
    partition: string,
    value: string | BigNumber,
    timeToExpiration: string | BigNumber,
    secretHash: string,
    certificate: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    const contractAddress = await this.getInterfaceImplementer(
      UniversalToken.ERC1820_REGISTRY_ADDRESS,
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME_HASH,
      config,
      authToken,
      headers,
    )
    return this.contractManager.exec(
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME,
      'hold(address, bytes32, address, address, bytes32, uint256, unit256, bytes32, bytes)',
      { ...config, to: contractAddress },
      [
        token,
        holdId,
        recipient,
        notary,
        partition,
        value,
        timeToExpiration,
        secretHash,
        certificate,
      ],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async holdFrom(
    token: string,
    holdId: string,
    sender: string,
    recipient: string,
    notary: string,
    partition: string,
    value: string | BigNumber,
    timeToExpiration: string | BigNumber,
    secretHash: string,
    certificate: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    const contractAddress = await this.getInterfaceImplementer(
      UniversalToken.ERC1820_REGISTRY_ADDRESS,
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME_HASH,
      config,
      authToken,
      headers,
    )
    return this.contractManager.exec(
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME,
      'holdFrom(address, bytes32, address, address, address, bytes32, uint256, unit256, bytes32, bytes)',
      { ...config, to: contractAddress },
      [
        token,
        holdId,
        sender,
        recipient,
        notary,
        partition,
        value,
        timeToExpiration,
        secretHash,
        certificate,
      ],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async executeHold(
    token: string,
    holdId: string,
    value: string | BigNumber,
    secret: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    const contractAddress = await this.getInterfaceImplementer(
      UniversalToken.ERC1820_REGISTRY_ADDRESS,
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME_HASH,
      config,
      authToken,
      headers,
    )
    return this.contractManager.exec(
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME,
      'executeHold(address, bytes32, unit256, bytes32)',
      { ...config, to: contractAddress },
      [token, holdId, value, secret],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async releaseHold(
    token: string,
    holdId: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    const contractAddress = await this.getInterfaceImplementer(
      UniversalToken.ERC1820_REGISTRY_ADDRESS,
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME_HASH,
      config,
      authToken,
      headers,
    )
    return this.contractManager.exec(
      UniversalToken.ERC1400_TOKENS_VALIDATOR_CONTRACT_NAME,
      'releaseHold(address, bytes32)',
      { ...config, to: contractAddress },
      [token, holdId],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  // view
  async controllers(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string[]> {
    return this.contractManager.call(
      UniversalToken.UNIVERSAL_TOKEN_CONTRACT_NAME,
      config,
      'controllers()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async getInterfaceImplementer(
    contractAddress: string,
    interfaceHash: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      UniversalToken.ERC1820_REGISTRY,
      config,
      'getInterfaceImplementer(address,bytes32)',
      contractAddress,
      [contractAddress, interfaceHash],
      authToken,
      headers,
    )
  }
}
