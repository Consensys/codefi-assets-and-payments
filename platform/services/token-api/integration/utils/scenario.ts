import { deployTokenPost, AxiosResponse } from './requests'
import {
  erc721TokenIdMock,
  subjectMock,
  tokensERC721DeployRequestMock,
} from '../../test/mocks'
import jwt from 'jsonwebtoken'
import { TestingModule } from '@nestjs/testing'
import { DEV_CODEFI_API_AUDIENCE } from './configs'
import { OrchestrateAccountsService } from '@codefi-assets-and-payments/nestjs-orchestrate'
import {
  generateAccount,
  testModule,
  TEST_KAFKA_CONSUMER_PROVIDER_1,
  TEST_KAFKA_CONSUMER_PROVIDER_2,
  TEST_KAFKA_CONSUMER_PROVIDER_3,
  TEST_KAFKA_CONSUMER_PROVIDER_4,
  TEST_KAFKA_CONSUMER_PROVIDER_5,
  waitForTransactionResponse,
  waitForOperationResponse,
  waitForNextTransactionResponse,
  waitForTokenDeployTransaction,
  getAuthTokenWithTenantId1,
  getAuthTokenWithoutPermissions,
} from './/testCommonUtils'
import { v4 as uuidv4 } from 'uuid'
import { OperationEntity } from '../../src/data/entities/OperationEntity'
import { Repository } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { TokenEntity } from '../../src/data/entities/TokenEntity'
import { KafkaConsumer, KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import { TestKafkaConsumer } from './TestKafkaConsumer'
import {
  Commands,
  Events,
  MintTokenCommandBuilder,
  TransactionConfigBuilder,
  IAsyncOperationResultEvent,
  MicroserviceMessage,
} from '@codefi-assets-and-payments/messaging-events'
import { EntityStatus, NewTokenResponse, TokenType } from '@codefi-assets-and-payments/ts-types'
import config from '../../src/config'

const CONSUMER_NAME_ASYNC = 'async'
const CONSUMER_PROVIDERS = [
  TEST_KAFKA_CONSUMER_PROVIDER_1,
  TEST_KAFKA_CONSUMER_PROVIDER_2,
  TEST_KAFKA_CONSUMER_PROVIDER_3,
  TEST_KAFKA_CONSUMER_PROVIDER_4,
  TEST_KAFKA_CONSUMER_PROVIDER_5,
]

export const AUTOMATIC = null

export class TestScenario {
  // Core
  name: string
  appModule: TestingModule
  error: Error

  // Repos
  operationRepo: Repository<OperationEntity>
  tokenRepo: Repository<TokenEntity>
  token: TokenEntity

  // Kafka
  kafkaProducer: KafkaProducer
  kafkaConsumer: KafkaConsumer
  consumerProviderCount = 0
  consumers: { [name: string]: TestKafkaConsumer } = {}

  // Authentication
  authTokenWithTenantId: string
  authTokenWithoutPermissions: string
  tenantId: string
  entityId: string

  // Chain
  chainName: string

  // Accounts
  address: string
  recipient: string

  constructor(name: string) {
    this.name = name
  }

  async addSubscriber(name: string, topic: string) {
    if (this.consumerProviderCount === CONSUMER_PROVIDERS.length) {
      throw new Error('Hit maximum number of available consumers')
    }

    const testConsumer = this.appModule.get(
      CONSUMER_PROVIDERS[this.consumerProviderCount++],
    )

    testConsumer.topic = topic

    await this.kafkaConsumer.addSubscriber(
      testConsumer,
      `integration_${uuidv4()}`,
    )

    this.consumers[name] = testConsumer
  }

  async createToken(type: TokenType): Promise<TokenEntity> {
    if (this.error) return

    return await this.handleError(async () => {
      const { response, operation } = await this.runRequest(
        deployTokenPost,
        {
          ...tokensERC721DeployRequestMock,
          type,
          decimals: type == TokenType.ERC20 ? 18 : undefined,
        },
        { requiresToken: false },
      )

      if (!operation || operation.status !== EntityStatus.Confirmed) {
        this.reportError('Failed to create token - Operation failed')
        return
      }

      this.token = await waitForTokenDeployTransaction(
        this.tokenRepo,
        response.data.token.transactionId,
      )

      if (!(this.token && this.token.id)) {
        this.reportError('Failed to create token - No token found')
        return
      }

      return this.token
    })
  }

  async mintToken({
    amount = '0x03E8',
    tokenId = erc721TokenIdMock,
  }: { amount?: string; tokenId?: string } = {}) {
    if (this.error) return

    await this.handleError(async () => {
      const builder = MintTokenCommandBuilder.get(
        this.token.type,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
      )

      if (this.token.type == TokenType.ERC20) {
        builder.amount(amount)
      } else if (this.token.type == TokenType.ERC721) {
        builder.tokenId(tokenId)
      }

      const { operation } = await this.runCommand(
        Commands.tokenMintCommand,
        builder.build(),
      )

      if (!operation || operation.status !== EntityStatus.Confirmed) {
        this.reportError('Failed to mint token')
      }
    })
  }

  async runCommand<T>(
    command: MicroserviceMessage<T>,
    payload: any,
    {
      waitForOperation = true,
      waitForAsyncResult = true,
    }: { waitForOperation?: boolean; waitForAsyncResult?: boolean } = {},
  ): Promise<{
    operation: OperationEntity
    asyncResult: IAsyncOperationResultEvent
    message: any
  }> {
    const messageName = command.getMessageName()
    await this.tryAddSubscriber(messageName, messageName)

    await this.tryAddSubscriber(
      CONSUMER_NAME_ASYNC,
      Events.asyncOperationResultEvent.getMessageName(),
    )

    const operationId = payload.operationId || uuidv4()
    const idempotencyKey = payload.idempotencyKey || uuidv4()

    const finalPayload = {
      ...payload,
      tenantId: this.tenantId,
      entityId: this.entityId,
      operationId,
      subject: subjectMock,
      tokenEntityId: this.token?.id || null,
      txConfig: this.createTransactionConfig(),
      idempotencyKey,
      account: this.address,
    }

    await this.kafkaProducer.send(command, finalPayload)

    const operation = waitForOperation
      ? await waitForOperationResponse(
          this.operationRepo,
          operationId,
          `${this.name} - Waiting for command - ${messageName}`,
        )
      : undefined

    const asyncResult = waitForAsyncResult
      ? await this.consumers[CONSUMER_NAME_ASYNC].getConsumedMessage(
          'test scenario command',
        )
      : undefined

    const message = await this.getConsumedMessage(messageName)

    return { operation, asyncResult, message }
  }

  async runRequest(
    requestHelper: Function,
    args: any,
    {
      hasPermissions = true,
      simulateExternalOperation = false,
      simulateExternalToken = false,
      requiresToken = true,
      hasTransaction = true,
      waitForAsyncResult = true,
    }: {
      hasPermissions?: boolean
      simulateExternalOperation?: boolean
      simulateExternalToken?: boolean
      requiresToken?: boolean
      hasTransaction?: boolean
      waitForAsyncResult?: boolean
    } = {},
  ): Promise<{
    response: AxiosResponse<TokenEntity & OperationEntity & NewTokenResponse>
    operation: OperationEntity
    asyncResult: IAsyncOperationResultEvent
  }> {
    await this.tryAddSubscriber(
      CONSUMER_NAME_ASYNC,
      Events.asyncOperationResultEvent.getMessageName(),
    )

    const requestArgs = [
      {
        ...args,
        config: this.createTransactionConfig(),
      },
    ]

    if (this.token && requiresToken) {
      requestArgs.push(this.token.id)
    }

    requestArgs.push(
      hasPermissions
        ? this.authTokenWithTenantId
        : this.authTokenWithoutPermissions,
    )

    if (!hasTransaction && simulateExternalToken) {
      await this.tokenRepo.delete({})
    }

    const response = await requestHelper(...requestArgs).catch((error) => {
      const newError = new Error(
        `${error.message} - ${error.response?.data?.message}`,
      )

      const newErrorAny = newError as any
      newErrorAny.response = error.response

      throw newError
    })

    if (hasTransaction && simulateExternalToken) {
      await this.tokenRepo.delete({})
    }

    if (simulateExternalOperation) {
      await this.operationRepo.delete({})
    }

    const waitMessage = `${this.name} - Waiting for request - ${requestHelper.name}`

    const operation = hasTransaction
      ? simulateExternalOperation
        ? await waitForNextTransactionResponse(this.operationRepo, waitMessage)
        : await waitForTransactionResponse(
            this.operationRepo,
            response.data?.operation?.transactionId ||
              response.data?.transactionId,
            waitMessage,
          )
      : null

    const asyncResult =
      simulateExternalOperation || simulateExternalToken || !waitForAsyncResult
        ? undefined
        : await this.consumers[CONSUMER_NAME_ASYNC].getConsumedMessage(
            'test scenario command',
          )

    return { response, operation, asyncResult }
  }

  async cleanRepos() {
    await this.handleError(async () => {
      await this.operationRepo.delete({})
      await this.tokenRepo.delete({})
      this.token = null
    })
  }

  async cleanMessages() {
    await this.handleError(async () => {
      Object.values(this.consumers).map(
        (consumer) => consumer.cleanConsumedMessage,
      )
    })
  }

  async init() {
    await this.handleError(async () => {
      this.appModule = await testModule()

      await this.initRepos()
      await this.initKafka()
      await this.initAuthentication()
      await this.initChain()
      await this.initAccounts()
    })
  }

  async destroy() {
    await this.appModule.close()
    await this.kafkaConsumer.disconnectAllConsumers()
  }

  async getConsumedMessage(name: string) {
    if (!this.consumers[name]) {
      throw new Error(`No consumer found for message: ${name}`)
    }

    return this.consumers[name].getConsumedMessage(
      `scenario message with subscriber: ${name}`,
    )
  }

  checkError() {
    if (this.error) {
      throw this.error
    }
  }

  async handleError(action: () => any): Promise<any> {
    try {
      return await action()
    } catch (error) {
      this.error = error
    }
  }

  private async tryAddSubscriber(name: string, topic: string) {
    if (this.consumers[name]) return
    await this.addSubscriber(name, topic)
  }

  private createTransactionConfig() {
    return TransactionConfigBuilder.get(this.address)
      .to(this.token?.contractAddress || null)
      .chainName(this.chainName)
      .build()
  }

  private async initRepos() {
    this.operationRepo = this.appModule.get<Repository<OperationEntity>>(
      getRepositoryToken(OperationEntity),
    )
    this.tokenRepo = this.appModule.get<Repository<TokenEntity>>(
      getRepositoryToken(TokenEntity),
    )

    await this.operationRepo.delete({})
    await this.tokenRepo.delete({})
  }

  private async initKafka() {
    this.kafkaProducer = this.appModule.get(KafkaProducer)

    await this.kafkaProducer.registerProducerEvents([
      Commands.tokenDeployCommand,
      Commands.tokenMintCommand,
      Commands.transferTokenCommand,
      Commands.setTokenURICommand,
      Commands.execTokenCommand,
      Commands.burnTokenCommand,
      Commands.registerTokenCommand,
      Events.asyncOperationResultEvent,
      Events.tokenDeployedEvent,
      Events.tokenTransferEvent,
    ])

    this.kafkaConsumer = this.appModule.get(KafkaConsumer)
  }

  private async initAuthentication() {
    this.authTokenWithTenantId = await getAuthTokenWithTenantId1(this.appModule)

    this.authTokenWithoutPermissions = await getAuthTokenWithoutPermissions(
      this.appModule,
    )

    const authTokenWithTenantIdDecoded = jwt.decode(this.authTokenWithTenantId)

    this.tenantId =
      authTokenWithTenantIdDecoded[DEV_CODEFI_API_AUDIENCE].tenantId
    this.entityId =
      authTokenWithTenantIdDecoded[DEV_CODEFI_API_AUDIENCE].entityId
  }

  private async initChain() {
    this.chainName = config().orchestrate.chainName
  }

  private async initAccounts() {
    const orchestrateAccount = this.appModule.get(OrchestrateAccountsService)

    // Create an account
    if (!process.env.ADDRESS_INTEGRATION_TESTS) {
      this.address = await generateAccount(
        orchestrateAccount,
        this.authTokenWithTenantId,
      )
    } else {
      this.address = process.env.ADDRESS_INTEGRATION_TESTS
    }

    // Generate recipient account
    this.recipient = await generateAccount(
      orchestrateAccount,
      this.authTokenWithTenantId,
    )
  }

  private reportError(message: string) {
    this.error = new Error(message)
  }
}
