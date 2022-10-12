import { RoleService } from './RoleService'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Auth0Service } from './Auth0Service'
import { createMockInstance } from 'jest-create-mock-instance'
import {
  mockUuid,
  validCreateRoleRequest,
  validRolePermissionRequest,
} from '../../test/mocks'
import { Auth0Exception } from '../errors/Auth0Exception'

describe('RoleService', () => {
  let auth0ServiceMock: jest.Mocked<Auth0Service>
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let service: RoleService
  let getRoleMock: jest.Mock
  let createRoleMock: jest.Mock
  let addPermissionsInRoleMock: jest.Mock
  let removePermissionsFromRoleMock: jest.Mock
  let getPermissionsInRoleMock: jest.Mock

  beforeEach(() => {
    getRoleMock = jest.fn()
    createRoleMock = jest.fn()
    addPermissionsInRoleMock = jest.fn()
    removePermissionsFromRoleMock = jest.fn()
    getPermissionsInRoleMock = jest.fn()

    loggerMock = createMockInstance(NestJSPinoLogger)
    auth0ServiceMock = createMockInstance(Auth0Service)
    const managementClientMock: any = {
      getRole: getRoleMock,
      createRole: createRoleMock,
      addPermissionsInRole: addPermissionsInRoleMock,
      removePermissionsFromRole: removePermissionsFromRoleMock,
      getPermissionsInRole: getPermissionsInRoleMock,
    }
    auth0ServiceMock.getManagementClient.mockImplementation(
      () => managementClientMock,
    )

    service = new RoleService(loggerMock, auth0ServiceMock)
  })

  describe('getRoleById', () => {
    const getRoleResponse = {
      id: 'roleId',
      description: 'roleDescription',
      name: 'roleName',
    }

    it('success', async () => {
      getRoleMock.mockImplementationOnce(() => getRoleResponse)
      const response = await service.getRoleById(mockUuid)
      expect(getRoleMock).toHaveBeenCalledTimes(1)
      expect(getRoleMock).toHaveBeenCalledWith({ id: mockUuid })
      expect(response).toMatchObject(getRoleResponse)
    })

    it('fails', async () => {
      getRoleMock.mockReset()
      getRoleMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.getRoleById(mockUuid)).rejects.toThrow(
        Auth0Exception,
      )
    })
  })

  describe('createRole', () => {
    const createRoleResponse = {
      id: 'roleId',
      description: 'roleDescription',
      name: 'roleName',
    }

    it('success', async () => {
      createRoleMock.mockImplementationOnce(() => createRoleResponse)
      const response = await service.createRole(validCreateRoleRequest)
      expect(response).toMatchObject(createRoleResponse)
      expect(createRoleMock).toHaveBeenCalledTimes(1)
      expect(createRoleMock).toHaveBeenCalledWith(validCreateRoleRequest)
    })

    it('fails', async () => {
      createRoleMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.createRole(validCreateRoleRequest)).rejects.toThrow(
        Auth0Exception,
      )
    })
  })

  describe('assignPermissionsToRole', () => {
    it('success', async () => {
      await service.assignPermissionsToRole(
        mockUuid,
        validRolePermissionRequest,
      )
      expect(addPermissionsInRoleMock).toHaveBeenCalledTimes(1)
      expect(addPermissionsInRoleMock).toHaveBeenCalledWith(
        {
          id: mockUuid,
        },
        {
          permissions: [
            {
              resource_server_identifier:
                validRolePermissionRequest[0].resourceServerIdentifier,
              permission_name: validRolePermissionRequest[0].permissionName,
            },
          ],
        },
      )
    })

    it('fails', async () => {
      addPermissionsInRoleMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.assignPermissionsToRole(mockUuid, validRolePermissionRequest),
      ).rejects.toThrow(Auth0Exception)
    })
  })

  describe('removePermissionsToRole', () => {
    it('success', async () => {
      await service.removePermissionsToRole(
        mockUuid,
        validRolePermissionRequest,
      )
      expect(removePermissionsFromRoleMock).toHaveBeenCalledTimes(1)
      expect(removePermissionsFromRoleMock).toHaveBeenCalledWith(
        {
          id: mockUuid,
        },
        {
          permissions: [
            {
              resource_server_identifier:
                validRolePermissionRequest[0].resourceServerIdentifier,
              permission_name: validRolePermissionRequest[0].permissionName,
            },
          ],
        },
      )
    })

    it('fails', async () => {
      removePermissionsFromRoleMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.removePermissionsToRole(mockUuid, validRolePermissionRequest),
      ).rejects.toThrow(Auth0Exception)
    })
  })

  describe('getPermissionsAssignedToRole', () => {
    const getPermissionsResponse = [
      {
        description: 'description',
        resource_server_identifier: 'resource_server_identifier',
        resource_server_name: 'resource_server_name',
        permission_name: 'permission_name',
      },
    ]

    it('success ', async () => {
      getPermissionsInRoleMock.mockImplementationOnce(
        () => getPermissionsResponse,
      )
      const response = await service.getPermissionsAssignedToRole(mockUuid)
      expect(getPermissionsInRoleMock).toHaveBeenCalledTimes(1)
      expect(getPermissionsInRoleMock).toHaveBeenCalledWith({ id: mockUuid })
      expect(response).toMatchObject([
        {
          description: getPermissionsResponse[0].description,
          resourceServerIdentifier:
            getPermissionsResponse[0].resource_server_identifier,
          resourceServerName: getPermissionsResponse[0].resource_server_name,
          permissionName: getPermissionsResponse[0].permission_name,
        },
      ])
    })

    it('fails', async () => {
      getPermissionsInRoleMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.getPermissionsAssignedToRole(mockUuid),
      ).rejects.toThrow(Auth0Exception)
    })
  })
})
