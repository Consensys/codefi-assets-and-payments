import BigNumber from 'bignumber.js'
import {
  ContractManager,
  TransactionConfig,
  IHeaders,
} from '@codefi-assets-and-payments/nestjs-orchestrate'
import { Injectable } from '@nestjs/common'
import { RawTransaction } from '../types/RawTransaction'
import { ApmService } from '@codefi-assets-and-payments/observability'
import { labelsWithApm } from './utils'
@Injectable()
export class ERC20Token {
  public static readonly ERC20_CONTRACT_NAME = 'CodefiERC20'

  constructor(
    protected contractManagerToken: ContractManager,
    private readonly apmService: ApmService,
  ) {}

  // state changer functions
  async create(
    name: string,
    symbol: string,
    decimals: number,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManagerToken.deploy(
      ERC20Token.ERC20_CONTRACT_NAME,
      config,
      [name, symbol, decimals],
      'constructor(string,string,uint8)',
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async transfer(
    recipient: string,
    amount: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManagerToken.exec(
      ERC20Token.ERC20_CONTRACT_NAME,
      'transfer(address,uint256)',
      config,
      [recipient, amount],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async approve(
    spender: string,
    amount: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManagerToken.exec(
      ERC20Token.ERC20_CONTRACT_NAME,
      'approve(address,uint256)',
      config,
      [spender, amount],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async transferFrom(
    sender: string,
    recipient: string,
    amount: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManagerToken.exec(
      ERC20Token.ERC20_CONTRACT_NAME,
      'transferFrom(address,address,uint256)',
      config,
      [sender, recipient, amount],
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
    return this.contractManagerToken.exec(
      ERC20Token.ERC20_CONTRACT_NAME,
      'transferOwnership(address)',
      config,
      [newOwner],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async mint(
    sender: string,
    amount: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManagerToken.exec(
      ERC20Token.ERC20_CONTRACT_NAME,
      'mint(address,uint256)',
      config,
      [sender, amount],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  async burn(
    amount: string | BigNumber,
    config: TransactionConfig,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | RawTransaction> {
    return this.contractManagerToken.exec(
      ERC20Token.ERC20_CONTRACT_NAME,
      'burn(uint256)',
      config,
      [amount],
      idempotencyKey,
      authToken,
      headers,
      labelsWithApm(labels, this.apmService),
    )
  }

  // view/pure functions
  async balanceOf(
    account: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManagerToken.call(
      ERC20Token.ERC20_CONTRACT_NAME,
      config,
      'balanceOf(address)',
      contractAddress,
      [account],
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
    return this.contractManagerToken.call(
      ERC20Token.ERC20_CONTRACT_NAME,
      config,
      'totalSupply()',
      contractAddress,
      [],
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
    return this.contractManagerToken.call(
      ERC20Token.ERC20_CONTRACT_NAME,
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
    return this.contractManagerToken.call(
      ERC20Token.ERC20_CONTRACT_NAME,
      config,
      'symbol()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async decimals(
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.contractManagerToken.call(
      ERC20Token.ERC20_CONTRACT_NAME,
      config,
      'decimals()',
      contractAddress,
      [],
      authToken,
      headers,
    )
  }

  async allowance(
    owner: string,
    spender: string,
    contractAddress: string,
    config: TransactionConfig,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<number> {
    return this.contractManagerToken.call(
      ERC20Token.ERC20_CONTRACT_NAME,
      config,
      'allowance(address,address)',
      contractAddress,
      [owner, spender],
      authToken,
      headers,
    )
  }
}
