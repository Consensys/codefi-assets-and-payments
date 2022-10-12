import {
  Events,
  IEntityOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import Web3 from 'web3'
import { LegalEntityService } from '../services/LegalEntityService'
import { TenantService } from '../services/TenantService'
import { ProcessingMessageException } from '@codefi-assets-and-payments/error-handler'
import { getGroupId } from '../utils/kafka'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'

@Injectable()
export class EntityOperationEventConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Events.entityOperationEvent.getMessageName()
  groupId: string = getGroupId(EntityOperationEventConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private readonly legalEntityService: LegalEntityService,
    private readonly tenantService: TenantService,
  ) {
    this.logger.setContext(EntityOperationEventConsumer.name)
  }

  async onMessage(decodedMessage: IEntityOperationEvent) {
    this.logger.info(
      `[!] topic ${this.topic} - event entity operation ${decodedMessage.operation} received`,
    )
    this.logger.info(JSON.stringify(decodedMessage))
    this.logger.info(`Caching entity...`)

    if (decodedMessage.operation === MessageDataOperation.CREATE) {
      this.logger.info(`Processing entity operation create`)
      const entityExists = await this.legalEntityService.findOne({
        id: decodedMessage.entityId,
      })

      if (entityExists) {
        this.logger.warn(
          `Legal entity name=${entityExists.legalEntityName}, EntityId=${entityExists.id} already exists. Skipping...`,
        )
        return
      }
      this.logger.info(
        `Creating entity. Searching for tenant=${decodedMessage.tenantId}`,
      )
      const tenant = await this.tenantService.findOne({
        id: decodedMessage.tenantId,
      })
      if (!tenant) {
        this.logger.warn(
          `Tenant with id=${decodedMessage.tenantId} does not exist when creating entity=${decodedMessage.entityId}. Throwing error to reprocess the message later`,
        )
        throw new ProcessingMessageException(
          'TenantDoesNotExist',
          `Tenant with id=${decodedMessage.tenantId} does not exist`,
          {
            tenantId: decodedMessage.tenantId,
            entityId: decodedMessage.entityId,
          },
        )
      }

      this.logger.info(`Tenant found ${tenant.name}`)

      await this.legalEntityService.create(
        decodedMessage.entityId,
        decodedMessage.name,
        decodedMessage.defaultWallet
          ? Web3.utils.toChecksumAddress(decodedMessage.defaultWallet)
          : '',
        tenant.defaultNetworkKey,
        decodedMessage.tenantId,
        true,
        decodedMessage.createdBy,
        new Date(decodedMessage.createdAt),
        decodedMessage.metadata,
      )
    } else if (decodedMessage.operation === MessageDataOperation.UPDATE) {
      this.logger.info(`Processing entity operation update`)
      const entityExists = await this.legalEntityService.findOne({
        id: decodedMessage.entityId,
      })
      if (!entityExists) {
        this.logger.warn(
          `Legal entity name=${decodedMessage.name}, EntityId=${decodedMessage.entityId} does not exist... throw error to reprocess`,
        )
        throw new ProcessingMessageException(
          `EntityDoesNotExist`,
          `Entity with id=${decodedMessage.entityId} not found`,
          {
            entityId: decodedMessage.entityId,
          },
        )
      }

      await this.legalEntityService.update(
        { id: decodedMessage.entityId },
        {
          id: decodedMessage.entityId,
          legalEntityName: decodedMessage.name,
          ethereumAddress: Web3.utils.toChecksumAddress(
            decodedMessage.defaultWallet,
          ),
          // orchestrateChainName: config().sass.defaultChainName, // TODO: receive from the event the chain and only set default in case chain is not present
          tenantId: decodedMessage.tenantId,
          issuer: true,
          createdBy: decodedMessage.createdBy,
          createdAt: new Date(decodedMessage.createdAt),
          metadata: decodedMessage.metadata,
        },
      )
    } else if (decodedMessage.operation === MessageDataOperation.DELETE) {
      this.logger.info(`Processing entity operation delete`)
      const entityExists = await this.legalEntityService.findOne({
        id: decodedMessage.entityId,
      })

      if (!entityExists) {
        this.logger.info(
          `Legal entity name=${decodedMessage.name}, EntityId=${decodedMessage.entityId} does not exists. Reprocessing...`,
        )
        throw new ProcessingMessageException(
          `EntityDoesNotExist`,
          `Entity with id=${decodedMessage.entityId} not found`,
          {
            entityId: decodedMessage.entityId,
          },
        )
      }

      await this.legalEntityService.delete({ id: decodedMessage.entityId })
    } else {
      this.logger.info(`Operation ${decodedMessage.operation} unknown skip...`)
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${EntityOperationEventConsumer.name}`)
  }
}
