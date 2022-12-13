import {
  ChainRegistry,
  ChainRegistryModule,
  ContractRegistryModule,
  OrchestrateAccountsModule,
  OrchestrateAccountsService,
} from '@consensys/nestjs-orchestrate'
import { OperationEntity } from '../../src/data/entities/OperationEntity'
import { TokenEntity } from '../../src/data/entities/TokenEntity'
import { Repository } from 'typeorm'
import { sleep } from '../../src/utils/sleep'
import { EntityStatus } from '@consensys/ts-types'
import { TestKafkaConsumer } from './TestKafkaConsumer'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { TokensManagerModule } from '../../src/modules/TokensManagerModule'
import {
  KafkaConsumer,
  KafkaConsumerModule,
  KafkaProducerModule,
} from '@consensys/nestjs-messaging'
import { PersistentConfigurationModule } from '../../src/modules/PersistentConfigurationModule'
import { LoggerModule } from '@consensys/observability'
import config from '../../src/config'
import { Test, TestingModule } from '@nestjs/testing'
import { M2mTokenModule, UserTokenModule, UserTokenService } from '@consensys/auth'
import { MicroserviceMessage } from '@consensys/messaging-events'
import { v4 as uuidv4 } from 'uuid'
import { createUserAuthToken } from './requests'
import { INTEGRATION_TEST_USER_PASSWORD } from './configs'

export const TEST_KAFKA_CONSUMER_PROVIDER_1 = 'TEST_KAFKA_CONSUMER_PROVIDER_1'
export const TEST_KAFKA_CONSUMER_PROVIDER_2 = 'TEST_KAFKA_CONSUMER_PROVIDER_2'
export const TEST_KAFKA_CONSUMER_PROVIDER_3 = 'TEST_KAFKA_CONSUMER_PROVIDER_3'
export const TEST_KAFKA_CONSUMER_PROVIDER_4 = 'TEST_KAFKA_CONSUMER_PROVIDER_4'
export const TEST_KAFKA_CONSUMER_PROVIDER_5 = 'TEST_KAFKA_CONSUMER_PROVIDER_5'

export const TEST_KAFKA_CONSUMER_PROVIDER_ERC721_1 =
  'TEST_KAFKA_CONSUMER_PROVIDER_ERC721_1'
export const TEST_KAFKA_CONSUMER_PROVIDER_ERC721_2 =
  'TEST_KAFKA_CONSUMER_PROVIDER_ERC721_2'
export const TEST_KAFKA_CONSUMER_PROVIDER_ERC721_3 =
  'TEST_KAFKA_CONSUMER_PROVIDER_ERC721_3'
export const TEST_KAFKA_CONSUMER_PROVIDER_ERC721_4 =
  'TEST_KAFKA_CONSUMER_PROVIDER_ERC721_4'
export const TEST_KAFKA_CONSUMER_PROVIDER_ERC721_5 =
  'TEST_KAFKA_CONSUMER_PROVIDER_ERC721_5'

export const testModule = async (
  kafkaSubscribers: string[] = [
    TEST_KAFKA_CONSUMER_PROVIDER_1,
    TEST_KAFKA_CONSUMER_PROVIDER_2,
    TEST_KAFKA_CONSUMER_PROVIDER_3,
    TEST_KAFKA_CONSUMER_PROVIDER_4,
    TEST_KAFKA_CONSUMER_PROVIDER_5,
    TEST_KAFKA_CONSUMER_PROVIDER_ERC721_1,
    TEST_KAFKA_CONSUMER_PROVIDER_ERC721_2,
    TEST_KAFKA_CONSUMER_PROVIDER_ERC721_3,
    TEST_KAFKA_CONSUMER_PROVIDER_ERC721_4,
    TEST_KAFKA_CONSUMER_PROVIDER_ERC721_5,
  ],
) => {
  return await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        ...config().db,
        entities: [OperationEntity, TokenEntity],
      }),
      LoggerModule.forRoot({
        pinoHttp: {
          level: config().logLevel,
        },
      }),
      TokensManagerModule,
      ChainRegistryModule,
      ContractRegistryModule,
      OrchestrateAccountsModule,
      KafkaConsumerModule,
      KafkaProducerModule,
      PersistentConfigurationModule,
      UserTokenModule,
      M2mTokenModule,
    ],
    providers: [
      {
        provide: getRepositoryToken(OperationEntity),
        useClass: Repository,
      },
      {
        provide: getRepositoryToken(TokenEntity),
        useClass: Repository,
      },
      ...kafkaSubscribers.map((subscriber) => {
        return {
          provide: subscriber,
          useClass: TestKafkaConsumer,
        }
      }),
    ],
  }).compile()
}

