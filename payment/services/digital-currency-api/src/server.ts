import {
  apiMetrics,
  createLogger,
} from '@consensys/observability'
import { ApplicationContext } from './context'
import config from './config'
import { PersistentConfigurationService } from './services/PersistentConfigurationService'
import {
  KafkaProducer,
  KafkaPreview,
} from '@consensys/nestjs-messaging'
import { Commands, Events } from '@consensys/messaging-events'
import { AsyncOperationResultConsumer } from './consumers/AsyncOperationResultConsumer'
import { EntityOperationEventConsumer } from './consumers/EntityOperationEventConsumer'
import { WalletOperationEventConsumer } from './consumers/WalletOperationEventConsumer'
import { TenantOperationEventConsumer } from './consumers/TenantOperationEventConsumer'
import { INestApplication, Type } from '@nestjs/common'
import {
  ConfigurationException,
  KafkaException,
} from '@consensys/error-handler'

const logger = createLogger('server')

async function startServer() {
  const app = await ApplicationContext()

  app.use(apiMetrics())

  app.enableShutdownHooks()

  if (config().kafka.enabled) {
    logger.info(`Kafka is enabled`)
    const kafkaProducer: KafkaProducer = app.get(KafkaProducer)

    try {
      await kafkaProducer.registerProducerEvents([
        Commands.tokenDeployCommand,
        Commands.tokenMintCommand,
        Commands.transferTokenCommand,
        Commands.burnTokenCommand,
        Events.tokenTransferEvent,
        Events.tokenDeployedEvent,
        Events.entityOperationEvent,
        Events.walletOperationEvent,
        Events.tenantOperationEvent,
      ])
    } catch (e) {
      logger.error('Error when registering producers. Exiting...')
      logger.error(
        new KafkaException(
          'ErrorRegisteringProducers',
          `Error when registering producers.`,
          e,
        ),
      )

      process.exit(1)
    }
    logger.info('[!!] Events registered')

    const codefiConsumerService: KafkaPreview.CodefiConsumerService = app.get(
      KafkaPreview.CodefiConsumerService,
    )

    await initialiseConsumers(
      [
        AsyncOperationResultConsumer,
        EntityOperationEventConsumer,
        WalletOperationEventConsumer,
        TenantOperationEventConsumer,
      ],
      codefiConsumerService,
      app,
    )
  } else {
    logger.info(`Kafka is disabled, this MS won't send events`)
  }

  const persistentConfigurationService: PersistentConfigurationService =
    app.get(PersistentConfigurationService)

  persistentConfigurationService
    .performConfiguration()
    .then(() => {
      logger.info('Persistent configuration successful')
    })
    .catch((error) => {
      logger.error(`Error performing initial configuration`)
      logger.error(
        new ConfigurationException(
          'ErrorInitialConfiguration',
          `Error performing initial configuration.`,
          error,
        ),
      )
    })

  await app.listen(config().serverPort)
}

async function stopServer() {
  const app = await ApplicationContext()
  await app.close()
}

async function initialiseConsumers(
  listenerTypes: Type<KafkaPreview.IConsumerListener>[],
  service: KafkaPreview.CodefiConsumerService,
  app: INestApplication,
) {
  const listeners = listenerTypes.map((listenerType) => app.get(listenerType))
  await service.initialiseConsumers(listeners)
}

export { startServer, stopServer }
