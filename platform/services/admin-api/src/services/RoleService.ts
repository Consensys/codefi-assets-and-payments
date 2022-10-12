import { Injectable } from '@nestjs/common'
import { CreateRoleRequest } from '../requests/CreateRoleRequest'
import { RoleResponse } from '../responses/RoleResponse'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Auth0Service } from './Auth0Service'
import { Auth0Exception } from '../errors/Auth0Exception'
import { RolePermissionRequest } from '../requests/RolePermissionRequest'
import { RolePermissionResponse } from '../responses/RolePermissionResponse'

@Injectable()
export class RoleService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly auth0Service: Auth0Service,
  ) {
    logger.setContext(RoleService.name)
  }

  async getRoleById(roleId: string): Promise<RoleResponse> {
    try {
      const managementClient = await this.auth0Service.getManagementClient()
      const response = await managementClient.getRole({ id: roleId })
      return {
        id: response.id,
        description: response.description,
        name: response.name,
      }
    } catch (error) {
      this.logger.error('Error getting role', error)
      throw new Auth0Exception(error)
    }
  }

  async createRole(role: CreateRoleRequest): Promise<RoleResponse> {
    try {
      const managementClient = await this.auth0Service.getManagementClient()
      const response = await managementClient.createRole(role)
      return {
        id: response.id,
        description: response.description,
        name: response.name,
      }
    } catch (error) {
      this.logger.error('Error creating role', error)
      throw new Auth0Exception(error)
    }
  }

  async assignPermissionsToRole(
    roleId: string,
    permissions: RolePermissionRequest[],
  ) {
    try {
      const managementClient = await this.auth0Service.getManagementClient()
      await managementClient.addPermissionsInRole(
        {
          id: roleId,
        },
        {
          permissions: permissions.map((permission) => {
            return {
              resource_server_identifier: permission.resourceServerIdentifier,
              permission_name: permission.permissionName,
            }
          }),
        },
      )
    } catch (error) {
      this.logger.error('Error assigning permissions to role', error)
      throw new Auth0Exception(error)
    }
  }

  async removePermissionsToRole(
    roleId: string,
    permissions: RolePermissionRequest[],
  ) {
    try {
      const managementClient = await this.auth0Service.getManagementClient()
      await managementClient.removePermissionsFromRole(
        {
          id: roleId,
        },
        {
          permissions: permissions.map((permission) => {
            return {
              resource_server_identifier: permission.resourceServerIdentifier,
              permission_name: permission.permissionName,
            }
          }),
        },
      )
    } catch (error) {
      this.logger.error('Error removing permissions to Role', error)
      throw new Auth0Exception(error)
    }
  }

  async getPermissionsAssignedToRole(
    roleId: string,
  ): Promise<RolePermissionResponse[]> {
    try {
      const managementClient = await this.auth0Service.getManagementClient()
      const response = await managementClient.getPermissionsInRole({
        id: roleId,
      })
      return response.map((permission) => {
        return {
          description: permission.description,
          resourceServerIdentifier: permission.resource_server_identifier,
          resourceServerName: permission.resource_server_name,
          permissionName: permission.permission_name,
        }
      })
    } catch (error) {
      this.logger.error('Error getting permissions assigned to role', error)
      throw new Auth0Exception(error)
    }
  }
}
