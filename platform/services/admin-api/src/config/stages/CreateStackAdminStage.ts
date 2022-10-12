import { ConfigStageRequest, IConfigStage } from '../types/ConfigStage'
import cfg from '../../config'
import { Role, RolesData, User } from 'auth0'
import { ConfigConstants } from '../ConfigConstants'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CreateStackAdminStage implements IConfigStage {
  async run(request: ConfigStageRequest) {
    const { managementClient } = request

    const userEmail = cfg().initialConfig.stackAdminUserEmail
    const userPassword = cfg().initialConfig.stackAdminUserPassword
    const tenantId = cfg().initialConfig.stackAdminTenantId
    const entityId = cfg().initialConfig.stackAdminEntityId

    const logger = request.logger.logger.child({
      userEmail,
      tenantId,
      entityId,
      roleName: ConfigConstants.STACK_ADMIN_ROLE,
    })

    if (!userEmail || !userPassword) {
      logger.info(
        'Skipping stack admin creation as email or password not specified',
      )
      return
    }

    const existingUsers: User[] = await managementClient.getUsersByEmail(
      userEmail,
    )

    if (existingUsers?.length) {
      logger.info('Deleting existing users with matching emails')

      await Promise.all(
        existingUsers.map((user: User) => {
          return managementClient.deleteUser({ id: user.user_id })
        }),
      )
    }

    const stackAdminUser = await managementClient.createUser({
      name: ConfigConstants.STACK_ADMIN_NAME,
      email: userEmail,
      password: userPassword,
      connection: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
      app_metadata: {
        registered: true,
        tenantId,
        entityId,
        [tenantId]: {
          entityId,
          roles: [ConfigConstants.STACK_ADMIN_ROLE],
        },
      },
    })

    const roles: Role[] = await managementClient.getRoles()

    const existingAdminRole: Role = roles.find(
      (role) => role.name === ConfigConstants.STACK_ADMIN_ROLE,
    )

    if (!existingAdminRole) {
      logger.warn('Stack admin role does not exist')
      logger.warn('Created stack admin without role')
      return
    }

    const stackAdminRoles: RolesData = { roles: [existingAdminRole.id] }

    await managementClient.assignRolestoUser(
      { id: stackAdminUser.user_id },
      stackAdminRoles,
    )

    logger.info(
      { userId: stackAdminUser.user_id },
      'Created stack admin and assigned role',
    )
  }
}
