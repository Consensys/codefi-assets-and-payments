import { ConfigConstants } from '../ConfigConstants'
import { ConfigStageRequest } from '../types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockManagementClient,
} from '../../../test/utils'
import { ManagementClientExtended } from 'src/types/Auth0ManagementClientExtended'
import { CreateStackAdminStage } from './CreateStackAdminStage'
import {
  initialCodefiApiRoles,
  mockErrorMessage,
  mockUserId,
  passwordMock,
  userCreatedWithEntityAndTenantMock,
} from '../../../test/mocks'
import cfg from '../../config'
import { User } from 'auth0'

describe('CreateStackAdminStage', () => {
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let requestMock: ConfigStageRequest
  let stage: CreateStackAdminStage

  beforeEach(() => {
    managementClientMock = createMockManagementClient()
    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
    })
    stage = new CreateStackAdminStage()
    cfg().initialConfig.stackAdminUserPassword = passwordMock
  })

  it('creates stack admin and assigns role', async () => {
    managementClientMock.getRoles.mockImplementationOnce(
      () => initialCodefiApiRoles,
    )

    cfg().initialConfig.stackAdminUserEmail = 'adminemail'

    managementClientMock.createUser.mockImplementationOnce(
      () => userCreatedWithEntityAndTenantMock,
    )

    await stage.run(requestMock)

    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledTimes(1)
    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledWith(
      cfg().initialConfig.stackAdminUserEmail,
    )

    expect(managementClientMock.deleteUser).toHaveBeenCalledTimes(0)

    expect(managementClientMock.createUser).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createUser).toHaveBeenCalledWith({
      name: ConfigConstants.STACK_ADMIN_NAME,
      email: cfg().initialConfig.stackAdminUserEmail,
      password: cfg().initialConfig.stackAdminUserPassword,
      connection: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
      app_metadata: {
        registered: true,
        tenantId: cfg().initialConfig.stackAdminTenantId,
        entityId: cfg().initialConfig.stackAdminEntityId,
        [cfg().initialConfig.stackAdminTenantId]: {
          entityId: cfg().initialConfig.stackAdminEntityId,
          roles: [ConfigConstants.STACK_ADMIN_ROLE],
        },
      },
    })

    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(1)
    expect(managementClientMock.getRoles).toHaveBeenCalledWith()

    expect(managementClientMock.assignRolestoUser).toHaveBeenCalledTimes(1)
    expect(managementClientMock.assignRolestoUser).toHaveBeenCalledWith(
      { id: mockUserId },
      { roles: ['1'] },
    )
  })

  it('creates stack admin without assigning role', async () => {
    managementClientMock.getRoles.mockImplementation(() => [])
    managementClientMock.createUser.mockImplementationOnce(
      () => userCreatedWithEntityAndTenantMock,
    )

    await stage.run(requestMock)

    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledTimes(1)
    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledWith(
      cfg().initialConfig.stackAdminUserEmail,
    )

    expect(managementClientMock.deleteUser).toHaveBeenCalledTimes(0)

    expect(managementClientMock.createUser).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createUser).toHaveBeenCalledWith({
      name: ConfigConstants.STACK_ADMIN_NAME,
      email: cfg().initialConfig.stackAdminUserEmail,
      password: cfg().initialConfig.stackAdminUserPassword,
      connection: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
      app_metadata: {
        registered: true,
        tenantId: cfg().initialConfig.stackAdminTenantId,
        entityId: cfg().initialConfig.stackAdminEntityId,
        [cfg().initialConfig.stackAdminTenantId]: {
          entityId: cfg().initialConfig.stackAdminEntityId,
          roles: [ConfigConstants.STACK_ADMIN_ROLE],
        },
      },
    })

    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(1)
    expect(managementClientMock.getRoles).toHaveBeenCalledWith()

    expect(managementClientMock.assignRolestoUser).toHaveBeenCalledTimes(0)
  })

  it('deletes users with matching email', async () => {
    const users: User[] = [userCreatedWithEntityAndTenantMock]
    managementClientMock.getRoles.mockImplementation(() => [])
    managementClientMock.getUsersByEmail.mockImplementationOnce(() => users)

    await stage.run(requestMock)

    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledTimes(1)
    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledWith(
      cfg().initialConfig.stackAdminUserEmail,
    )

    expect(managementClientMock.deleteUser).toHaveBeenCalledTimes(1)
    expect(managementClientMock.deleteUser).toHaveBeenCalledWith({
      id: users[0].user_id,
    })

    expect(managementClientMock.createUser).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createUser).toHaveBeenCalledWith({
      name: ConfigConstants.STACK_ADMIN_NAME,
      email: cfg().initialConfig.stackAdminUserEmail,
      password: cfg().initialConfig.stackAdminUserPassword,
      connection: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
      app_metadata: {
        registered: true,
        tenantId: cfg().initialConfig.stackAdminTenantId,
        entityId: cfg().initialConfig.stackAdminEntityId,
        [cfg().initialConfig.stackAdminTenantId]: {
          entityId: cfg().initialConfig.stackAdminEntityId,
          roles: [ConfigConstants.STACK_ADMIN_ROLE],
        },
      },
    })

    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(1)
    expect(managementClientMock.getRoles).toHaveBeenCalledWith()

    expect(managementClientMock.assignRolestoUser).toHaveBeenCalledTimes(0)
  })

  it('throws if create user fails', async () => {
    managementClientMock.createUser.mockImplementationOnce(() => {
      throw new Error(mockErrorMessage)
    })

    cfg().initialConfig.stackAdminUserEmail = 'adminemail'

    await expect(stage.run(requestMock)).rejects.toThrowError(mockErrorMessage)

    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createUser).toHaveBeenCalledTimes(1)
    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(0)
    expect(managementClientMock.assignRolestoUser).toHaveBeenCalledTimes(0)
  })

  it('does nothing if email not specified', async () => {
    cfg().initialConfig.stackAdminUserEmail = undefined

    await stage.run(requestMock)

    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledTimes(0)
    expect(managementClientMock.createUser).toHaveBeenCalledTimes(0)
    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(0)
    expect(managementClientMock.assignRolestoUser).toHaveBeenCalledTimes(0)
  })

  it('does nothing if password not specified', async () => {
    cfg().initialConfig.stackAdminUserPassword = undefined

    await stage.run(requestMock)

    expect(managementClientMock.getUsersByEmail).toHaveBeenCalledTimes(0)
    expect(managementClientMock.createUser).toHaveBeenCalledTimes(0)
    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(0)
    expect(managementClientMock.assignRolestoUser).toHaveBeenCalledTimes(0)
  })
})
