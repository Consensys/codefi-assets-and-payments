import { ConfigStageRequest, IConfigStage } from '../types/ConfigStage'
import { ManagementClientExtended } from '../../types/Auth0ManagementClientExtended'
import { ConfigConstants } from '../ConfigConstants'
import { NestJSPinoLogger } from '@consensys/observability'
import { Client, ClientGrant } from 'auth0'
import { ClientResponse } from '../../responses/ClientResponse'
import { ClientService } from '../../services/ClientService'
import { Injectable } from '@nestjs/common'
import {
  getClientGrants,
  getAllClients,
} from '../../utils/managementClientUtils'
import { superTenantId } from '@consensys/auth'
import { superEntityId } from '@consensys/auth/dist/utils/authUtils'

@Injectable()
export class CreateM2MClientsStage implements IConfigStage {
  private managementClient: ManagementClientExtended
  private logger: NestJSPinoLogger
  private clientService: ClientService

  async run(request: ConfigStageRequest) {
    const { managementClient, logger, clientService } = request

    this.managementClient = managementClient
    this.logger = logger
    this.clientService = clientService

    const existingClients = await getAllClients(managementClient, logger)

    // Create or update M2M applications

    const { response: codefiClient, clientGrants: codefiClientGrants } =
      await this.createOrUpdateM2MClient(
        ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_CODEFI,
        existingClients,
      )

    const { response: adminClient, clientGrants: adminClientGrants } =
      await this.createOrUpdateM2MClient(
        ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_ADMIN,
        existingClients,
      )

    // Ensure correct APIs and permissions are assigned to the applications

    await this.createOrUpdateGrant(
      codefiClient.clientId,
      ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
      ConfigConstants.API_SCOPES[
        ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER
      ],
      codefiClientGrants,
    )

    await this.createOrUpdateGrant(
      adminClient.clientId,
      ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
      ConfigConstants.API_SCOPES[
        ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER
      ],
      adminClientGrants,
    )

    request.clientCredentials = {
      clientId: codefiClient.clientId,
      clientSecret: codefiClient.clientSecret,
    }
  }

  private async createOrUpdateM2MClient(
    name: string,
    existingClients: Client[],
  ) {
    const existingM2MClient = existingClients.find(
      (client) => client.name === name,
    )

    let clientResponse: ClientResponse
    let m2mClientGrants: ClientGrant[]

    if (!existingM2MClient) {
      this.logger.info('Creating M2M client')

      clientResponse = await this.clientService.createClient({
        name,
        description: '',
        appType: 'non_interactive',
        tenantId: superTenantId,
        entityId: superEntityId,
      })

      this.logger.info('Created M2M client')

      m2mClientGrants = []
    } else {
      this.logger.info('Updating M2M client')

      clientResponse = await this.clientService.updateClient(
        {
          name,
          description: '',
          appType: 'non_interactive',
          tenantId: superTenantId,
          entityId: superEntityId,
        },
        existingM2MClient.client_id,
      )

      this.logger.info('Updated M2M client')

      m2mClientGrants = await getClientGrants(
        existingM2MClient.client_id,
        this.managementClient,
        this.logger,
      )
    }

    return { response: clientResponse, clientGrants: m2mClientGrants }
  }

  private async createOrUpdateGrant(
    clientId: string,
    audience: string,
    permissions: string[],
    clientGrants: ClientGrant[],
  ) {
    const logger = this.logger.logger.child({ clientId, audience })

    const existingClientGrant = clientGrants.find(
      (clientGrant) => clientGrant.audience === audience,
    )

    if (existingClientGrant) {
      logger.info('Updating client grant')

      await this.managementClient.updateClientGrant(
        { id: existingClientGrant.id },
        { scope: permissions },
      )
    } else {
      logger.info('Creating client grant')

      await this.managementClient.createClientGrant({
        audience,
        client_id: clientId,
        scope: permissions,
      })
    }
  }
}
