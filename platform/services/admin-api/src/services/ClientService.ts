import { Injectable } from '@nestjs/common'
import { Auth0Service } from './Auth0Service'
import { Client, Connection, ManagementClient } from 'auth0'
import { ClientResponse } from '../responses/ClientResponse'
import { Auth0Exception } from '../errors/Auth0Exception'
import { NestJSPinoLogger } from '@consensys/observability'
import { ConfigConstants } from '../config/ConfigConstants'
import {
  EntityNotFoundException,
  ConfigurationException,
} from '@consensys/error-handler'
import { EventsService } from './EventsService'
import { ErrorName } from '../enums/ErrorName'
import { CreateClientRequest } from '../requests/CreateClientRequest'
import { UpdateClientRequest } from '../requests/UpdateClientRequest'
import cfg from '../config'
import { getAllResultPaginated } from '../utils/paginationUtils'
import { getAllConnections } from '../utils/managementClientUtils'
import { ManagementClientExtended } from '../types/Auth0ManagementClientExtended'

@Injectable()
export class ClientService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly auth0Service: Auth0Service,
    private readonly eventsService: EventsService,
  ) {}

  async createClient(
    client: CreateClientRequest,
    isEmailOnly?: boolean,
  ): Promise<ClientResponse> {
    if (client.appType === 'non_interactive' && isEmailOnly) {
      throw new EntityNotFoundException(
        ErrorName.EntityNotFoundException,
        'a client cannot be non_interactive and e-mail only at the same time',
        { name: client.name, appType: client.appType, isEmailOnly },
      )
    }

    try {
      const auth0Management = await this.auth0Service.getManagementClient()
      const clientConfig = await this.clientRequestToClient(client)
      this.logger.info(
        `Creating client application... isEmailOnly? ${isEmailOnly}`,
      )
      if (isEmailOnly) {
        await auth0Management.updateTenantSettings({
          flags: {
            enable_client_connections: false,
          },
        })
      }
      const newClient: Client = await auth0Management.createClient(clientConfig)

      if (isEmailOnly) {
        await this.addEmailConnectionToClient(
          auth0Management,
          newClient.client_id,
        )
        await auth0Management.updateTenantSettings({
          flags: {
            enable_client_connections: true,
          },
        })
      }

      this.logger.info('Client application created: ' + newClient.name)

      try {
        this.logger.info(`Sending ClientCreated event`)
        await this.eventsService.emitClientCreatedEvent({
          clientId: newClient.client_id,
          clientSecret: newClient.client_secret,
          name: newClient.name,
          appType: newClient.app_type,
          tenantId: newClient?.client_metadata?.tenantId,
          entityId: newClient?.client_metadata?.entityId,
          product:
            newClient?.client_metadata &&
            newClient.client_metadata[client.product]
              ? client.product
              : undefined,
        })
      } catch (error) {
        this.logger.error(
          'Error pushing client created event into kafka: %o',
          error,
        )
        this.logger.info(
          `Rolling back client creation, deleting client: ${newClient.client_id}`,
        )
        await auth0Management.deleteClient({
          client_id: newClient.client_id,
        })
        throw error
      }

      return this.clientToClientResponse(newClient)
    } catch (error) {
      this.logger.error('Error creating client', error)
      throw new Auth0Exception(error)
    }
  }

  async getClient(clientId: string): Promise<ClientResponse> {
    const auth0Management = await this.auth0Service.getManagementClient()
    const client = await auth0Management.getClient({ client_id: clientId })

    return this.clientToClientResponse(client)
  }

  async getAllClients(
    limit?: number,
    skip?: number,
    connectionName?: string,
  ): Promise<ClientResponse[]> {
    const auth0Management = await this.auth0Service.getManagementClient()
    const finalSkip = skip || 0
    let clients = []

    if (connectionName) {
      const allConnections = await getAllConnections(
        auth0Management as ManagementClientExtended,
      )

      const connection = allConnections.find(
        (connection) => connection.name === connectionName,
      )

      const clientIds = connection?.enabled_clients || []

      const paginationClientIds = clientIds.slice(
        finalSkip,
        limit ? finalSkip + limit : undefined,
      )

      clients = await Promise.all(
        paginationClientIds.map((clientId) =>
          auth0Management.getClient({ client_id: clientId }),
        ),
      )
    } else {
      clients = await auth0Management.getClients({
        page: skip,
        per_page: limit,
      })
    }

    return clients.map((client) => this.clientToClientResponse(client))
  }

  async deleteClientById(clientId: string) {
    const auth0Management = await this.auth0Service.getManagementClient()
    try {
      await auth0Management.deleteClient({
        client_id: clientId,
      })
    } catch (error) {
      this.logger.error('Error deleting client', error)
      throw new Auth0Exception(error)
    }
  }

  async updateClient(client: UpdateClientRequest, clientId: string) {
    const auth0Management = await this.auth0Service.getManagementClient()
    const clientConfigUpdate = await this.clientRequestToClient(client)
    try {
      const result = await auth0Management.updateClient(
        {
          client_id: clientId,
        },
        clientConfigUpdate,
      )
      return await this.clientToClientResponse(result)
    } catch (error) {
      this.logger.error('Error updating client', error)
      throw new Auth0Exception(error)
    }
  }

  private async addEmailConnectionToClient(
    client: ManagementClient,
    clientId: string,
  ) {
    this.logger.info(`Add DB email only connection to client`)
    const existingConnections: Connection[] = await getAllResultPaginated(
      /* istanbul ignore next */
      async (skip: number, limit: number) => {
        return await client.getConnections({ per_page: limit, page: skip })
      },
      cfg().defaults.skip,
      cfg().defaults.limit,
    )
    const existingDbConnection = existingConnections.find(
      (connection) =>
        connection.name === ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
    )
    if (!existingDbConnection) {
      throw new ConfigurationException(
        ErrorName.ConfigurationException,
        'e-mail only DB connection not found. Wrong server configuration',
        { existingDbConnection },
      )
    }
    await client.updateConnection(
      {
        id: existingDbConnection.id,
      },
      {
        enabled_clients: [...existingDbConnection.enabled_clients, clientId],
      },
    )
  }

  private clientToClientResponse(client: Client): ClientResponse {
    return {
      clientId: client.client_id,
      clientSecret: client.client_secret,
      name: client.name,
      description: client.description,
      appType: client.app_type,
      clientMetadata: client.client_metadata,
      logoUri: client.logo_uri,
      callbacks: client.callbacks,
      allowedLogoutUrls: client.allowed_logout_urls,
      webOrigins: client.web_origins,
      allowedOrigins: client.allowed_origins,
      tokenEndpointAuthMethod: client.token_endpoint_auth_method,
      grantTypes: client.grant_types,
      jwtConfiguration: client.jwt_configuration,
      sso: client.sso,
      initiateLoginUri: client.initiate_login_uri,
    }
  }

  private async clientRequestToClient(clientResponse: CreateClientRequest) {
    const appType = clientResponse.appType || 'non_interactive'
    /*
     Optionally, you can set a value for token_endpoint_auth_method, which can be none or client_secret_post (default value).
     Use token_endpoint_auth_method: none in the request payload if creating a SPA.
    */
    const tokenEndpointAuthMethod =
      clientResponse.appType === 'spa' ? 'none' : 'client_secret_post'

    const clientMetadata = clientResponse.clientMetadata || {}
    if (clientResponse.tenantId) {
      // TODO: call Entity-Api to check if tenant exists

      clientMetadata['tenantId'] = clientResponse.tenantId
    }

    if (clientResponse.entityId) {
      // TODO: call Entity-Api to check if entity exists

      clientMetadata['entityId'] = clientResponse.entityId
    }

    if (clientResponse.product) {
      clientMetadata[clientResponse.product] = 'true' // Client metadata can only store strings, so this can't be boolean
    }
    return {
      name: clientResponse.name,
      description: clientResponse.description,
      app_type: appType,
      oidc_conformant: true,
      token_endpoint_auth_method: tokenEndpointAuthMethod,
      client_metadata: clientMetadata,
      logo_uri: clientResponse.logoUri || undefined,
      callbacks: clientResponse.callbacks,
      allowed_logout_urls: clientResponse.allowedLogoutUrls,
      web_origins: clientResponse.webOrigins,
      allowed_origins: clientResponse.allowedOrigins,
      grant_types: clientResponse.grantTypes,
      jwt_configuration: clientResponse.jwtConfiguration || undefined,
      sso: clientResponse.sso || undefined,
      initiate_login_uri: clientResponse.initiateLoginUri || undefined,
    }
  }
}
