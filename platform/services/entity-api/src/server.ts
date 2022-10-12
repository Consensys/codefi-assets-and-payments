import { Commands, Events } from '@codefi-assets-and-payments/messaging-events'
import { KafkaPreview, KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import { apiMetrics } from '@codefi-assets-and-payments/observability'
import { INestApplication, Type } from '@nestjs/common'
import config from './config'
import { ClientCreatedEventConsumer } from './consumers/ClientCreatedEventConsumer'
import { EntityCreateCommandConsumer } from './consumers/EntityCreateCommandConsumer'
import { EntityDeleteCommandConsumer } from './consumers/EntityDeleteCommandConsumer'
import { EntityUpdateCommandConsumer } from './consumers/EntityUpdateCommandConsumer'
import { TenantCreateCommandConsumer } from './consumers/TenantCreateCommandConsumer'
import { TenantDeleteCommandConsumer } from './consumers/TenantDeleteCommandConsumer'
import { TenantOperationEventConsumer } from './consumers/TenantOperationEventConsumer'
import { TenantUpdateCommandConsumer } from './consumers/TenantUpdateCommandConsumer'
import { UserCreatedEventConsumer } from './consumers/UserCreatedEventConsumer'
import { WalletCreateCommandConsumer } from './consumers/WalletCreateCommandConsumer'
import { WalletDeleteCommandConsumer } from './consumers/WalletDeleteCommandConsumer'
import { WalletUpdateCommandConsumer } from './consumers/WalletUpdateCommandConsumer'
import { ApplicationContext } from './context'
import { PersistentConfigurationService } from './services/PersistentConfigurationService'
import { Admin, Kafka } from 'kafkajs'
import { RecoveryModule } from './modules/RecoveryModule'
import { EntityOperationEventConsumer } from './consumers/EntityOperationEventConsumer'
import { WalletOperationEventConsumer } from './consumers/WalletOperationEventConsumer'
import { getGroupId } from './utils/kafka'

export async function startRecoveryMode() {
  if (!config().kafka.enabled) {
    console.log('Kafa must be enabled to start recovery mode')
    return
  }

  const app = await ApplicationContext(RecoveryModule)

  const kafka = new Kafka({
    brokers: [config().kafka.broker],
  })

  const kafkaAdmin = kafka.admin()
  await kafkaAdmin.connect()

  console.log('Updated topic offsets')

  await updateTopicOffset(
    kafkaAdmin,
    Events.tenantOperationEvent.getMessageName(),
    TenantOperationEventConsumer,
  )

  await updateTopicOffset(
    kafkaAdmin,
    Events.entityOperationEvent.getMessageName(),
    EntityOperationEventConsumer,
  )

  await updateTopicOffset(
    kafkaAdmin,
    Events.walletOperationEvent.getMessageName(),
    WalletOperationEventConsumer,
  )

  await kafkaAdmin.disconnect()

  console.log(`Registering recovery consumers`)

  await initialiseConsumers(
    [
      TenantOperationEventConsumer,
      EntityOperationEventConsumer,
      WalletOperationEventConsumer,
    ],
    app,
  )

  console.log('Recovery consumers registered')
  console.log('Waiting for recovery events')

  await app.listen(config().serverPort)
}

export async function startServer() {
  const app = await ApplicationContext()

  app.use(apiMetrics())
  app.enableShutdownHooks()

  if (config().cors.enabled) {
    app.enableCors({
      origin: !config().cors.origin ? true : new RegExp(config().cors.origin),
    })
  }

  if (config().kafka.enabled) {
    console.log(`Kafka is enabled`)
    const kafkaProducer: KafkaProducer = app.get(KafkaProducer)

    try {
      await kafkaProducer.registerProducerEvents([
        Commands.userCreateCommand,
        Events.tenantOperationEvent,
        Events.entityOperationEvent,
        Events.walletOperationEvent,
        Commands.entityDeleteCommand,
        Commands.walletDeleteCommand,
        Commands.clientCreateCommand,
      ])
    } catch (e) {
      console.log('Error when registering producers. Exiting...')
      console.error(e)
      process.exit(1)
    }
    console.log('[!!] Events registered')

    console.log(`[+] Registering consumers...`)

    await initialiseConsumers(
      [
        UserCreatedEventConsumer,
        ClientCreatedEventConsumer,
        TenantCreateCommandConsumer,
        TenantUpdateCommandConsumer,
        TenantDeleteCommandConsumer,
        EntityCreateCommandConsumer,
        EntityUpdateCommandConsumer,
        EntityDeleteCommandConsumer,
        WalletCreateCommandConsumer,
        WalletUpdateCommandConsumer,
        WalletDeleteCommandConsumer,
      ],
      app,
    )

    console.log('[!!] Consumers registered')
  } else {
    console.log(`Kafka is disabled, this MS won't send events`)
  }

  const persistentConfigurationService = app.get(PersistentConfigurationService)

  console.log('Starting persistent configuration')
  await persistentConfigurationService.performConfiguration()
  console.log('Ending persistent configuration')

  await app.listen(config().serverPort)
}

export async function stopServer() {
  const app = await ApplicationContext()
  await app.close()
}

async function updateTopicOffset(
  kafkaAdminClient: Admin,
  topic: string,
  consumer: Type<KafkaPreview.IConsumerListener>,
) {
  const partitions = await kafkaAdminClient.fetchTopicOffsetsByTimestamp(
    topic,
    config().recoveryMode.timestamp,
  )

  const groupId = getGroupId(consumer.name)

  await kafkaAdminClient.setOffsets({
    groupId,
    topic,
    partitions,
  })

  console.log(`Updated topic offsets - ${topic}`)
}

async function initialiseConsumers(
  listenerTypes: Type<KafkaPreview.IConsumerListener>[],
  app: INestApplication,
) {
  const codefiConsumerService: KafkaPreview.CodefiConsumerService = app.get(
    KafkaPreview.CodefiConsumerService,
  )

  const listeners = listenerTypes.map((listenerType) => app.get(listenerType))

  await codefiConsumerService.initialiseConsumers(listeners)
}
