import {
  OrchestrateClient,
  ISendTransactionRequest,
  IDeployContractRequest,
  IJobResponse,
  ISendRawRequest,
  IHeaders,
  ITransferRequest,
} from 'pegasys-orchestrate'
import { TransactionConfig } from './TransactionConfig'
import { OrchestrateUtils } from '../utils/OrchestrateUtils'
import cfg from '../config'
import { TransactionManager } from './TransactionManager'
import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import AxiosRetry from 'axios-retry'
import { sleep } from '../utils/sleep'
import { EthereumArgument } from './ContractManager'
import { ContractRegistry } from '../contracts/ContractRegistry'
import {
  ErrorCode,
  BaseException,
  UnauthorizedException,
  EntityNotFoundException,
  BadRequestException,
} from '@codefi-assets-and-payments/error-handler'

const unauthorizedClientRequestCodes = [401]
const invalidClientRequestCodes = [400, 404, 422]

@Injectable()
export class OrchestrateTransactionManager extends TransactionManager {
  private client: OrchestrateClient

  constructor(
    private readonly httpService: HttpService,
    protected readonly contractRegistry: ContractRegistry,
  ) {
    super(contractRegistry)
    this.client = new OrchestrateClient(cfg().orchestrateUrl)

    AxiosRetry(this.httpService.axiosRef, {
      retries: 20,
      retryDelay: (retryCount) => {
        this.logger.info(
          `OrchestrateTransactionManager [axios] Retry... ${retryCount} * 1000`,
        )
        return retryCount * 1000
      },
      retryCondition: (request) => {
        this.logger.info(
          `OrchestrateTransactionManager [axios] ${request.response.status}`,
        )
        return (
          request.isAxiosError &&
          (request.response.status === 404 || request.response.status === 500)
        )
      },
    })
  }

