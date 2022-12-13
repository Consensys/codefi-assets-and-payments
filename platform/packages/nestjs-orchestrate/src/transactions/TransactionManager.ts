import { EthersWrapper } from '@consensys/ethers'
import { IHeaders } from 'pegasys-orchestrate'
import { ContractRegistry } from '../contracts/ContractRegistry'
import { EthereumArgument } from './ContractManager'
import { IRawTransaction } from './IRawTransaction'
import { TransactionConfig } from './TransactionConfig'
import { createLogger } from '@consensys/observability'
import { PinoLogger } from '@consensys/observability'

export abstract class TransactionManager {
  protected readonly ethersWrapper: EthersWrapper
  protected readonly logger: PinoLogger = createLogger('orchestrate')

  constructor(protected contractRegistry: ContractRegistry) {
    this.ethersWrapper = new EthersWrapper()
  }

  abstract deploy(
    contractName: string,
    config: TransactionConfig,
    params: EthereumArgument[],
    constructorName: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string | IRawTransaction>

  abstract exec(
    contractName: string,
    functionName: string,
    config: TransactionConfig,
    params: EthereumArgument[],
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string | IRawTransaction>

  async call(
    contractName: string,
    functionName: string,
    params: EthereumArgument[],
    contractAddress: string,
    blockchainUrl: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    this.logger.info(`Searching contract: ${contractName}`)
    const contractObject =
      await this.contractRegistry.getContractByContractName(
        contractName,
        authToken,
        headers,
      )
    await this.ethersWrapper.instance(blockchainUrl)
    const contract = this.ethersWrapper.contract(
      contractObject.abi,
      contractAddress,
    )
    this.logger.info(`Calling function: ${functionName}`)
    const response = await contract.functions[functionName](...params)
    return response
  }
}
