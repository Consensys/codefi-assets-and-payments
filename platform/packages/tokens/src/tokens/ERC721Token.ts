import {
  ContractManager,
  TransactionConfig,
  IHeaders,
} from '@consensys/nestjs-orchestrate'
import { ApmService } from '@consensys/observability'
import { Injectable } from '@nestjs/common'
import BigNumber from 'bignumber.js'
import { RawTransaction } from '../types/RawTransaction'
import { labelsWithApm } from './utils'

@Injectable()
export class ERC721Token {
  public static readonly ERC721_CONTRACT_NAME = 'CodefiERC721'

  constructor(
    private contractManager: ContractManager,
    private readonly apmService: ApmService,
  ) {}

  // state changer functions
  async create(
    name: string,
    symbol: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.deploy(
      ERC721Token.ERC721_CONTRACT_NAME,
      config,
      [name, symbol],
      'constructor(string,string)',
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async mint(
    to: string,
    tokenId: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'mint(address,uint256)',
      config,
      [to, tokenId],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async safeMint(
    to: string,
    tokenId: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'safeMint(address,uint256)',
      config,
      [to, tokenId],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async safeMintWithData(
    to: string,
    tokenId: string | BigNumber,
    data: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'safeMint(address,uint256,bytes)',
      config,
      [to, tokenId, data],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async approve(
    to: string,
    tokenId: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'approve(address,uint256)',
      config,
      [to, tokenId],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async setApprovalForAll(
    to: string,
    approved: boolean,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'setApprovalForAll(address,bool)',
      config,
      [to, approved],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async transferFrom(
    from: string,
    to: string,
    tokenId: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'transferFrom(address,address,uint256)',
      config,
      [from, to, tokenId],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async safeTransferFrom(
    from: string,
    to: string,
    tokenId: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'safeTransferFrom(address,address,uint256)',
      config,
      [from, to, tokenId],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async safeTransferFromWithData(
    from: string,
    to: string,
    tokenId: string | BigNumber,
    data: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'safeTransferFrom(address,address,uint256,bytes)',
      config,
      [from, to, tokenId, data],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async transferOwnership(
    newOwner: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'transferOwnership(address)',
      config,
      [newOwner],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async burn(
    tokenId: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'burn(uint256)',
      config,
      [tokenId],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async setTokenURI(
    tokenId: string | BigNumber,
    uri: string,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManager.exec(
      ERC721Token.ERC721_CONTRACT_NAME,
      'setTokenURI(uint256,string)',
      config,
      [tokenId, uri],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  // view/pure functions
  async balanceOf(
    owner: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      ERC721Token.ERC721_CONTRACT_NAME,
      config,
      'balanceOf(address)',
      contractAddress,
      [owner],
      authToken,
      headers,
    )
  }

  async ownerOf(
    tokenId: string | BigNumber,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      ERC721Token.ERC721_CONTRACT_NAME,
      config,
      'ownerOf(uint256)',
      contractAddress,
      [tokenId],
      authToken,
      headers,
    )
  }

  async getApproved(
    tokenId: string | BigNumber,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManager.call(
      ERC721Token.ERC721_CONTRACT_NAME,
      config,
      'getApproved(uint256)',
      contractAddress,
      [tokenId],
      authToken,
      headers,
    )
  }

  async isApprovedForAll(
    owner: string,
    operator: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<boolean> {
    return this.contractManager.call(
      ERC721Token.ERC721_CONTRACT_NAME,
      config,
      'isApprovedForAll(address,address)',
      contractAddress,
      [owner, operator],
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
      ERC721Token.ERC721_CONTRACT_NAME,
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
      ERC721Token.ERC721_CONTRACT_NAME,
      config,
      'symbol()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }
}
