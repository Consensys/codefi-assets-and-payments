import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { Auth0Service } from './Auth0Service'
import { ConfigConstants } from '../config/ConfigConstants'
import {
  escapeLuceneKey,
  escapeLuceneValue,
  randomPassword,
} from '../utils/stringUtils'
import { EventsService } from './EventsService'
import { UserCreatedResponse } from '../responses/UserCreatedResponse'
import {
  ConfigurationException,
  EntityNotFoundException,
  KafkaException,
} from '@consensys/error-handler'
import { Auth0Exception } from '../errors/Auth0Exception'
import cfg from '../config'
import { ErrorName } from '../enums/ErrorName'
import { CreateUserRequest } from '../requests/CreateUserRequest'
import camelcaseKeys from 'camelcase-keys'
import { getAllResultPaginated } from '../utils/paginationUtils'
import { UpdateUserRequest } from '../requests/UpdateUserRequest'
import { UserUpdatedResponse } from '../responses/UserUpdatedResponse'
import { Client } from 'auth0'
import { PaginatedUserResponse } from '../responses/PaginatedUserResponse'

@Injectable()
export class UserService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly auth0Service: Auth0Service,
    private readonly eventsService: EventsService,
  ) {
    logger.setContext(UserService.name)
  }

  async getUserById(userId: string): Promise<UserCreatedResponse> {
    try {
      const managementClient = await this.auth0Service.getManagementClient()
      const retrievedUser = await managementClient.getUser({
        id: userId,
      })
      const response = camelcaseKeys(retrievedUser)
      return response
    } catch (error) {
      this.logger.error('Error getting user by id', error)
      throw new Auth0Exception(error)
    }
  }

  async getUsersByEmail(email: string): Promise<UserCreatedResponse[]> {
    try {
      const managementClient = await this.auth0Service.getManagementClient()
      const retrievedUsers = await managementClient.getUsersByEmail(email)
      const response = retrievedUsers.map((user) => camelcaseKeys(user))
      return response
    } catch (error) {
      this.logger.error('Error getting user by email', error)
      throw new Auth0Exception(error)
    }
  }

  async getUsersByEntity(
    tenantId: string,
    entityId: string,
    limit: number,
    skip: number,
  ): Promise<PaginatedUserResponse> {
    try {
      const managementClient = await this.auth0Service.getManagementClient()

      const query = `app_metadata.${escapeLuceneKey(
        tenantId,
      )}.entityId:"${escapeLuceneValue(entityId)}"`

      this.logger.info({ query }, 'Querying Auth0 users by entity')

      const retrievedUsers = await managementClient.getUsers({
        q: query,
        page: skip,
        per_page: limit,
        include_totals: true,
      })

      return {
        items: retrievedUsers.users.map((user) => camelcaseKeys(user)),
        count: retrievedUsers.total,
        skip: retrievedUsers.start,
        limit: retrievedUsers.limit,
      }
    } catch (error) {
      this.logger.error({ error }, 'Error getting users by entity')
      throw new Auth0Exception(error)
    }
  }

  async deleteUserById(userId: string) {
    try {
      const managementClient = await this.auth0Service.getManagementClient()
      await managementClient.deleteUser({
        id: userId,
      })
    } catch (error) {
      this.logger.error('Error deleting user', error)
      throw new Auth0Exception(error)
    }
  }

  async createUser(
    user: CreateUserRequest,
    { useInviteConnection = false } = {},
  ): Promise<UserCreatedResponse> {
    this.logger.info(
      `Creating a user with email=${user.email} (tenantId=${user.tenantId} entityId=${user.entityId})`,
    )

    const managementClient = await this.auth0Service.getManagementClient()

    const connections = await getAllResultPaginated(
      /* istanbul ignore next */
      async (skip: number, limit: number) => {
        return await managementClient.getConnections({
          per_page: limit,
          page: skip,
        })
      },
      cfg().defaults.skip,
      cfg().defaults.limit,
    )

    const connectionName = useInviteConnection
      ? ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME
      : ConfigConstants.CREATE_USERS_CONNECTION_NAME

    const connection = connections.find(
      (connection) => connection.name === connectionName,
    )

    if (!connection) {
      const error = new ConfigurationException(
        ErrorName.ConfigurationException,
        'Connection was not found',
        { connection },
      )
      this.logger.error(error, `Connection was not found.`)
      throw error
    }

    const applicationName = useInviteConnection
      ? ConfigConstants.EMAIL_INVITE_ONLY_APPLICATION_NAME
      : ConfigConstants.CREATE_USERS_APPLICATION_NAME

    const clientApplication = await this.findEmailOnlyClient(
      applicationName,
      user.applicationClientId,
    )

    if (!clientApplication) {
      const error = new ConfigurationException(
        ErrorName.ConfigurationException,
        'Client was not found',
        { clientApplication },
      )
      this.logger.error(error, `Client was not found.`)
      throw error
    }

    let roleIds = []

    if (user.roles) {
      const roles = await managementClient.getRoles()
      roleIds = user.roles.map((userRole) => {
        const existingRole = roles.find((role) => {
          return role.name === userRole
        })
        if (!existingRole) {
          const error = new EntityNotFoundException(
            ErrorName.EntityNotFoundException,
            `Role not found, make sure it exists before assigning it to an user`,
            { userRole },
          )
          this.logger.error(error, `Role %o not found`, userRole)
          throw error
        }
        return existingRole.id
      })
    }

    const temporaryPassword = user.password ? user.password : randomPassword()

    const applicationClient = await this.auth0Service.getManagementClient({
      clientId: clientApplication.client_id,
      clientSecret: clientApplication.client_secret,
    })

    this.logger.info(`Creating user in auth0...`)

    const appMetadata = this.buildAppMetadata({
      product: user.product,
      tenantId: user.tenantId,
      entityId: user.entityId,
      tenantRoles: user.tenantRoles,
      rawData: user.appMetadata,
      registered: true,
    })

    let createdUser
    try {
      createdUser = await applicationClient.createUser({
        email: user.email,
        connection: connection.name,
        name: user.name,
        family_name: user.familyName,
        given_name: user.givenName,
        picture: user.picture,
        phone_number: user.phoneNumber,
        nickname: user.nickname,
        password: temporaryPassword,
        email_verified: user.emailVerified,
        app_metadata: appMetadata,
        phone_verified: user.phoneVerified,
        username: user.username,
        verify_email: user.verifyEmail,
        user_metadata: user.userMetadata,
        blocked: user.blocked,
      })
    } catch (error) {
      /* istanbul ignore next */
      if (error && error.message.includes('connection is disabled')) {
        const err = new ConfigurationException(
          ErrorName.ConfigurationException,
          'Connection is disabled, not able to create a user.',
          { message: error.message },
        )
        this.logger.error(
          err,
          `Not able to create user: database connection is disabled`,
        )
        throw err
      } else {
        this.logger.error(`Not able to create user: %o`, error)
        throw new Auth0Exception(error)
      }
    }

    this.logger.info(`User created`)
    if (user.roles) {
      this.logger.info(`Assigning initial roles: %o`, user.roles)
      await managementClient.assignRolestoUser(
        {
          id: createdUser.user_id,
        },
        {
          roles: roleIds,
        },
      )
    }

    try {
      this.logger.info(`Sending UserCreated event`)
      await this.eventsService.emitUserCreatedEvent({
        email: createdUser.email,
        name: createdUser.name,
        userId: createdUser.user_id,
        picture: createdUser.picture,
        emailVerified: createdUser.email_verified,
        appMetadata: JSON.stringify(createdUser.app_metadata || {}),
        userMetadata: JSON.stringify(createdUser.user_metadata || {}),
        tenantId: user.tenantId,
        entityId: user.entityId,
        product: user.product,
      })
    } catch (error) {
      const err = new KafkaException(
        ErrorName.ConfigurationException,
        'Error pushing user created event into kafka',
        {
          message: error.message,
        },
      )
      this.logger.error(
        err,
        'Error pushing user created event into kafka: %o',
        error,
      )
      this.logger.info(
        `Rolling back user creation, deleting user: %o`,
        createdUser.user_id,
      )
      await applicationClient.deleteUser({
        id: createdUser.user_id,
      })
      throw err
    }

    if (useInviteConnection) {
      const authenticationClient = this.auth0Service.getAuthenticationClient({
        clientId: clientApplication.client_id,
        clientSecret: clientApplication.client_secret,
      })

      this.logger.info(
        `User created: %o . Sending password reset e-mail`,
        createdUser.user_id,
      )

      const changePasswordResponse =
        await authenticationClient.requestChangePasswordEmail({
          email: createdUser.email,
          connection: connection.name,
        })

      this.logger.info(
        `Change password request e-mail sent: ${JSON.stringify(
          changePasswordResponse,
        )}`,
      )
    }

    const response: UserCreatedResponse = camelcaseKeys(createdUser)
    return response
  }

  async updateUser(
    user: UpdateUserRequest,
    userId: string,
  ): Promise<UserCreatedResponse> {
    this.logger.info(
      `Updating user with id=${userId} (tenantId=${user.tenantId} entityId=${user.entityId})`,
    )

    const managementClient = await this.auth0Service.getManagementClient()

    const retrievedUser = await managementClient.getUser({
      id: userId,
    })

    const requestClientApplication = await this.findEmailOnlyClient(
      ConfigConstants.CREATE_USERS_APPLICATION_NAME,
      user.applicationClientId,
    )

    if (!requestClientApplication) {
      const error = new ConfigurationException(
        ErrorName.ConfigurationException,
        'Client was not found',
        { requestClientApplication },
      )
      this.logger.error(error, `Client was not found.`)
      throw error
    }

    const applicationClient = await this.auth0Service.getManagementClient({
      clientId: requestClientApplication.client_id,
      clientSecret: requestClientApplication.client_secret,
    })

    this.logger.info(`Updating user in auth0...`)

    const appMetadata = this.buildAppMetadata({
      product: user.product,
      tenantId: user.tenantId,
      entityId: user.entityId,
      tenantRoles: user.tenantRoles,
      rawData: { ...retrievedUser.app_metadata, ...user.appMetadata },
    })

    let updatedUser
    try {
      updatedUser = await applicationClient.updateUser(
        {
          id: userId,
        },
        {
          app_metadata: appMetadata, // Currently, the function only allows to update user's metadata (for security reasons), but other fields can be added ad hoc if required
        },
      )
    } catch (error) {
      /* istanbul ignore next */
      if (error && error.message.includes('connection is disabled')) {
        const err = new ConfigurationException(
          ErrorName.ConfigurationException,
          'Connection is disabled, not able to update a user.',
          { message: error.message },
        )
        this.logger.error(
          err,
          `Not able to update user: database connection is disabled`,
        )
        throw err
      } else {
        this.logger.error(`Not able to update user: %o`, error)
        throw new Auth0Exception(error)
      }
    }

    this.logger.info(`User updated`)

    try {
      this.logger.info(`Sending UserUpdated event`)

      await this.eventsService.emitUserUpdatedEvent({
        email: updatedUser.email,
        name: updatedUser.name,
        userId: updatedUser.user_id,
        picture: updatedUser.picture,
        emailVerified: updatedUser.email_verified,
        appMetadata: JSON.stringify(updatedUser.app_metadata || {}),
        userMetadata: JSON.stringify(updatedUser.user_metadata || {}),
        tenantId: user.tenantId,
        entityId: user.entityId,
        product: user.product,
      })
    } catch (error) {
      const err = new KafkaException(
        ErrorName.ConfigurationException,
        'Error pushing user updated event into kafka',
        {
          message: error.message,
        },
      )
      this.logger.error(
        err,
        'Error pushing user updated event into kafka: %o',
        error,
      )
      throw err
    }

    const response: UserUpdatedResponse = camelcaseKeys(updatedUser)
    return response
  }

  private async findEmailOnlyClient(
    applicationClientName: string,
    applicationClientId?: string,
  ): Promise<Client> {
    const managementClient = await this.auth0Service.getManagementClient()
    const clients = await getAllResultPaginated(
      /* istanbul ignore next */
      async (skip: number, limit: number) => {
        return await managementClient.getClients({
          per_page: limit,
          page: skip,
        })
      },
      cfg().defaults.skip,
      cfg().defaults.limit,
    )
    if (!applicationClientId) {
      return clients.find((client) => client.name === applicationClientName)
    } else {
      return clients.find((client) => client.client_id === applicationClientId)
    }
  }

  private buildAppMetadata({
    product,
    tenantId,
    entityId,
    tenantRoles,
    rawData = {},
    registered = false,
  }: {
    product?: string
    tenantId?: string
    entityId?: string
    tenantRoles?: string[]
    rawData?: any
    registered?: boolean
  }) {
    const appMetadata: any = {
      ...rawData,
    }

    if (registered) {
      appMetadata.registered = true
    }

    if (product) {
      appMetadata.products = { ...appMetadata.products, [product]: true }
    }

    if (tenantId) {
      const tenantData: any = { ...appMetadata[tenantId] }

      if (entityId) {
        tenantData.entityId = entityId
      }

      if (tenantRoles) {
        tenantData.roles = tenantRoles
      }

      if (Object.keys(tenantData).length) {
        appMetadata[tenantId] = tenantData
      }
    }

    return appMetadata
  }
}
