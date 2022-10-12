import { ProcessingMessageException } from '@codefi-assets-and-payments/error-handler'
import {
  Events,
  IWalletOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { EthereumAddressEntity } from '../data/entities/EthereumAddressEntity'
import Web3 from 'web3'
import { EthereumAddressService } from '../services/EthereumAddressService'
import { LegalEntityService } from '../services/LegalEntityService'
import { getGroupId } from '../utils/kafka'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'
import { QueryFailedError } from 'typeorm'

@Injectable()
export class WalletOperationEventConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Events.walletOperationEvent.getMessageName()
  groupId: string = getGroupId(WalletOperationEventConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private readonly legalEntityService: LegalEntityService,
    private readonly ethereumAddressService: EthereumAddressService,
  ) {
    this.logger.setContext(WalletOperationEventConsumer.name)
  }

  async onMessage(decodedMessage: IWalletOperationEvent) {
    this.logger.info(
      `[!] topic ${this.topic} - event wallet operation ${decodedMessage.operation} received`,
    )
    this.logger.info(JSON.stringify(decodedMessage))
    this.logger.info(`Caching accounts...`)

    const entityExists = await this.legalEntityService.findOne({
      id: decodedMessage.entityId,
    })

    if (!entityExists) {
      if (decodedMessage.operation === MessageDataOperation.DELETE) {
        this.logger.warn(
          `Entity does not exist, deleting ethereum address even if the entity is not found`,
        )
      } else {
        this.logger.warn(
          `Legal entity Id=${decodedMessage.entityId} does not exist. Throwing error to reprocess the message...`,
        )

        throw new ProcessingMessageException(
          'LegalEntityDoesNotExist',
          `Legal entity does not exist, entityId=${decodedMessage.entityId}, address=${decodedMessage.address}`,
          {
            entityId: decodedMessage.entityId,
            address: decodedMessage.address,
          },
        )
      }
    }

    if (decodedMessage.operation === MessageDataOperation.CREATE) {
      this.logger.info(`Creating ethereum address`)
      try {
        const addressCreated: EthereumAddressEntity =
          await this.ethereumAddressService.create(
            decodedMessage.entityId,
            Web3.utils.toChecksumAddress(decodedMessage.address),
            decodedMessage.type,
            decodedMessage.metadata,
          )

        this.logger.info(`Ethereum address=${decodedMessage.address} created`)
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          error.driverError &&
          error.driverError.code === '23505' // duplicate key value violates unique constraint
        ) {
          this.logger.warn(
            `Duplicate Event: address=${decodedMessage.address} already exists for entityId=${decodedMessage.entityId} and type=${decodedMessage.type}. Skipping...`,
          )
          return
        }
        throw new ProcessingMessageException(
          'UnprocessableEntity',
          `Error saving address, entityId=${decodedMessage.entityId}, address=${decodedMessage.address} and type=${decodedMessage.type}`,
          {
            entityId: decodedMessage.entityId,
            address: decodedMessage.address,
            type: decodedMessage.type,
            error,
          },
        )
      }
    } else if (decodedMessage.operation === MessageDataOperation.UPDATE) {
      this.logger.info(`updating ethereum address`)

      const result = await this.ethereumAddressService.findAndUpdate(
        {
          address: Web3.utils.toChecksumAddress(decodedMessage.address),
          entityId: decodedMessage.entityId,
        },
        decodedMessage.metadata,
      )
      this.logger.info(`Ethereum addresses updated: ${result}`)
    } else if (decodedMessage.operation === MessageDataOperation.DELETE) {
      this.logger.info(`deleting ethereum address`)

      const result = await this.ethereumAddressService.delete({
        entityId: decodedMessage.entityId,
        address: Web3.utils.toChecksumAddress(decodedMessage.address),
      })
      this.logger.info(`Ethereum addresses deleted: ${result}`)
    } else {
      this.logger.info(`Operation ${decodedMessage.operation} unknown skip...`)
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${WalletOperationEventConsumer.name}`)
  }
}
