import { RawTransaction } from '../types/RawTransaction'
import BigNumber from 'bignumber.js'
import {
  ContractManager,
  TransactionConfig,
  IHeaders,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ERC1400Token {
  public static readonly ERC1400_CONTRACT_NAME = 'ERC1400'

  constructor(private contractManager: ContractManager) {}

  async create(
    name: string,
    symbol: string,
    granularity: string | BigNumber,
    controllers: string[],
    defaultPartitions: string[],
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ) {
    return this.contractManager.deploy(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      [name, symbol, granularity, controllers, defaultPartitions],
      'constructor(string,string,uint256,address[],bytes32[])',
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async setDocument(
    name: string,
    uri: string,
    documentHash: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'setDocument(bytes32,string,bytes32)',
      config,
      [name, uri, documentHash],
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
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'issueByPartition(bytes32,address,uint256,bytes)',
      config,
      [partition, tokenHolder, value, data],
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
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'redeemByPartition(bytes32,uint256,bytes)',
      config,
      [partition, value, data],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async operatorRedeemByPartition(
    partition: string,
    tokenHolder: string,
    value: string | BigNumber,
    data: string,
    operatorData: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'operatorRedeemByPartition(bytes32,address,uint256,bytes,bytes)',
      config,
      [partition, tokenHolder, value, data, operatorData],
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
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'transferByPartition(bytes32,address,uint256,bytes)',
      config,
      [partition, to, value, data],
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
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'operatorTransferByPartition(bytes32,address,address,uint256,bytes,bytes)',
      config,
      [partition, from, to, value, data, operatorData],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async setDefaultPartitions(
    partitions: string[],
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'setDefaultPartitions(bytes32[])',
      config,
      [partitions],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async authorizeOperatorByPartition(
    partition: string,
    operator: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'authorizeOperatorByPartition(bytes32,address)',
      config,
      [partition, operator],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async revokeOperatorByPartition(
    partition: string,
    operator: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'revokeOperatorByPartition(bytes32,address)',
      config,
      [partition, operator],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async authorizeOperator(
    operator: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'authorizeOperator(address)',
      config,
      [operator],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async revokeOperator(
    operator: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'revokeOperator(address)',
      config,
      [operator],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async transferWithData(
    to: string,
    value: string | BigNumber,
    data: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'transferWithData(address,uint256,bytes)',
      config,
      [to, value, data],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async transferFromWithData(
    from: string,
    to: string,
    value: string | BigNumber,
    data: string,
    operatorData: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'transferFromWithData(address,address,uint256,bytes,bytes)',
      config,
      [from, to, value, data, operatorData],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async redeem(
    value: string | BigNumber,
    data: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'redeem(uint256,bytes)',
      config,
      [value, data],
      idempotencyKey,
      authToken,
      headers,
    )
  }

  async redeemFrom(
    from: string,
    value: string | BigNumber,
    data: string,
    operatorData: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      'redeemFrom(address,uint256,bytes,bytes)',
      config,
      [from, value, data, operatorData],
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
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'controllers()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async getDocument(
    name: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'getDocument(bytes32)',
      contractAddress,
      [name],
      authToken,
      headers,
    )
  }

  async isControllable(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<boolean> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'isControllable()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async isIssuable(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<boolean> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'isIssuable()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async canTransferByPartition(
    partition: string,
    to: string,
    value: string | BigNumber,
    data: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'canTransferByPartition(bytes32,address,uint256,bytes)',
      contractAddress,
      [partition, to, value, data],
      authToken,
      headers,
    )
  }

  async canOperatorTransferByPartition(
    partition: string,
    from: string,
    to: string,
    value: string | BigNumber,
    data: string,
    operatorData: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'canOperatorTransferByPartition(bytes32,address,address,uint256,bytes,bytes)',
      contractAddress,
      [partition, from, to, value, data, operatorData],
      authToken,
      headers,
    )
  }

  async balanceOfPartition(
    partition: string,
    tokenHolder: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | BigNumber> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'balanceOfByPartition(bytes32,address)',
      contractAddress,
      [partition, tokenHolder],
      authToken,
      headers,
    )
  }

  async partitionsOf(
    tokenHolder: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string[]> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'partitionsOf(address)',
      contractAddress,
      [tokenHolder],
      authToken,
      headers,
    )
  }

  async getDefaultPartitions(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string[]> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'getDefaultPartitions()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async controllersByPartition(
    partition: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string[]> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'controllersByPartition(bytes32)',
      contractAddress,
      [partition],
      authToken,
      headers,
    )
  }

  async isOperatorForPartition(
    partition: string,
    operator: string,
    tokenHolder: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<boolean> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'isOperatorForPartition(bytes32,address,address)',
      contractAddress,
      [partition, operator, tokenHolder],
      authToken,
      headers,
    )
  }

  async name(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'name()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async symbol(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'symbol()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async totalSupply(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'totalSupply()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async balanceOf(
    owner: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'balanceOf(address)',
      contractAddress,
      [owner],
      authToken,
      headers,
    )
  }

  async granularity(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'granularity()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async isOperator(
    operator: string,
    tokenHolder: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<boolean> {
    return this.contractManager.call(
      ERC1400Token.ERC1400_CONTRACT_NAME,
      config,
      'isOperator(address,address)',
      contractAddress,
      [operator, tokenHolder],
      authToken,
      headers,
    )
  }
}
