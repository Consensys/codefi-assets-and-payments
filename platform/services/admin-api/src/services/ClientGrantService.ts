import { Injectable } from '@nestjs/common'
import { Auth0Service } from './Auth0Service'
import { ClientGrant } from 'auth0'
import { ClientGrantResponse } from '../responses/ClientGrantResponse'
import { Auth0Exception } from '../errors/Auth0Exception'
import { NestJSPinoLogger } from '@consensys/observability'
import { GetClientGrantResponse } from '../responses/GetClientGrantResponse'
import cfg from '../config'
import { getAllResultPaginated } from '../utils/paginationUtils'

@Injectable()
export class ClientGrantService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly auth0Service: Auth0Service,
  ) {}

  async clientGrant(
    clientId: string,
    audience: string,
    scope: string[],
  ): Promise<ClientGrantResponse> {
    try {
      const auth0Management = await this.auth0Service.getManagementClient()
      const data = {
        client_id: clientId,
        audience,
        scope,
      }
      this.logger.info('Granting client...')
      const clientGrant: ClientGrant = await auth0Management.createClientGrant(
        data,
      )
      this.logger.info('Granted client.')
      return {
        id: clientGrant.id,
        client_id: clientId,
        audience,
        scope,
      }
    } catch (error) {
      this.logger.error('Error granting client', error)
      throw new Auth0Exception(error)
    }
  }

  async getClientGrant(
    clientId?: string,
    audience?: string,
  ): Promise<GetClientGrantResponse> {
    try {
      const auth0Management = await this.auth0Service.getManagementClient()
      let grants = await getAllResultPaginated(
        async (skip: number, limit: number) => {
          return await auth0Management.getClientGrants({
            per_page: limit,
            page: skip,
          })
        },
        cfg().defaults.skip,
        cfg().defaults.limit,
      )
      if (clientId) {
        grants = grants.filter((grant) => grant.client_id === clientId)
      }
      if (audience) {
        grants = grants.filter((grant) => grant.audience === audience)
      }
      return {
        grants: grants.map((grant) => {
          return {
            clientId: grant.client_id,
            id: grant.id,
            audience: grant.audience,
            scope: grant.scope,
          }
        }),
      }
    } catch (error) {
      this.logger.error('Error getting Client Grant', error)
      throw new Auth0Exception(error)
    }
  }

  async deleteClientGrantById(clientGrantId: string) {
    try {
      const auth0Management = await this.auth0Service.getManagementClient()
      this.logger.info(`Deleting scopes id: ${clientGrantId}`)
      await auth0Management.deleteClientGrant({ id: clientGrantId })
      this.logger.info('Deleted scopes')
    } catch (error) {
      this.logger.error('Error deleting client grant', error)
      throw new Auth0Exception(error)
    }
  }
}
