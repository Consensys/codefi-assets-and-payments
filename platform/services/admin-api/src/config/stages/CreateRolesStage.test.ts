import { ConfigConstants } from '../ConfigConstants'
import { ConfigStageRequest } from '../types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockManagementClient,
} from '../../../test/utils'
import { ManagementClientExtended } from 'src/types/Auth0ManagementClientExtended'
import { CreateRolesStage } from './CreateRolesStage'
import cfg from '../../config'
import {
  findPermissionsForRoles,
  formatPermission,
  initialCodefiApiRoles,
} from '../../../test/mocks'

describe('CreateRolesStage', () => {
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let requestMock: ConfigStageRequest
  let stage: CreateRolesStage

  const createdRoleMock = {
    id: 'someid',
  }

  beforeEach(() => {
    managementClientMock = createMockManagementClient()
    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
    })
    stage = new CreateRolesStage()

    managementClientMock.getRoles.mockImplementation(
      () => initialCodefiApiRoles,
    )
    managementClientMock.createRole.mockImplementation(() => createdRoleMock)
  })

  it('creates roles', async () => {
    const mockResourceServers = [
      {
        id: 'someId',
        identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
        scopes: [],
      },
    ]

    managementClientMock.getResourceServers.mockImplementation(
      () => mockResourceServers,
    )

    const mockInitialRole = {
      name: 'anotherName',
      description: 'Descr',
      permissions: [
        {
          description: 'permissionDescr',
          value: 'perm:ission',
        },
      ],
    }

    cfg().initialConfig.initialRoles = [mockInitialRole]

    managementClientMock.getPermissionsInRole.mockImplementation((input) =>
      findPermissionsForRoles(input),
    )

    await stage.run(requestMock)

    expect(managementClientMock.createRole).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createRole).toHaveBeenCalledWith({
      name: mockInitialRole.name,
      description: mockInitialRole.description,
    })

    expect(managementClientMock.addPermissionsInRole).toHaveBeenCalledTimes(1)
    expect(managementClientMock.addPermissionsInRole).toHaveBeenCalledWith(
      { id: expect.anything() },
      {
        permissions: [
          {
            resource_server_identifier:
              ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
            permission_name: mockInitialRole.permissions[0].value,
          },
        ],
      },
    )
  })

  it('does nothing if role exists with same permissions', async () => {
    cfg().initialConfig.stackAdminUserEmail = 'adminemail'

    const mockResourceServers = [
      {
        id: 'someId',
        identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
        scopes: [],
      },
    ]

    managementClientMock.getResourceServers.mockImplementation(
      () => mockResourceServers,
    )

    const someRoleId = 'someRoleId'

    const mockPermission = {
      description: 'permissionDescr',
      value: 'perm:ission',
    }

    const mockInitialRole = {
      name: 'anotherName',
      description: 'Descr',
      permissions: [mockPermission],
    }

    cfg().initialConfig.initialRoles = [mockInitialRole]

    const mockExistingRoles = [
      ...initialCodefiApiRoles,
      {
        id: someRoleId,
        name: mockInitialRole.name,
      },
    ]

    managementClientMock.getRoles.mockImplementation(() => mockExistingRoles)

    managementClientMock.getPermissionsInRole.mockImplementation((input) => {
      if (input?.id === someRoleId) {
        return [formatPermission(mockPermission)]
      } else {
        return findPermissionsForRoles(input)
      }
    })

    await stage.run(requestMock)

    expect(managementClientMock.createRole).toHaveBeenCalledTimes(0)
    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(1)
    expect(managementClientMock.addPermissionsInRole).toHaveBeenCalledTimes(0)
  })

  it('adds permissions to existing role', async () => {
    const mockResourceServers = [
      {
        id: 'someId',
        identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
        scopes: [],
      },
    ]

    managementClientMock.getResourceServers.mockImplementation(
      () => mockResourceServers,
    )

    const someRoleId = 'someRoleId'

    const mockPermission = {
      description: 'permissionDescr',
      value: 'perm:ission',
    }

    const mockInitialRole = {
      name: 'anotherName',
      description: 'Descr',
      permissions: [mockPermission],
    }

    cfg().initialConfig.initialRoles = [mockInitialRole]

    const mockExistingRoles = [
      ...initialCodefiApiRoles,
      {
        id: someRoleId,
        name: mockInitialRole.name,
      },
    ]

    managementClientMock.getRoles.mockImplementation(() => mockExistingRoles)

    managementClientMock.getPermissionsInRole.mockImplementation((input) => {
      if (input?.id === someRoleId) {
        return [] // No permission found ==> 'mockPermission' needs to be added
      } else {
        return findPermissionsForRoles(input)
      }
    })

    await stage.run(requestMock)

    expect(managementClientMock.createRole).toHaveBeenCalledTimes(0)
    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(1)
    expect(
      managementClientMock.removePermissionsFromRole,
    ).toHaveBeenCalledTimes(0)

    expect(managementClientMock.addPermissionsInRole).toHaveBeenCalledTimes(1)
    expect(managementClientMock.addPermissionsInRole).toHaveBeenCalledWith(
      { id: someRoleId },
      {
        permissions: [
          {
            resource_server_identifier:
              ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
            permission_name: 'perm:ission',
          },
        ],
      },
    )
  })

  it('removes permissions from existing role', async () => {
    const mockResourceServers = [
      {
        id: 'someId',
        identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
        scopes: [],
      },
    ]

    managementClientMock.getResourceServers.mockImplementation(
      () => mockResourceServers,
    )

    const someRoleId = 'someRoleId'

    const mockPermission = {
      description: 'permissionDescr',
      value: 'perm:ission',
    }

    const mockPermissionToBeDeleted = {
      description: 'permissionDescrToBeRemoved',
      value: 'perm:ission:to:be:removed',
    }

    const mockInitialRole = {
      name: 'anotherName',
      description: 'Descr',
      permissions: [mockPermission],
    }

    cfg().initialConfig.initialRoles = [mockInitialRole]

    const mockExistingRoles = [
      ...initialCodefiApiRoles,
      {
        id: someRoleId,
        name: mockInitialRole.name,
      },
    ]

    managementClientMock.getRoles.mockImplementation(() => mockExistingRoles)

    managementClientMock.getPermissionsInRole.mockImplementation((input) => {
      if (input?.id === someRoleId) {
        return [
          formatPermission(mockPermission),
          formatPermission(mockPermissionToBeDeleted),
        ]
      } else {
        return findPermissionsForRoles(input)
      }
    })

    await stage.run(requestMock)

    expect(managementClientMock.createRole).toHaveBeenCalledTimes(0)
    expect(managementClientMock.getRoles).toHaveBeenCalledTimes(1)
    expect(managementClientMock.addPermissionsInRole).toHaveBeenCalledTimes(0)

    expect(
      managementClientMock.removePermissionsFromRole,
    ).toHaveBeenCalledTimes(1)
    expect(managementClientMock.removePermissionsFromRole).toHaveBeenCalledWith(
      { id: someRoleId },
      {
        permissions: [
          {
            resource_server_identifier:
              ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
            permission_name: 'perm:ission:to:be:removed',
          },
        ],
      },
    )
  })
})
