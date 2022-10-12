import { IRawTransaction } from './IRawTransaction'
import { TransactionConfig } from './TransactionConfig'
import { EthereumArgument } from './ContractManager'
import { RawTransactionUtils } from '../utils/RawTransactionUtils'
import { ContractRegistry } from '../contracts/ContractRegistry'
import { TransactionManager } from './TransactionManager'
import { Injectable } from '@nestjs/common'
import { IHeaders } from 'pegasys-orchestrate'

const EthereumTx = require('ethereumjs-tx').Transaction

@Injectable()
export class RawTransactionManager extends TransactionManager {
  constructor(protected readonly contractRegistry: ContractRegistry) {
    super(contractRegistry)
  }

  async deploy(
    contractName: string,
    config: TransactionConfig,
    params: EthereumArgument[],
    constructorName?: string,
    idempotencyKey?: string, // Only used when we call Orchestrate (which is not the case here)
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<IRawTransaction> {
    this.logger.info(`Searching contract: ${contractName}`)
    const contractObject =
      await this.contractRegistry.getContractByContractName(
        contractName,
        authToken,
        headers,
      )
    const contract = this.ethersWrapper.contract(contractObject.abi)
    const contractInterface = contract.interface

    this.logger.info(`Encoding deployment`)
    const transactionData = contractInterface.encodeDeploy(params)

    const rawTransaction = RawTransactionUtils.buildRawTransaction(
      transactionData,
      config,
    )
    const ethereumTransaction = new EthereumTx(rawTransaction)
    return Promise.resolve({
      transactionPayload: rawTransaction.data,
      transaction: rawTransaction,
      transactionSerialized: `0x${ethereumTransaction
        .serialize()
        .toString('hex')}`,
    })
  }

  async exec(
    contractName: string,
    functionName: string,
    config: TransactionConfig,
    params: EthereumArgument[],
    idempotencyKey?: string, // Only used when we call Orchestrate (which is not the case here)
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<IRawTransaction> {
    this.logger.info(`Searching contract: ${contractName}`)
    const contractObject =
      await this.contractRegistry.getContractByContractName(
        contractName,
        authToken,
        headers,
      )
    const contract = this.ethersWrapper.contract(contractObject.abi)
    const contractInterface = contract.interface

    this.logger.info(`Encoding function: ${functionName}`)
    const transactionData = contractInterface.encodeFunctionData(
      functionName,
      params,
    )
    return RawTransactionUtils.buildRawTransaction(transactionData, config)
  }
}
