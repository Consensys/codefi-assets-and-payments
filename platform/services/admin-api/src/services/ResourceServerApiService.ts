import { Injectable } from '@nestjs/common'
import { CreateResourceServer, ResourceServer } from 'auth0'
import { CreateApiResponse } from '../responses/ResourceServerApiResponse'
import { Auth0Service } from './Auth0Service'
import { Auth0Exception } from '../errors/Auth0Exception'
import { NestJSPinoLogger } from '@consensys/observability'
import { Scope } from '../requests/ResourceServerApiRequest'
import { EntityNotFoundException } from '@consensys/error-handler'
import { ConfigConstants } from '../config/ConfigConstants'
import { ErrorName } from '../enums/ErrorName'

@Injectable()
export class ResourceServerApiService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly auth0Service: Auth0Service,
  ) {}

  async createApi(
    name: string,
    identifier: string,
    scopes: Array<{ description: string; value: string }>,
    tokenLifetime: number,
    rbac: boolean,
  ): Promise<CreateApiResponse> {
    try {
      const auth0Management = await this.auth0Service.getManagementClient()
      const data: CreateResourceServer = {
        name,
        identifier,
        scopes,
        token_lifetime: tokenLifetime,
        skip_consent_for_verifiable_first_party_clients: true,
      }
      if (rbac) {
        ;(data.enforce_policies = true),
          (data.token_dialect = 'access_token_authz')
      }
      this.logger.info('Creating resource server (api)...')
      const resourceServer: ResourceServer =
        await auth0Management.createResourceServer(data)
      this.logger.info('Created resource server : ' + resourceServer.name)
      return {
        id: resourceServer.id,
        name: resourceServer.name,
        identifier: resourceServer.identifier,
        scopes: resourceServer.scopes,
        token_lifetime: resourceServer.token_lifetime,
        token_dialect: resourceServer.token_dialect,
        skip_consent_for_verifiable_first_party_clients:
          resourceServer.skip_consent_for_verifiable_first_party_clients,
        enforce_policies: resourceServer.enforce_policies,
      }
    } catch (error) {
      this.logger.error('Error creating resource server', error)
      throw new Auth0Exception(error)
    }
  }

  async getResourceServerScopes(resourceServerId?: string): Promise<Scope[]> {
    const auth0Management = await this.auth0Service.getManagementClient()
    // if no id is specified, returns default APIs (codefi & admin apis)
    if (!resourceServerId) {
      const servers = await auth0Management.getResourceServers()
      const codefiApi = servers.find(
        (server) =>
          server.identifier ===
          ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
      )
      const adminApi = servers.find(
        (server) =>
          server.identifier ===
          ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
      )
      const codefiApiScopes: Scope[] = codefiApi ? codefiApi.scopes : []
      const adminApiScopes: Scope[] = adminApi ? adminApi.scopes : []
      return codefiApiScopes.concat(adminApiScopes)
    }
    const resourceServer = await auth0Management.getResourceServer({
      id: resourceServerId,
    })
    if (!resourceServer) {
      throw new EntityNotFoundException(
        ErrorName.EntityNotFoundException,
        `Resource server not found`,
        { resourceServerId },
      )
    }
    return resourceServer.scopes
  }
}
