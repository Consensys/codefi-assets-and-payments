import { ConfigStageRequest, IConfigStage } from '../types/ConfigStage'
import { ConfigConstants } from '../ConfigConstants'
import cfg from '../../config'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import codefiRoles from '../roles/codefi.json'
import assetsRoles from '../roles/assets.json'
import paymentsRoles from '../roles/payments.json'
import { ManagementClientExtended } from '../../types/Auth0ManagementClientExtended'
import { PermissionData, Role } from 'auth0'
import { joinNestedLists } from '../../utils/utils'
import { ConfiguredRole } from '../types/ConfiguredRole'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CreateRolesStage implements IConfigStage {
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

    const existingRoles = await managementClient.getRoles()

    this.logger.info(
      { existingRolesCount: existingRoles.length },
      'Retrieved existing roles',
    )

    await this.createOrUpdateRoles(
      adminRoles,
      ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
      existingRoles,
    )

    await this.createOrUpdateRoles(
      allCodefiRoles,
      ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
      existingRoles,
    )
  }

  private async createOrUpdateRoles(
    roles: ConfiguredRole[],
    api: string,
    existingRoles: Role[],
  ) {
    this.logger.info({ api }, 'Processing roles')

    for (const role of roles) {
      const existingRole = existingRoles.find(
        (existingRole) => existingRole.name === role.name,
      )

      if (!existingRole) {
        await this.createRole(role, api)
      } else {
        await this.updateRole(role, api, existingRole)
      }
    }
  }

  private async createRole(role: ConfiguredRole, api: string) {
    const logger = this.logger.logger.child({
      roleName: role.name,
    })

    logger.info({ roleName: role.name }, 'Creating role')

    const createdRole = await this.managementClient.createRole({
      name: role.name,
      description: role.description,
    })

    logger.info('Created role')

    const rolePermissionsData: PermissionData[] = role.permissions.map(
      (permission) => ({
        resource_server_identifier: api,
        permission_name: permission.value,
      }),
    )

    await this.managementClient.addPermissionsInRole(
      {
        id: createdRole.id,
      },
      {
        permissions: rolePermissionsData,
      },
    )

    logger.info(
      { permissionCount: role.permissions.length },
      'Added permissions to new role',
    )
  }

  private async updateRole(
    role: ConfiguredRole,
    api: string,
    existingRole: Role,
  ) {
    const logger = this.logger.logger.child({ roleName: role.name })

    logger.info('Updating role permissions')

    const existingRolePermissions =
      await this.managementClient.getPermissionsInRole({
        id: existingRole.id,
      })

    const missingPermissions = role.permissions.filter(
      (permission) =>
        !existingRolePermissions.find(
          (findPermission) =>
            findPermission.permission_name === permission.value,
        ),
    )

    if (missingPermissions.length) {
      const missingPermissionNames = missingPermissions.map(
        (permission) => permission.value,
      )

      logger.info(
        { missingPermissions: missingPermissionNames },
        'Adding permissions to existing role',
      )

      const missingPermissionsData = missingPermissions.map((permission) => ({
        resource_server_identifier: api,
        permission_name: permission.value,
      }))

      await this.managementClient.addPermissionsInRole(
        { id: existingRole.id },
        { permissions: missingPermissionsData },
      )
    }

    const permissionsToRemove = existingRolePermissions.filter(
      (permission) =>
        !role.permissions.find(
          (findPermission) =>
            findPermission.value === permission.permission_name,
        ),
    )

    if (permissionsToRemove.length > 0) {
      const permissionsToRemoveNames = permissionsToRemove.map(
        (permission) => permission.permission_name,
      )

      logger.info(
        { permissionsToRemove: permissionsToRemoveNames },
        'Removing permissions from existing role',
      )

      const permissionsToRemoveData = permissionsToRemove.map((permission) => ({
        resource_server_identifier: api,
        permission_name: permission.permission_name,
      }))

      await this.managementClient.removePermissionsFromRole(
        { id: existingRole.id },
        { permissions: permissionsToRemoveData },
      )
    }
  }
}
