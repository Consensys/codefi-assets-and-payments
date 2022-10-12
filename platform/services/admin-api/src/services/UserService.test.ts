import { UserService } from './UserService'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import { Auth0Service } from './Auth0Service'
import { EventsService } from './EventsService'
import {
  createdUserMock,
  mockUserId,
  mockEmail,
  tenantIdMock,
  validClientId,
  createUserRequestMock,
  userCreatedResponseMock,
  entityIdMock,
  productMock,
  updateUserRequestMock,
  updatedUserMock,
  retrievedUserMock,
  clientIdMock,
  clientSecretMock,
  limitMock,
  skipMock,
  mockErrorMessage,
} from '../../test/mocks'
import { ConfigConstants } from '../config/ConfigConstants'
import { Auth0Exception } from '../errors/Auth0Exception'
import { ConfigurationException } from '@codefi-assets-and-payments/error-handler'
import * as pagination from '../utils/paginationUtils'

describe('UserService', () => {
  let service: UserService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let auth0ServiceMock: jest.Mocked<Auth0Service>
  let eventsServiceMock: jest.Mocked<EventsService>
  let getConnectionsMock: jest.Mock
  let getClientsMock: jest.Mock
  let createUserMock: jest.Mock
  let updateUserMock: jest.Mock
  let deleteUserMock: jest.Mock
  let getRolesMock: jest.Mock
  let assignRolestoUserMock: jest.Mock
  let requestChangePasswordEmailMock: jest.Mock
  let getUserMock: jest.Mock
  let getUsersByEmailMock: jest.Mock
  let getUsersMock: jest.Mock
  const paginationMock = jest.spyOn(pagination, 'getAllResultPaginated')

  beforeEach(() => {
    getConnectionsMock = jest.fn()
    getClientsMock = jest.fn()
    createUserMock = jest.fn()
    updateUserMock = jest.fn()
    deleteUserMock = jest.fn()
    getRolesMock = jest.fn()
    getUserMock = jest.fn()
    getUsersByEmailMock = jest.fn()
    assignRolestoUserMock = jest.fn()
    requestChangePasswordEmailMock = jest.fn()
    getUsersMock = jest.fn()
    loggerMock = createMockInstance(NestJSPinoLogger)
    auth0ServiceMock = createMockInstance(Auth0Service)
    eventsServiceMock = createMockInstance(EventsService)

    getUserMock.mockImplementationOnce(() => retrievedUserMock)
    createUserMock.mockImplementationOnce(() => createdUserMock)
    updateUserMock.mockImplementationOnce(() => updatedUserMock)

    const managementClientMock: any = {
      getConnections: getConnectionsMock,
      getClients: getClientsMock,
      createUser: createUserMock,
      updateUser: updateUserMock,
      deleteUser: deleteUserMock,
      getRoles: getRolesMock,
      assignRolestoUser: assignRolestoUserMock,
      getUser: getUserMock,
      getUsersByEmail: getUsersByEmailMock,
      getUsers: getUsersMock,
    }

    const authenticationClientMock: any = {
      requestChangePasswordEmail: requestChangePasswordEmailMock,
    }

    auth0ServiceMock.getManagementClient.mockImplementation(
      () => managementClientMock,
    )

    auth0ServiceMock.getAuthenticationClient.mockImplementation(
      () => authenticationClientMock,
    )

    getConnectionsMock.mockImplementationOnce(() => [
      {
        name: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
      },
      {
        name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
      },
    ])

    getClientsMock.mockImplementationOnce(() => [
      {
        name: ConfigConstants.EMAIL_INVITE_ONLY_APPLICATION_NAME,
      },
      { name: ConfigConstants.CREATE_USERS_APPLICATION_NAME },
    ])

    paginationMock
      .mockImplementationOnce(getConnectionsMock)
      .mockImplementation(getClientsMock)

    service = new UserService(loggerMock, auth0ServiceMock, eventsServiceMock)
  })

  describe('create user ', () => {
    it('create user - success', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])

      await service.createUser({
        ...createUserRequestMock,
        password: undefined,
        userMetadata: undefined,
      })
      expect(createUserMock).toHaveBeenCalledTimes(1)
      expect(createUserMock).toHaveBeenCalledWith({
        email: createUserRequestMock.email,
        connection: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        name: createUserRequestMock.name,
        family_name: createUserRequestMock.familyName,
        given_name: createUserRequestMock.givenName,
        picture: createUserRequestMock.picture,
        phone_number: createUserRequestMock.phoneNumber,
        nickname: createUserRequestMock.nickname,
        password: expect.any(String),
        email_verified: createUserRequestMock.emailVerified,
        app_metadata: {
          registered: true,
        },
        user_metadata: undefined,
        username: createUserRequestMock.username,
        verify_email: createUserRequestMock.verifyEmail,
        blocked: createUserRequestMock.blocked,
      })
      expect(eventsServiceMock.emitUserCreatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitUserCreatedEvent).toHaveBeenCalledWith({
        email: createdUserMock.email,
        name: createdUserMock.name,
        userId: createdUserMock.user_id,
        picture: createdUserMock.picture,
        emailVerified: createdUserMock.email_verified,
        appMetadata: JSON.stringify(createdUserMock.app_metadata),
        userMetadata: '{}',
      })
      expect(assignRolestoUserMock).toHaveBeenCalledTimes(0)
      expect(getRolesMock).toHaveBeenCalledTimes(0)
    })

    it('Create user with tenantId, entityId and product', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])

      await service.createUser({
        ...createUserRequestMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        product: productMock,
      })
      expect(createUserMock).toHaveBeenCalledTimes(1)
      expect(createUserMock).toHaveBeenCalledWith({
        email: createUserRequestMock.email,
        connection: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        name: createUserRequestMock.name,
        family_name: createUserRequestMock.familyName,
        given_name: createUserRequestMock.givenName,
        picture: createUserRequestMock.picture,
        phone_number: createUserRequestMock.phoneNumber,
        nickname: createUserRequestMock.nickname,
        password: createUserRequestMock.password,
        email_verified: createUserRequestMock.emailVerified,
        app_metadata: {
          registered: true,
          [tenantIdMock]: {
            entityId: entityIdMock,
          },
          products: {
            [productMock]: true,
          },
        },
        user_metadata: createUserRequestMock.userMetadata,
        username: createUserRequestMock.username,
        verify_email: createUserRequestMock.verifyEmail,
        blocked: createUserRequestMock.blocked,
      })
      expect(eventsServiceMock.emitUserCreatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitUserCreatedEvent).toHaveBeenCalledWith({
        email: createdUserMock.email,
        name: createdUserMock.name,
        userId: createdUserMock.user_id,
        picture: createdUserMock.picture,
        emailVerified: createdUserMock.email_verified,
        appMetadata: JSON.stringify(createdUserMock.app_metadata),
        userMetadata: JSON.stringify(createdUserMock.user_metadata),
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        product: productMock,
      })
      expect(assignRolestoUserMock).toHaveBeenCalledTimes(0)
      expect(getRolesMock).toHaveBeenCalledTimes(0)
    })

    it('create user with roles', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])
      getRolesMock.mockImplementationOnce(() => [
        {
          name: 'role1',
          id: '1',
        },
      ])
      await service.createUser({
        ...createUserRequestMock,
        roles: ['role1'],
      })
      expect(getRolesMock).toHaveBeenCalledTimes(1)
      expect(assignRolestoUserMock).toHaveBeenCalledTimes(1)
    })

    it('create user with roles - does not exist', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])
      getRolesMock.mockImplementationOnce(() => [
        {
          name: 'nope',
          id: '1',
        },
      ])
      await expect(
        service.createUser({
          ...createUserRequestMock,
          roles: ['role1'],
        }),
      ).rejects.toThrowError(
        `Role not found, make sure it exists before assigning it to an user`,
      )
      expect(getRolesMock).toHaveBeenCalledTimes(1)
      expect(assignRolestoUserMock).toHaveBeenCalledTimes(0)
    })

    it('create user without metadata (for coverage)', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])

      createUserMock.mockReset()
      createUserMock.mockImplementationOnce(() => {
        return {
          ...createdUserMock,
          app_metadata: undefined,
          user_metadata: undefined,
        }
      })

      await service.createUser(createUserRequestMock)
      expect(eventsServiceMock.emitUserCreatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitUserCreatedEvent).toHaveBeenCalledWith({
        email: createdUserMock.email,
        name: createdUserMock.name,
        userId: createdUserMock.user_id,
        picture: createdUserMock.picture,
        emailVerified: createdUserMock.email_verified,
        appMetadata: '{}', // Tested here (for coverage)
        userMetadata: '{}', // Tested here (for coverage)
      })
    })

    it('no client must throw', async () => {
      getClientsMock.mockReset()
      getClientsMock.mockImplementationOnce(() => [])
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])
      await expect(
        service.createUser({
          ...createUserRequestMock,
          applicationClientId: validClientId,
        }),
      ).rejects.toThrowError('Client was not found')
    })

    it('not able to create user must throw', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])
      const errMessage = 'messageMock'
      const err = new ConfigurationException('Boom!', errMessage, {})
      createUserMock.mockReset()
      createUserMock.mockImplementationOnce(() => {
        throw err
      })
      paginationMock.mockReset()
      paginationMock
        .mockImplementationOnce(getConnectionsMock)
        .mockImplementationOnce(getClientsMock)
      try {
        await service.createUser(createUserRequestMock)
      } catch (error) {
        expect(error.message).toBe(errMessage)
      }
    })

    it('connection is disabled must throw', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])
      const errMessage = 'messageMock'
      const err = new ConfigurationException(
        'Connection is disabled, not able to invite user.',
        errMessage,
        {},
      )
      createUserMock.mockReset()
      createUserMock.mockImplementationOnce(() => {
        throw err
      })
      paginationMock.mockReset()
      paginationMock
        .mockImplementationOnce(getConnectionsMock)
        .mockImplementationOnce(getClientsMock)
      try {
        await service.createUser(createUserRequestMock)
      } catch (error) {
        expect(error.message).toBe(errMessage)
      }
    })

    it('if it fails sending kafka event it must revert and throw', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        },
      ])
      paginationMock.mockReset()
      paginationMock
        .mockImplementationOnce(getConnectionsMock)
        .mockImplementationOnce(getClientsMock)
      eventsServiceMock.emitUserCreatedEvent.mockImplementationOnce(() => {
        throw new Error('Error pushing user created event into kafka')
      })
      await expect(
        service.createUser(createUserRequestMock),
      ).rejects.toThrowError('Error pushing user created event into kafka')
      expect(deleteUserMock).toHaveBeenCalledTimes(1)
      expect(deleteUserMock).toHaveBeenCalledWith({
        id: createdUserMock.user_id,
      })
    })

    it('no connection must throw', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [])
      await expect(
        service.createUser(createUserRequestMock),
      ).rejects.toThrowError('Connection was not found')
    })

    it('no connection must throw', async () => {
      getConnectionsMock.mockReset()
      getConnectionsMock.mockImplementationOnce(() => [])
      await expect(
        service.createUser(createUserRequestMock),
      ).rejects.toThrowError('Connection was not found')
    })

    it('uses invite connection if requested', async () => {
      await service.createUser(createUserRequestMock, {
        useInviteConnection: true,
      })

      expect(createUserMock).toBeCalledTimes(1)
      expect(createUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
        }),
      )
    })

    it('uses invite application if using invite connection', async () => {
      getClientsMock.mockReset()
      getClientsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.EMAIL_INVITE_ONLY_APPLICATION_NAME,
          client_id: clientIdMock,
          client_secret: clientSecretMock,
        },
      ])

      await service.createUser(createUserRequestMock, {
        useInviteConnection: true,
      })

      expect(auth0ServiceMock.getManagementClient).toBeCalledTimes(3)
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledWith({
        clientId: clientIdMock,
        clientSecret: clientSecretMock,
      })
    })

    it('sends change password email if using invite connection', async () => {
      await service.createUser(createUserRequestMock, {
        useInviteConnection: true,
      })

      expect(requestChangePasswordEmailMock).toBeCalledTimes(1)
      expect(requestChangePasswordEmailMock).toHaveBeenCalledWith({
        email: createUserRequestMock.email,
        connection: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
      })
    })

    it('includes roles in app metadata if tenant roles set', async () => {
      const rolesMock = ['role1', 'role2', 'role3']

      await service.createUser({
        ...createUserRequestMock,
        tenantId: tenantIdMock,
        tenantRoles: rolesMock,
      })

      expect(createUserMock).toBeCalledTimes(1)
      expect(createUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          app_metadata: {
            registered: true,
            [tenantIdMock]: {
              roles: rolesMock,
            },
          },
        }),
      )
    })
  })

  describe('update user ', () => {
    beforeEach(() => {
      getUserMock.mockReset()
      getUserMock.mockImplementationOnce(() => retrievedUserMock)

      paginationMock.mockReset()
      paginationMock.mockImplementationOnce(getClientsMock)
    })

    it('update user - success', async () => {
      getClientsMock.mockReset()
      getClientsMock.mockImplementationOnce(() => [
        {
          name: ConfigConstants.CREATE_USERS_APPLICATION_NAME,
          client_id: clientIdMock,
          client_secret: clientSecretMock,
        },
      ])

      await service.updateUser(updateUserRequestMock, mockUserId)

      expect(getUserMock).toHaveBeenCalledTimes(1)
      expect(updateUserMock).toHaveBeenCalledTimes(1)
      expect(updateUserMock).toHaveBeenCalledWith(
        { id: mockUserId },
        {
          app_metadata: {
            registered: true,
            xxx: 'yyy',
          },
        },
      )

      expect(eventsServiceMock.emitUserUpdatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitUserUpdatedEvent).toHaveBeenCalledWith({
        email: updatedUserMock.email,
        name: updatedUserMock.name,
        userId: updatedUserMock.user_id,
        picture: updatedUserMock.picture,
        emailVerified: updatedUserMock.email_verified,
        appMetadata: JSON.stringify(updatedUserMock.app_metadata),
        userMetadata: '{}',
      })

      expect(auth0ServiceMock.getManagementClient).toBeCalledTimes(3)
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledWith({
        clientId: clientIdMock,
        clientSecret: clientSecretMock,
      })
    })

    it('Update user with tenantId, entityId and product', async () => {
      await service.updateUser(
        {
          ...updateUserRequestMock,
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          product: productMock,
        },
        mockUserId,
      )
      expect(updateUserMock).toHaveBeenCalledTimes(1)
      expect(updateUserMock).toHaveBeenCalledWith(
        { id: mockUserId },
        {
          app_metadata: {
            registered: true,
            xxx: 'yyy',
            [tenantIdMock]: {
              entityId: entityIdMock,
            },
            products: {
              [productMock]: true,
            },
          },
        },
      )
      expect(eventsServiceMock.emitUserUpdatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitUserUpdatedEvent).toHaveBeenCalledWith({
        email: updatedUserMock.email,
        name: updatedUserMock.name,
        userId: updatedUserMock.user_id,
        picture: updatedUserMock.picture,
        emailVerified: updatedUserMock.email_verified,
        appMetadata: JSON.stringify(updatedUserMock.app_metadata),
        userMetadata: '{}',
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        product: productMock,
      })
    })

    it('update user - user without metadata (for coverage)', async () => {
      updateUserMock.mockReset()
      updateUserMock.mockImplementationOnce(() => {
        return {
          ...updatedUserMock,
          app_metadata: undefined,
          user_metadata: undefined,
        }
      })

      await service.updateUser(updateUserRequestMock, mockUserId)
      expect(eventsServiceMock.emitUserUpdatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitUserUpdatedEvent).toHaveBeenCalledWith({
        email: updatedUserMock.email,
        name: updatedUserMock.name,
        userId: updatedUserMock.user_id,
        picture: updatedUserMock.picture,
        emailVerified: updatedUserMock.email_verified,
        appMetadata: '{}', // Tested here (for coverage)
        userMetadata: '{}', // Tested here (for coverage)
      })
    })

    it('no client must throw', async () => {
      await expect(
        service.updateUser(
          {
            ...updateUserRequestMock,
            applicationClientId: validClientId,
          },
          mockUserId,
        ),
      ).rejects.toThrowError('Client was not found')
    })

    it('not able to update user must throw', async () => {
      const errMessage = 'messageMock'
      const err = new ConfigurationException('Boom!', errMessage, {})
      updateUserMock.mockReset()
      updateUserMock.mockImplementationOnce(() => {
        throw err
      })
      try {
        await service.updateUser(updateUserRequestMock, mockUserId)
      } catch (error) {
        expect(error.message).toBe(errMessage)
      }
    })

    it('if it fails sending kafka event it must revert and throw', async () => {
      eventsServiceMock.emitUserUpdatedEvent.mockImplementationOnce(() => {
        throw new Error('Error pushing user updated event into kafka')
      })
      await expect(
        service.updateUser(updateUserRequestMock, mockUserId),
      ).rejects.toThrowError('Error pushing user updated event into kafka')
    })

    it('includes roles in app metadata if tenant roles set', async () => {
      const rolesMock = ['role1', 'role2', 'role3']

      getUserMock.mockReset()
      getUserMock.mockResolvedValue({})

      await service.updateUser(
        {
          ...updateUserRequestMock,
          tenantId: tenantIdMock,
          tenantRoles: rolesMock,
        },
        mockUserId,
      )

      expect(updateUserMock).toBeCalledTimes(1)
      expect(updateUserMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          app_metadata: {
            [tenantIdMock]: {
              roles: rolesMock,
            },
            xxx: 'yyy',
          },
        }),
      )
    })
  })

  describe('delete user by id', () => {
    it('success', async () => {
      await service.deleteUserById(mockUserId)
      expect(deleteUserMock).toHaveBeenCalledTimes(1)
      expect(deleteUserMock).toHaveBeenCalledWith({
        id: mockUserId,
      })
    })
    it('error - throws', async () => {
      deleteUserMock.mockReset()
      deleteUserMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.deleteUserById(mockUserId)).rejects.toThrow(
        Auth0Exception,
      )
    })
  })

  describe('get user by id', () => {
    it('success', async () => {
      await service.getUserById(mockUserId)
      expect(getUserMock).toHaveBeenCalledTimes(1)
      expect(getUserMock).toHaveBeenCalledWith({
        id: mockUserId,
      })
    })

    it('error - throws', async () => {
      getUserMock.mockReset()
      getUserMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.getUserById(mockUserId)).rejects.toThrow(
        Auth0Exception,
      )
    })
  })

  describe('get users by email', () => {
    it('success', async () => {
      getUsersByEmailMock.mockImplementationOnce(async () => [
        userCreatedResponseMock,
      ])
      await service.getUsersByEmail(mockEmail)
      expect(getUsersByEmailMock).toHaveBeenCalledTimes(1)
      expect(getUsersByEmailMock).toHaveBeenCalledWith(mockEmail)
    })

    it('error - throws', async () => {
      getUsersByEmailMock.mockReset()
      getUsersByEmailMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.getUsersByEmail(mockEmail)).rejects.toThrow(
        Auth0Exception,
      )
    })
  })

  describe('get users by entity', () => {
    it('success', async () => {
      const totalMock = 1234

      getUsersMock.mockImplementationOnce(async () => ({
        users: [userCreatedResponseMock, userCreatedResponseMock],
        total: totalMock,
        start: skipMock,
        limit: limitMock,
      }))

      const response = await service.getUsersByEntity(
        tenantIdMock,
        entityIdMock,
        limitMock,
        skipMock,
      )

      expect(response).toEqual({
        items: [userCreatedResponseMock, userCreatedResponseMock],
        count: totalMock,
        skip: skipMock,
        limit: limitMock,
      })

      expect(getUsersMock).toHaveBeenCalledTimes(1)
      expect(getUsersMock).toHaveBeenCalledWith({
        q: `app_metadata.${tenantIdMock}.entityId:"${entityIdMock}"`,
        page: skipMock,
        per_page: limitMock,
        include_totals: true,
      })
    })

    it('success with special characters in tenant id', async () => {
      const totalMock = 1234

      getUsersMock.mockImplementationOnce(async () => ({
        users: [userCreatedResponseMock, userCreatedResponseMock],
        total: totalMock,
        start: skipMock,
        limit: limitMock,
      }))

      const response = await service.getUsersByEntity(
        'tenant+-&|!(){}[]^"~*?:\\Id1',
        entityIdMock,
        limitMock,
        skipMock,
      )

      expect(response).toEqual({
        items: [userCreatedResponseMock, userCreatedResponseMock],
        count: totalMock,
        skip: skipMock,
        limit: limitMock,
      })

      expect(getUsersMock).toHaveBeenCalledTimes(1)
      expect(getUsersMock).toHaveBeenCalledWith({
        q: `app_metadata.tenant\\+\\-\\&\\|\\!\\(\\)\\{\\}\\[\\]\\^\\"\\~\\*\\?\\:\\\\Id1.entityId:"${entityIdMock}"`,
        page: skipMock,
        per_page: limitMock,
        include_totals: true,
      })
    })

    it('success with special characters in entity id', async () => {
      const totalMock = 1234

      getUsersMock.mockImplementationOnce(async () => ({
        users: [userCreatedResponseMock, userCreatedResponseMock],
        total: totalMock,
        start: skipMock,
        limit: limitMock,
      }))

      const response = await service.getUsersByEntity(
        tenantIdMock,
        'entity+-&|!(){}[]^"~*?:\\Id1',
        limitMock,
        skipMock,
      )

      expect(response).toEqual({
        items: [userCreatedResponseMock, userCreatedResponseMock],
        count: totalMock,
        skip: skipMock,
        limit: limitMock,
      })

      expect(getUsersMock).toHaveBeenCalledTimes(1)
      expect(getUsersMock).toHaveBeenCalledWith({
        q: `app_metadata.tenantId1.entityId:"entity+-&|!(){}[]^\\"~*?:\\\\Id1"`,
        page: skipMock,
        per_page: limitMock,
        include_totals: true,
      })
    })

    it('error - throws', async () => {
      getUsersMock.mockReset()
      getUsersMock.mockImplementationOnce(() => {
        throw new Error(mockErrorMessage)
      })

      await expect(
        service.getUsersByEntity(
          tenantIdMock,
          entityIdMock,
          limitMock,
          skipMock,
        ),
      ).rejects.toThrow(Auth0Exception)
    })
  })
})
