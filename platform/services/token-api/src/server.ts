import { apiMetrics, createLogger } from '@consensys/observability'
import { ApplicationContext } from './context'
import { OrchestrateConsumer } from '@consensys/nestjs-orchestrate'
import { BlockchainReceiptConsumerListener } from './consumers/BlockchainReceiptConsumerListener'
import config from './config'
import { KafkaProducer, KafkaPreview } from '@consensys/nestjs-messaging'
import { Events } from '@consensys/messaging-events'
import { DeployTokenCommandConsumer } from './commands/DeployTokenCommandConsumer'
import { MintTokenCommandConsumer } from './commands/MintTokenCommandConsumer'
import { PersistentConfigurationService } from './services/PersistentConfigurationService'
import { TransferTokenCommandConsumer } from './commands/TransferTokenCommandConsumer'
import { BurnTokenCommandConsumer } from './commands/BurnTokenCommandConsumer'
import { ExecTokenCommandConsumer } from './commands/ExecTokenCommandConsumer'
import { SetTokenURICommandConsumer } from './commands/SetTokenURICommandConsumer'
import { RecoveryService } from './services/RecoveryService'
import { Type } from '@nestjs/common'

const logger = createLogger('server')

export async function startRecoveryMode() {
  logger.info('Starting recovery mode')

  const app = await ApplicationContext()

  const kafkaProducer: KafkaProducer = app.get(KafkaProducer)
  await registerProducers(kafkaProducer)

  const recoveryService = app.get(RecoveryService)
  await recoveryService.regenerateDatabase()

  logger.info('Recovery complete')
}

export async function startServer() {
  const app = await ApplicationContext()

  app.use(apiMetrics())

  app.enableShutdownHooks()

  logger.info(
    { nodeEnv: process.env.NODE_ENV, nodeName: process.env.NODE_NAME },
    'Starting server',
  )

  const orchestrateConsumer = app.get(OrchestrateConsumer)
  const blockchainReceiptConsumerListener = app.get(
    BlockchainReceiptConsumerListener,
  )
  orchestrateConsumer
    .startConsumer(blockchainReceiptConsumerListener, config().commitSha)
    .then(() => {
      logger.info(
        { providedGroupId: config().commitSha },
        'Orchestrate consumer registered',
      )
    })
    .catch((error) => {
      logger.error(error, 'Error connecting to orchestrate consumer')
    })

  if (config().kafka.enabled) {
    logger.info('Kafka is enabled')

    logger.info('Registering events')
    const kafkaProducer: KafkaProducer = app.get(KafkaProducer)
    await registerProducers(kafkaProducer)

    logger.info('Registering consumers')
    const codefiConsumerService: KafkaPreview.CodefiConsumerService = app.get(
      KafkaPreview.CodefiConsumerService,
    )
    const listeners = [
      DeployTokenCommandConsumer,
      MintTokenCommandConsumer,
      TransferTokenCommandConsumer,
      BurnTokenCommandConsumer,
      ExecTokenCommandConsumer,
      SetTokenURICommandConsumer,
    ].map((listenerType: Type<any>) => app.get(listenerType))
    await codefiConsumerService.initialiseConsumers(listeners)

    logger.info('Events and consumers registered')
  } else {
    logger.info('Kafka is disabled')
  }

  const persistentConfigurationService = app.get(PersistentConfigurationService)

  logger.info('Starting persistent configuration')
  await persistentConfigurationService.performConfiguration()
  logger.info('Ending persistent configuration')

  await app.listen(config().serverPort)
}

export async function stopServer() {
  const app = await ApplicationContext()
  await app.close()
}

async function registerProducers(kafkaProducer: KafkaProducer) {
  try {
    await kafkaProducer.registerProducerEvents([
      Events.asyncOperationResultEvent,
      Events.tokenDeployedEvent,
      Events.tokenTransferEvent,
    ])
  } catch (error) {
    logger.fatal(error, 'Error when registering producers')
    process.exit(1)
  }
  logger.info('Events registered')
}