export const registerChain = async (
  authToken: string,
  module?: TestingModule,
): Promise<string> => {
  const testModule =
    module ||
    (await Test.createTestingModule({
      imports: [ChainRegistryModule],
    }).compile())

  const chainRegistry: ChainRegistry = testModule.get(ChainRegistry)
  const chains = await chainRegistry.getAllChains(authToken)
  const chainName = config().orchestrate.chainName
  const chainUrl = config().orchestrate.blockchainUrl

  const foundChain = chains.find(
    (chain) => chain.name === chainName && chain.urls.includes(chainUrl),
  )

  if (!foundChain) {
    console.log(`Registering new chain`)

    const registeredChain = await chainRegistry.registerChain(
      chainName,
      [chainUrl],
      { backOffDuration: '500ms' }, // listeners
      undefined, // privateTxManager
      authToken,
    )

    console.log('Registered new chain', { chainName, chainUrl })

    return registeredChain.name
  } else {
    console.log('Chain with the same url is already registered', {
      chainName: foundChain.name,
      chainUrls: foundChain.urls,
    })

    return foundChain.name
  }
}

export const deleteChain = async (
  authToken: string,
  module?: TestingModule,
) => {
  const testModule =
    module ||
    (await Test.createTestingModule({
      imports: [ChainRegistryModule],
    }).compile())

  const chainRegistry: ChainRegistry = testModule.get(ChainRegistry)
  const chains = await chainRegistry.getAllChains(authToken)
  const chainName = config().orchestrate.chainName
  const foundChain = chains.find((chain) => chain.name === chainName)

  if (!foundChain) {
    console.log('Cannot delete chain as not found', { chainName })
    return
  }

  await chainRegistry.deleteChain(foundChain.uuid, authToken)
  console.log('Chain deleted', { chainName })
}

export const generateAccount = async (
  orchestrateAccount: OrchestrateAccountsService,
  authToken?: string,
): Promise<string> => {
  try {
    return orchestrateAccount.generateAccount(authToken)
  } catch (error) {
    throw new Error(`Could not generate account`)
  }
}

export const waitForTransactionResponse = async (
  operationRepo: Repository<OperationEntity>,
  transactionId: string,
  message?: string,
): Promise<OperationEntity> => {
  return (
    await retryRepoFindAllCondition<OperationEntity>(
      operationRepo,
      conditionTransactionNotPending,
      false,
      [transactionId],
      message,
    )
  ).find((result) => result.transactionId === transactionId)
}

export const waitForTokenDeployTransaction = async (
  tokenRepo: Repository<TokenEntity>,
  transactionId: string,
  message?: string,
): Promise<TokenEntity> => {
  return (
    await retryRepoFindAllCondition<TokenEntity>(
      tokenRepo,
      conditionTransactionNotPending,
      false,
      [transactionId],
      message,
    )
  ).find((result) => result.transactionId === transactionId)
}

export const waitForNextTransactionResponse = async (
  operationRepo: Repository<OperationEntity>,
  message?: string,
): Promise<OperationEntity> => {
  return (
    await retryRepoFindAllCondition<OperationEntity>(
      operationRepo,
      conditionAnyNotPending,
      false,
      [],
      message,
    )
  ).find((result) => true)
}

export const waitForOperationResponse = async (
  operationRepo: Repository<OperationEntity>,
  operationId: string,
  message?: string,
): Promise<OperationEntity> => {
  return (
    await retryRepoFindAllCondition<OperationEntity>(
      operationRepo,
      conditionOperationNotPending,
      false,
      [operationId],
      message,
    )
  ).find((result) => result.id === operationId)
}

export const retryRepoFindAllCondition = async <T>(
  repo: Repository<any>,
  condition: Function,
  isDeleted?: boolean,
  params?: any[],
  message?: string,
): Promise<T[]> => {
  const sleepTime = 250
  const maxRetries = 4 * 30 // 30 Seconds
  let result: T[] = await repo.find({
    withDeleted: isDeleted ? isDeleted : false,
    order: {
      createdAt: 'ASC',
    },
  })
  let i = 0

  const logLine = message || 'Result is empty, retrying'
  console.log(`${logLine}`)

  if (!condition(result, params)) {
    while (i <= maxRetries && !condition(result, params)) {
      result = await repo.find({
        withDeleted: isDeleted ? isDeleted : false,
        order: {
          createdAt: 'ASC',
        },
      })
      await sleep(sleepTime)

      if (!process.env.PIPELINE) {
        process.stdout.write('#')
      }

      i++
    }
  }

  if (!condition(result, params)) {
    console.log('')
    throw new Error(
      `Find all condition was never reached with params: ${JSON.stringify(
        params,
      )}.\nResults are: ${JSON.stringify(result)}`,
    )
  } else {
    const duration = i * sleepTime
    console.log(`\nCompleted in ${duration}ms`)
    return result
  }
}

