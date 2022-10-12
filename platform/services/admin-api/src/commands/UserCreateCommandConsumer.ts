import { Commands, IUserCreateCommand } from '@codefi-assets-and-payments/messaging-events'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { UserService } from '../services/UserService'
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types'
import { InviteUserByEmailRequest } from '../requests/InviteUserByEmailRequest'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class UserCreateCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.userCreateCommand.getMessageName()
  groupId: string = getGroupId('userCreate')

  constructor(private logger: NestJSPinoLogger, private userService: UserService) {
    this.logger.setContext(UserCreateCommandConsumer.name)
  }

  async onMessage(decodedMessage: IUserCreateCommand) {
    try {
      this.logger.info(
        `Message received - UserCreateCommand: ${JSON.stringify(
          decodedMessage,
        )}`,
      )

      const createUser: InviteUserByEmailRequest = {
        name: decodedMessage.name,
        email: decodedMessage.email,
        applicationClientId: decodedMessage.applicationClientId,
        password: decodedMessage.password ? decodedMessage.password : undefined,
        roles: decodedMessage.roles ? decodedMessage.roles : undefined,
        tenantId: decodedMessage.tenantId,
        entityId: decodedMessage.entityId,
        product: decodedMessage.product as ProductsEnum,
      }

      const result = await this.userService.createUser(createUser, {
        useInviteConnection: true,
      })

      this.logger.info(`Message processed successfully`, result)
    } catch (error) {
      this.logger.error(`UserCreateCommandConsumerError`, {
        decodedMessage,
      })
      this.logger.error(error)
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${UserCreateCommandConsumer.name}`)
  }
}
