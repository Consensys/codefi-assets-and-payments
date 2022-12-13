import { ApplicationContext } from './context'
import { KafkaPreview, KafkaProducer } from '@consensys/nestjs-messaging'
import { Commands, Events } from '@consensys/messaging-events'
import { Auth0ExceptionsFilter } from './filters/Auth0ExceptionsFilter'
import cfg from './config'
import { ConfigService } from './config/ConfigService'
import { UserCreateCommandConsumer } from './commands/UserCreateCommandConsumer'
import { ClientCreateCommandConsumer } from './commands/ClientCreateCommandConsumer'
import { createLogger } from '@consensys/observability'
import { INestApplication, Type } from '@nestjs/common'

const logger = createLogger('server')

async function startServer() {
  const app = await ApplicationContext()

  if (cfg().cors.enabled) {
    app.enableCors({
      origin: !cfg().cors.origin ? true : new RegExp(cfg().cors.origin),
    })
  }

  app.useGlobalFilters(new Auth0ExceptionsFilter())

  if (cfg().kafka.enabled) {
    const kafkaProducer: KafkaProducer = app.get(KafkaProducer)

    logger.info('Registering kafka producer events')
    kafkaProducer
      .registerProducerEvents([
        Commands.userCreateCommand,
        Events.userCreatedEvent,
        Events.userUpdatedEvent,
        Events.clientCreatedEvent,
      ])
      .catch((error) => {
        logger.error({ error }, 'Error registering producer events. Exiting...')
        process.exit(1)
      })
    logger.info('Events registered')

    logger.info(`Registering consumers...`)

    await initialiseConsumers(
      [UserCreateCommandConsumer, ClientCreateCommandConsumer],
      app,
    )

    logger.info('Consumers registered')
  } else {
    logger.info(
      `Kafka is disabled, this MS won't send events or process commands`,
    )
  }

  try {
    const configService: ConfigService = app.get(ConfigService)
    await configService.performConfiguration()
  } catch (error) {
    logger.fatal(
      { initialConfigError: error },
      'Error during initial configuration',
    )
    process.exit(1)
  }

  await app.listen(cfg().core.serverPort)
}

async function stopServer() {
  const app = await ApplicationContext()
  app.close()
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

export { startServer, stopServer }