export const conditionWithBlockAndTxInfo = (
  result: OperationEntity[],
  params?: any[],
) =>
  result[0] &&
  result[0].blockNumber !== null &&
  result[0].transactionHash !== null

export const conditionWithBlockAndTxInfoForId = (
  result: OperationEntity[],
  params?: any[],
) => {
  const resultWithId = result.find((item) => item.id === params[0])
  return (
    resultWithId &&
    resultWithId.blockNumber !== null &&
    resultWithId.transactionHash !== null
  )
}

export const conditionWithStatusConfirmedAndContractAddress = (
  result: TokenEntity[],
  params?: any[],
) =>
  result[0] &&
  result[0].status !== EntityStatus.Pending &&
  result[0].contractAddress !== null

export const conditionWithTokenDeployed = (
  result: TokenEntity[],
  params?: any[],
) =>
  result[0] &&
  result[0].status !== EntityStatus.Pending &&
  result[0].contractAddress !== null &&
  result[0].transactionId === params[0]

// param[0] -> property Name
// param[1] -> property target
// param[2] -> Nth element
export const conditionNth = <T>(result: T[], params?: any[]) =>
  result[parseInt(params[2])] &&
  (result[parseInt(params[2])] as any)[params[0]] === params[1]

// param[0] -> property Name
// param[1] -> property target
// param[2] -> element ID
export const conditionById = <T>(result: T[], params?: any[]) => {
  const selectedResult = result.find((r) => (r as any).id === params[2])
  return selectedResult && selectedResult[params[0]] == params[1]
}

export const conditionOperationConfirmedWithTxId = (
  result: OperationEntity[],
  params?: any[],
) =>
  result[params[0]] &&
  result[params[0]].status === EntityStatus.Confirmed &&
  result[params[0]].transactionId === params[1]

export const conditionTransactionNotPending = (
  result: OperationEntity[],
  params?: any[],
) =>
  result.some(
    (operation) =>
      operation.status !== EntityStatus.Pending &&
      operation.transactionId === params[0],
  )

export const conditionOperationNotPending = (
  result: OperationEntity[],
  params?: any[],
) =>
  result.some(
    (operation) =>
      operation.status !== EntityStatus.Pending && operation.id === params[0],
  )

export const conditionAnyNotPending = (result: OperationEntity[]) =>
  result.some((operation) => operation.status !== EntityStatus.Pending)

export const subscribeToMessage = async (
  appModule: TestingModule,
  kafkaConsumer: KafkaConsumer,
  message: MicroserviceMessage<any>,
  subscriberName: string,
) => {
  const kafkaSubscriber = appModule.get<TestKafkaConsumer>(subscriberName)
  kafkaSubscriber.topic = message.getMessageName()

  const groupId = `integration_${uuidv4()}`

  await kafkaConsumer.addSubscriber(kafkaSubscriber, groupId)

  return kafkaSubscriber
}

export const generateAddress = async (
  appModule: TestingModule,
  authToken: string,
): Promise<string> => {
  if (process.env.ADDRESS_INTEGRATION_TESTS) {
    return process.env.ADDRESS_INTEGRATION_TESTS
  }

  const orchestrateAccountsService = appModule.get(OrchestrateAccountsService)
  return await generateAccount(orchestrateAccountsService, authToken)
}

export const getAuthTokenWithTenantId1 = async (module?: TestingModule) => {
  return await getAuthToken(
    'userwithtenantId1@example.com',
    INTEGRATION_TEST_USER_PASSWORD,
    module,
  )
}

export const getAuthTokenWithoutPermissions = async (
  module?: TestingModule,
) => {
  return await getAuthToken(
    'userwithoutpermissions@example.com',
    INTEGRATION_TEST_USER_PASSWORD,
    module,
  )
}

export const getAuthToken = async (
  username: string,
  password: string,
  module?: TestingModule,
) => {
  const testModule =
    module ||
    (await Test.createTestingModule({
      imports: [UserTokenModule],
    }).compile())

  const userTokenService: UserTokenService = testModule.get(UserTokenService)
  return await createUserAuthToken(userTokenService, username, password)
}
