import { ConfigStageRequest, IConfigStage } from '../types/ConfigStage'
import { ManagementClientExtended } from '../../types/Auth0ManagementClientExtended'
import { ConfigConstants } from '../ConfigConstants'
import codefiScopes from '../permissions/codefi.json'
import orchestrateScopes from '../permissions/orchestrate.json'
import assetsScopes from '../permissions/assets.json'
import paymentsScopes from '../permissions/payments.json'
import codefiRoles from '../roles/codefi.json'
import assetsRoles from '../roles/assets.json'
import paymentsRoles from '../roles/payments.json'
import cfg from '../../config'
import { joinNestedLists } from '../../utils/utils'
import { ResourceServer } from 'auth0'
import { NestJSPinoLogger } from '@consensys/observability'
import { ConfiguredPermission, ConfiguredRole } from '../types/ConfiguredRole'
import { getAllApis } from '../../utils/managementClientUtils'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CreateApisStage implements IConfigStage {
  private managementClient: ManagementClientExtended
  private logger: NestJSPinoLogger

  async run(request: ConfigStageRequest) {
    const { managementClient, logger } = request

    this.managementClient = managementClient
    this.logger = logger

    const adminRoles: ConfiguredRole[] = joinNestedLists(
      [cfg().initialConfig.initialAdminRoles],
      (role) => role.name,
    )

    const allCodefiRoles: ConfiguredRole[] = joinNestedLists(
      [
        codefiRoles,
        assetsRoles,
        paymentsRoles,
        cfg().initialConfig.initialRoles,
      ],
      (role) => role.name,
    )

    const adminPermissions: ConfiguredPermission[] = joinNestedLists(
      [
        ConfigConstants.ADMIN_API_SCOPES,
        ...adminRoles.map((role) => role.permissions),
      ],
      (permission) => permission.value,
    )

    const codefiPermissions: ConfiguredPermission[] = joinNestedLists(
      [
        codefiScopes,
        orchestrateScopes,
        assetsScopes,
        paymentsScopes,
        cfg().initialConfig.codefiApiScopes,
        ...allCodefiRoles.map((role) => role.permissions),
      ],
      (permission) => permission.value,
    )

    const existingApis = await getAllApis(managementClient)

    await this.createApi(
      ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
      ConfigConstants.ADMIN_API_RESOURCE_SERVER_NAME,
      adminPermissions,
      existingApis,
    )

    await this.createApi(
      ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
      ConfigConstants.CODEFI_API_RESOURCE_SERVER_NAME,
      codefiPermissions,
      existingApis,
    )
  }

  private async createApi(
    identifier: string,
    name: string,
    permissions: ConfiguredPermission[],
    existingApis: ResourceServer[],
  ) {
    const existingApi = existingApis.find(
      (api) => api.identifier === identifier,
    )

    const logger = this.logger.logger.child({
      newApiName: name,
      permissionCount: permissions.length,
    })

    if (!existingApi) {
      logger.info('Creating new API')

      await this.managementClient.createResourceServer({
        identifier,
        name,
        signing_alg: 'RS256',
        scopes: permissions,
        enforce_policies: true,
        token_dialect: 'access_token_authz',
      })

      logger.info('Created new API')
    } else {
      logger.info('API already exists')

      if (permissions.length > 0) {
        logger.info('Updating API permissions')

        await this.managementClient.updateResourceServer(
          {
            id: existingApi.id,
          },
          {
            scopes: permissions,
          },
        )

        logger.info('Updated API permissions')
      }
    }
  }
}
