import { TransactionConfig, TransactionType } from './TransactionConfig'
import { OrchestrateTransactionManager } from './OrchestrateTransactionManager'
import BigNumber from 'bignumber.js'
import { Injectable } from '@nestjs/common'
import { IRawTransaction } from './IRawTransaction'
import { RawTransactionManager } from './RawTransactionManager'
import { IChain, IHeaders, ISendRawRequest } from 'pegasys-orchestrate'
import { ChainRegistry } from '../chains/ChainRegistry'
import { BadRequestException } from '@codefi-assets-and-payments/error-handler'
import { createLogger } from '@codefi-assets-and-payments/observability'

export type EthereumArgument =
  | string
  | BigNumber
  | number
  | boolean
  | string[]
  | boolean[]
  | number[]
  | (BigNumber | string)[]

@Injectable()
export class ContractManager {
  constructor(
    private orchestrateTransactionManager: OrchestrateTransactionManager,
    private rawTransactionManager: RawTransactionManager,
    private chainRegistry: ChainRegistry,
  ) {}
  private logger = createLogger('orchestrate')

  /**
   * A function used to manage operations that can execute a transaction.
   * If `TransactionConfig.transactionType` is `TransactionType.RawTransaction` a raw transaction will be returned but not executed
   * If `TransactionConfig.transactionType` is `TransactionType.SendTransaction` the transaction will be executed using Orchestrate
   * @param contractName The contract name. In the case of Orchestrate it is needed that the contract exists in api-contract-registry
   * @param functionName The function to execute (it must be an ABI signature, e.g. transfer(address,uint256))
   * @param config configuration that can be overridden by env vars
   * @param params Params in the same order than declared in the smart contract function
   */
  async exec(
    contractName: string,
    functionName: string,
    config: TransactionConfig,
    params?: EthereumArgument[],
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | IRawTransaction> {
    if (!config.to) {
      throw new BadRequestException(
        'Bad request',
        `Config property 'to' must be set to run a function of a contract`,
        {
          config,
        },
      )
    }

    let response
    if (config.transactionType === TransactionType.RawTransaction) {
      response = await this.rawTransactionManager.exec(
        contractName,
        functionName,
        config,
        this.paramsToString(params),
        idempotencyKey,
        authToken,
        headers,
      )
    } else {
      response = await this.orchestrateTransactionManager.exec(
        contractName,
        functionName,
        config,
        this.paramsToString(params),
        idempotencyKey,
        authToken,
        headers,
        labels,
      )
    }
    return response
  }

  /**
   * A function used to manage operations that can deploy a contract.
   * If `TransactionConfig.transactionType` is `TransactionType.RawTransaction` a raw transaction will be returned but not executed
   * If `TransactionConfig.transactionType` is `TransactionType.SendTransaction` the transaction will be executed using Orchestrate
   * @param contractName The contract name. In the case of Orchestrate it is needed that the contract exists in api-contract-registry
   * @param config configuration that can be overridden by env vars
   * @param params Params in the same order than declared in the smart contract function
   * @param constructorName required param when constructor of the contract has signature
   */
  async deploy(
    contractName: string,
    config: TransactionConfig,
    params?: EthereumArgument[],
    constructorName?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | IRawTransaction> {
    let response
    if (config.transactionType === TransactionType.RawTransaction) {
      response = await this.rawTransactionManager.deploy(
        contractName,
        config,
        this.paramsToString(params),
        constructorName,
        idempotencyKey,
        authToken,
        headers,
      )
    } else {
      response = await this.orchestrateTransactionManager.deploy(
        contractName,
        config,
        this.paramsToString(params),
        constructorName,
        idempotencyKey,
        authToken,
        headers,
        labels,
      )
    }
    return response
  }

  async sendSignedTransaction(
    transaction: ISendRawRequest,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    return this.orchestrateTransactionManager.sendSignedTransaction(
      transaction,
      idempotencyKey,
      authToken,
      headers,
    )
  }

  /**
   * A function used to manage operations that can call pure functions.
   * @param contractName The contract name. In the case of Orchestrate it is needed that the contract exists in api-contract-registry
   * @param config configuration that can be overridden by env vars
   * @param functionName name of the function to be called
   * @param contractAddress address of the contract
   * @param params Params in the same order than declared in the smart contract function
   * @param chainRegistryUrl Orchestrate chain url and chain uuid to instantiate a new provider
   */
  async call(
    contractName: string,
    config: TransactionConfig,
    functionName: string,
    contractAddress: string,
    params?: EthereumArgument[],
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    const chainName = config.chainName
    if (!chainName) {
      throw new BadRequestException(
        'Bad request',
        `Config property 'chainName' must be set to run a function of a contract`,
        {
          config,
        },
      )
    }

    const chain: IChain = await this.chainRegistry.getChain(
      chainName,
      authToken,
      headers,
    )
    this.logger.info(
      `Retrieved chain with chainName=${chainName}, uuid=${chain.uuid}`,
    )
    const response = await this.rawTransactionManager.call(
      contractName,
      functionName,
      this.paramsToString(params),
      contractAddress,
      chain.urls[0],
      authToken,
      headers,
    )

    return response
  }

  async findTransactionReceipt(
    transactionId: string,
    chainUuid: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    return this.orchestrateTransactionManager.findTransactionReceipt(
      transactionId,
      chainUuid,
      authToken,
      headers,
    )
  }

  async findTransactionReceiptByHash(
    transactionHash: string,
    chainUuid: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    return this.orchestrateTransactionManager.findReceiptFromChain(
      chainUuid,
      transactionHash,
      authToken,
      headers,
    )
  }

  private paramsToString(params: any[]): (string | boolean)[] {
    return params.map((p) => {
      if (p instanceof Array) {
        return this.paramsToString(p)
      }
      if (p instanceof BigNumber) {
        return `0x${p.toString(16)}`
      }
      if (typeof p === 'boolean') {
        return p
      }
      return p.toString()
    })
  }
}