  async deploy(
    contractName: string,
    config: TransactionConfig,
    params?: EthereumArgument[],
    constructorName?: string,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string> {
    let orchestrateRequest: IDeployContractRequest
    try {
      orchestrateRequest =
        await OrchestrateUtils.buildOrchestrateDeployContractRequest(
          contractName,
          config,
          params,
          authToken,
          headers,
          labels,
        )

      this.logger.info(
        `Deploying contract ${contractName}, constructor ${constructorName}`,
      )

      const orchestrateResponse = await this.client.deployContract(
        OrchestrateUtils.reformatOrchestrateRequest(orchestrateRequest),
        idempotencyKey,
        authToken,
        headers,
      )

      return orchestrateResponse.uuid
    } catch (error) {
      this.logger.error(`Error deploying contract: ${error}`)
      if (unauthorizedClientRequestCodes.includes(error?.status)) {
        throw new UnauthorizedException(
          'Unauthorized Error',
          `Invalid authentication in Orchestrate with message ${
            error?.message
          } and headers=${JSON.stringify(headers || {})}`,
          {
            error,
            authToken,
            headers,
          },
        )
      } else if (invalidClientRequestCodes.includes(error?.status)) {
        throw new BadRequestException(
          'Bad request Error',
          `Bad request error in Orchestrate with parameters ${JSON.stringify(
            orchestrateRequest || {},
          )} with message ${error?.message} and headers=${JSON.stringify(
            headers || {},
          )}`,
          {
            error,
            authToken,
            headers,
          },
        )
      } else {
        throw new BaseException(
          ErrorCode.Application,
          'Orchestrate Error',
          `Unknown error in Orchestrate with status ${
            error?.status
          } with message ${error?.message} and headers=${JSON.stringify(
            headers || {},
          )}`,
          {
            error,
            authToken,
            headers,
          },
        )
      }
    }
  }

  async sendSignedTransaction(
    transaction: ISendRawRequest,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    try {
      const orchestrateResponse = await this.client.sendRawTransaction(
        OrchestrateUtils.reformatOrchestrateRequest(transaction),
        idempotencyKey,
        authToken,
        headers,
      )
      this.logger.info(`Sending raw transaction`)
      return orchestrateResponse.uuid
    } catch (error) {
      this.logger.error(`Error sending raw transaction: ${error}`)
      if (unauthorizedClientRequestCodes.includes(error?.status)) {
        throw new UnauthorizedException(
          'Unauthorized Error',
          `Invalid authentication in Orchestrate with message ${
            error?.message
          } and headers=${JSON.stringify(headers || {})}`,
          {
            error,
            authToken,
            headers,
          },
        )
      } else if (invalidClientRequestCodes.includes(error?.status)) {
        throw new BadRequestException(
          'Bad request Error',
          `Bad request error in Orchestrate with parameters ${JSON.stringify(
            transaction || {},
          )} with message ${error?.message} and headers=${JSON.stringify(
            headers || {},
          )}`,
          {
            error,
            authToken,
            headers,
          },
        )
      } else {
        throw new BaseException(
          ErrorCode.Application,
          'Orchestrate Error',
          `Unknown error in Orchestrate with status ${
            error?.status
          } with message ${error?.message} and headers=${JSON.stringify(
            headers || {},
          )}`,
          {
            error,
            authToken,
            headers,
          },
        )
      }
    }
  }

  async transfer(
    transferRequest: ITransferRequest,
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<string> {
    try {
      const orchestrateResponse = await this.client.transfer(
        OrchestrateUtils.reformatOrchestrateRequest(transferRequest),
        idempotencyKey,
        authToken,
        headers,
      )
      this.logger.info(`Sending a transfer transaction`)
      return orchestrateResponse.uuid
    } catch (error) {
      this.logger.error(`Error sending a transfer: ${error}`)
      throw error
    }
  }

  async exec(
    contractName: string,
    functionName: string,
    config: TransactionConfig,
    params: EthereumArgument[],
    idempotencyKey?: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
    labels?: Record<string, any>,
  ): Promise<string> {
    let orchestrateRequest: ISendTransactionRequest
    try {
      orchestrateRequest = await OrchestrateUtils.buildOrchestrateRequest(
        contractName,
        functionName,
        config,
        params,
        authToken,
        headers,
        labels,
      )
      this.logger.info(
        `Sending transaction to contract ${contractName}, function ${functionName}`,
      )
      const orchestrateResponse = await this.client.sendTransaction(
        OrchestrateUtils.reformatOrchestrateRequest(orchestrateRequest),
        idempotencyKey,
        authToken,
        headers,
      )

      return orchestrateResponse.uuid
    } catch (error) {
      this.logger.error(`Sending transaction: ${error}`)
      if (unauthorizedClientRequestCodes.includes(error?.status)) {
        throw new UnauthorizedException(
          'Unauthorized Error',
          `Invalid authentication in Orchestrate with message ${
            error?.message
          } and headers=${JSON.stringify(headers || {})}`,
          {
            error,
            authToken,
            headers,
          },
        )
      } else if (invalidClientRequestCodes.includes(error?.status)) {
        throw new BadRequestException(
          'Bad request Error',
          `Bad request error in Orchestrate with parameters ${JSON.stringify(
            orchestrateRequest || {},
          )} with message ${error?.message} and headers=${JSON.stringify(
            headers || {},
          )}`,
          {
            error,
            authToken,
            headers,
          },
        )
      } else {
        throw new BaseException(
          ErrorCode.Application,
          'Orchestrate Error',
          `Unknown error in Orchestrate with status ${
            error?.status
          } with message ${error?.message} and headers=${JSON.stringify(
            headers || {},
          )}`,
          {
            error,
            authToken,
            headers,
          },
        )
      }
    }
  }

  async findTransactionReceipt(
    transactionId: string,
    chainUuid: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    this.logger.info(`Finding scheduler by: ${transactionId}`)
    let response: IJobResponse = await this.getJobResponseByTransactionId(
      transactionId,
      authToken,
      headers,
    )
    const maxRetries = 100
    let found = this.isJobMined(response)
    let retries = 0
    while (!found && retries <= maxRetries) {
      this.logger.info(`Finding receipt, try ${retries}/${maxRetries}`)
      response = await this.getJobResponseByTransactionId(
        transactionId,
        authToken,
        headers,
      )
      found = this.isJobMined(response)
      await sleep(1000)
      retries++
    }
    if (found) {
      this.logger.info(`Found job MINED, txHash: ${response.transaction.hash}`)
      return this.findReceiptFromChain(
        chainUuid,
        response.transaction.hash,
        authToken,
        headers,
      )
    }
    throw new EntityNotFoundException(
      'Contract not found',
      `Could not find receipt for transactionId: ${transactionId}`,
      {
        transactionId,
        authToken,
        headers,
      },
    )
  }

  async findReceiptFromChain(
    chainUuid: string,
    txHash: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<any> {
    const jsonRpcCommand = {
      jsonrpc: '2.0',
      method: 'eth_getTransactionReceipt',
      params: [txHash],
      id: 1,
    }
    const config = this.craftConfig(authToken, headers)
    const orchestrateUrl = cfg().orchestrateUrl
    const url = cfg().orchestrateUrl.endsWith('/')
      ? orchestrateUrl
      : `${orchestrateUrl}/`
    this.logger.info(`Find receipt from url=${url} - txHash=${txHash}`)
    const receipt = await this.httpService
      .post(`${url}proxy/chains/${chainUuid}`, jsonRpcCommand, config)
      .toPromise()
    return receipt.data.result
  }

  private isJobMined(job: IJobResponse): boolean {
    this.logger.info(`Checking transaction status`)
    return job.status === 'MINED' ? true : false
  }

  private async getJobResponseByTransactionId(
    transactionId: string,
    authToken?: string,
    headers?: IHeaders, // [Optional] Can be used to specify 'X-Tenant-ID' headers, allowing to specify a different tenantId than the one extracted from 'authToken'
  ): Promise<IJobResponse> {
    const config = this.craftConfig(authToken, headers)
    const scheduleUrl = cfg().orchestrateUrl
    const url = cfg().orchestrateUrl.endsWith('/')
      ? scheduleUrl
      : `${scheduleUrl}/`
    const response = await this.httpService
      .get(`${url}transactions/${transactionId}`, config)
      .toPromise()
    const transaction = response.data
    this.logger.info(`Found transaction by uuid: ${transaction.uuid}`)

    const jobs: IJobResponse[] = transaction.jobs
    const job: IJobResponse = jobs.find((job) => job.status === 'MINED')

    return job ? job : jobs[0]
  }

  private craftConfig(authToken?: string, headers?: IHeaders) {
    return {
      headers: {
        ...headers,
        Authorization: 'Bearer '.concat(authToken),
      },
    }
  }
}
