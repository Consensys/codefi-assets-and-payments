import { Commands, ITenantCreateCommand } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { TenantService } from '../services/TenantService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class TenantCreateCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.tenantCreateCommand.getMessageName()
  groupId: string = getGroupId(TenantCreateCommandConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private tenantService: TenantService,
  ) {
    this.logger.setContext(TenantCreateCommandConsumer.name)
  }

  async onMessage(decodedMessage: ITenantCreateCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.tenantService.create(
        {
          id: decodedMessage.tenantId,
          name: decodedMessage.name,
          products: decodedMessage.products,
          defaultNetworkKey: decodedMessage.defaultNetworkKey,
          metadata: JSON.parse(decodedMessage.metadata),
          initialAdmins: decodedMessage.initialAdmins,
          initialEntities: decodedMessage.initialEntities?.map((entity) => ({
            id: entity.entityId,
            name: entity.name,
            metadata: JSON.parse(entity.metadata),
            initialAdmins: entity.initialAdmins,
            initialWallets: entity.initialWallets?.map((wallet) => ({
              address: wallet.address,
              type: wallet.type,
              metadata: JSON.parse(wallet.metadata),
            })),
            defaultWallet: entity.defaultWallet,
          })),
          stores: decodedMessage.stores,
        },
        decodedMessage.createdBy,
      )

      this.logger.info(
        `Message processed successfully: ${JSON.stringify(result)}`,
      )
    } catch (error) {
      this.logger.error(
        `Error processing message - Message: ${JSON.stringify(
          decodedMessage,
        )} - Error: ${JSON.stringify(error.message)}`,
      )
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${TenantCreateCommandConsumer.name}`)
  }
}
