import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { KafkaProducer } from '@consensys/nestjs-messaging'
import {
  Commands,
  IClientCreateCommand,
  IUserCreateCommand,
} from '@consensys/messaging-events'
import { AdminRequest, ClientType, ProductsEnum } from '@consensys/ts-types'

@Injectable()
export class AdminApiService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kafkaProducer: KafkaProducer,
  ) {
    logger.setContext(AdminApiService.name)
  }

  async createAdmins(
    admins: AdminRequest[],
    roles: string[],
    tenantId: string,
    entityId: string,
  ): Promise<void> {
    this.logger.info(
      `Sending create admin commands ${JSON.stringify({
        tenantId,
        entityId,
        admins,
      })}`,
    )

    if (!admins || !admins.length) {
      return
    }

    for (const admin of admins) {
      const adminToCreate: IUserCreateCommand = {
        ...admin,
        appMetadata: JSON.stringify({}),
        applicationClientId: null,
        connection: null,
        password: null,
        emailVerified: false,
        roles,
        tenantId,
        entityId,
      }
      await this.kafkaProducer.send(Commands.userCreateCommand, adminToCreate)

      this.logger.info(`Sent create admin command ${JSON.stringify(admin)}`)
    }
  }

  async createClient(
    name: string,
    type: ClientType,
    grantTypes: string[],
    tenantId?: string,
    entityId?: string,
  ) {
    const command: IClientCreateCommand = {
      name,
      description: name,
      appType: type,
      isEmailOnly: false,
      clientMetadata: null,
      logoUri: null,
      callbacks: [],
      allowedLogoutUrls: [],
      webOrigins: [],
      allowedOrigins: [],
      grantTypes: grantTypes || [],
      jwtConfiguration: null,
      sso: null,
      initiateLoginUri: null,
      product: ProductsEnum.assets,
      tenantId: tenantId || null,
      entityId: entityId || null,
    } as IClientCreateCommand

    await this.kafkaProducer.send(Commands.clientCreateCommand, command)

    this.logger.info(`Sent create client command: ${JSON.stringify(command)}`)
  }
}
