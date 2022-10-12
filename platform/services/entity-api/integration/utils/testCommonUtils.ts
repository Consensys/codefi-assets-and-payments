import { UserTokenModule } from '@codefi-assets-and-payments/auth'
import { MicroserviceMessage } from '@codefi-assets-and-payments/messaging-events'
import {
  KafkaConsumer,
  KafkaConsumerModule,
  KafkaProducerModule,
} from '@codefi-assets-and-payments/nestjs-messaging'
import { EntityStatus } from '@codefi-assets-and-payments/ts-types'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '@codefi-assets-and-payments/observability'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { UserCreatedEventConsumer } from '../../src/consumers/UserCreatedEventConsumer'
import config from '../../src/config'
import { EntityEntity } from '../../src/data/entities/EntityEntity'
import { TenantEntity } from '../../src/data/entities/TenantEntity'
import { WalletEntity } from '../../src/data/entities/WalletEntity'
import { EntityModule } from '../../src/modules/EntityModule'
import { TenantModule } from '../../src/modules/TenantModule'
import { sleep } from '../../src/utils/sleep'
import { TestKafkaSubscriber } from './TestKafkaSubscriber'
import { TenantStoreEntity } from '../../src/data/entities/TenantStoreEntity'
import { EntityStoreEntity } from '../../src/data/entities/EntityStoreEntity'
import { ClientEntity } from '../../src/data/entities/ClientEntity'

export const testModule = async (kafkaSubscribers: string[] = []) => {
  return await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        ...config().db,
        entities: [
          TenantEntity,
          EntityEntity,
          WalletEntity,
          TenantStoreEntity,
          EntityStoreEntity,
          ClientEntity,
        ],
      }),
      LoggerModule.forRoot({
        pinoHttp: {
          level: config().logLevel,
        },
      }),
      TenantModule,
      EntityModule,
      UserTokenModule,
      KafkaConsumerModule,
      KafkaProducerModule,
    ],
    providers: [
      {
        provide: getRepositoryToken(TenantEntity),
        useClass: Repository,
      },
      {
        provide: getRepositoryToken(EntityEntity),
        useClass: Repository,
      },
      {
        provide: getRepositoryToken(WalletEntity),
        useClass: Repository,
      },
      {
        provide: getRepositoryToken(TenantStoreEntity),
        useClass: Repository,
      },
      {
        provide: getRepositoryToken(EntityStoreEntity),
        useClass: Repository,
      },
      ...kafkaSubscribers.map((subscriber) => ({
        provide: subscriber,
        useClass: TestKafkaSubscriber,
      })),
      UserCreatedEventConsumer,
    ],
  }).compile()
}

export const subscribeToMessage = async <T>(
  appModule: TestingModule,
  kafkaConsumer: KafkaConsumer,
  message: MicroserviceMessage<any>,
  subscriberName: string,
  forcedGroupId?: string,
) => {
  const kafkaSubscriber = appModule.get<TestKafkaSubscriber<T>>(subscriberName)
  kafkaSubscriber.topic = message.getMessageName()

  const groupId = forcedGroupId || `integration_${uuidv4()}`

  await kafkaConsumer.addSubscriber(kafkaSubscriber, groupId)

  return kafkaSubscriber
}

export const retryRepoFindAllCondition = async <T>(
  repo: Repository<any>,
  condition: Function,
  isDeleted?: boolean,
  params?: any[],
): Promise<T[]> => {
  const sleepTime = 1000
  const maxRetries = 100
  let result: T[] = await repo.find({
    withDeleted: isDeleted ? isDeleted : false,
    order: {
      createdAt: 'ASC',
    },
  })
  let i = 0
  if (!condition(result, params)) {
    while (i <= maxRetries && !condition(result, params)) {
      console.log(`Result is empty, retrying... ${i}/${maxRetries}`)
      result = await repo.find({
        withDeleted: isDeleted ? isDeleted : false,
        order: {
          createdAt: 'ASC',
        },
      })
      await sleep(sleepTime)
      i++
    }
  }

  if (!condition(result, params)) {
    throw new Error(
      `Find all condition was never reached with params: ${JSON.stringify(
        params,
      )}.\nResults are: ${JSON.stringify(result)}`,
    )
  } else {
    return result
  }
}

export const waitForEntity = async <T>(
  repo: Repository<any>,
  condition: (record: T) => boolean,
): Promise<T> => {
  return (
    await retryRepoFindAllCondition<T>(
      repo,
      (records) => !!records.find(condition),
      false,
      [],
    )
  ).find(condition)
}

// param[0] -> element ID
export const entryById = <T>(result: T[], params?: any[]) => {
  return result.find((r: any) => r.id === params[0])
}

// param[0] -> element ID
// param[1] -> admin email
// param[2] -> admin name
export const adminConfirmed = <T>(result: T[], params?: any[]) => {
  return result.find(
    (owner: any) =>
      owner.id === params[0] &&
      owner.initialAdmins.find(
        (admin: any) =>
          admin.email === params[1] &&
          admin.name === params[2] &&
          admin.status === EntityStatus.Confirmed,
      ),
  )
}
