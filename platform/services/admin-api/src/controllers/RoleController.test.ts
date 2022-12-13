import { RoleController } from './RoleController'
import { RoleService } from '../services/RoleService'
import createMockInstance from 'jest-create-mock-instance'
import {
  mockUuid,
  validCreateRoleRequest,
  validRolePermissionRequest,
} from '../../test/mocks'
import { NestJSPinoLogger } from '@consensys/observability'

describe('RoleController', () => {
  let controller: RoleController
  let serviceMock: jest.Mocked<RoleService>
  let loggerMock: jest.Mocked<NestJSPinoLogger>

  beforeEach(() => {
    serviceMock = createMockInstance(RoleService)
    loggerMock = createMockInstance(NestJSPinoLogger)
    controller = new RoleController(loggerMock, serviceMock)
  })

  describe('getRoleById', () => {
    it('success', async () => {
      await controller.getRoleById(mockUuid)
      expect(serviceMock.getRoleById).toHaveBeenCalledTimes(1)
      expect(serviceMock.getRoleById).toHaveBeenCalledWith(mockUuid)
    })
  })

  describe('createRole', () => {
    it('success', async () => {
      await controller.createRole(validCreateRoleRequest)
      expect(serviceMock.createRole).toHaveBeenCalledTimes(1)
      expect(serviceMock.createRole).toHaveBeenCalledWith(
        validCreateRoleRequest,
      )
    })
  })

  describe('assignPermissionToRole', () => {
    it('success', async () => {
      await controller.assignPermissionsToRole(
        mockUuid,
        validRolePermissionRequest,
      )
      expect(serviceMock.assignPermissionsToRole).toHaveBeenCalledTimes(1)
      expect(serviceMock.assignPermissionsToRole).toHaveBeenCalledWith(
        mockUuid,
        validRolePermissionRequest,
      )
    })
  })

  describe('removePermissionsToRole', () => {
    it('success', async () => {
      await controller.removePermissionsToRole(
        mockUuid,
        validRolePermissionRequest,
      )
      expect(serviceMock.removePermissionsToRole).toHaveBeenCalledTimes(1)
      expect(serviceMock.removePermissionsToRole).toHaveBeenCalledWith(
        mockUuid,
        validRolePermissionRequest,
      )
    })
  })

  describe('getRolePermissions', () => {
    it('success', async () => {
      await controller.getRolePermissions(mockUuid)
      expect(serviceMock.getPermissionsAssignedToRole).toHaveBeenCalledTimes(1)
      expect(serviceMock.getPermissionsAssignedToRole).toHaveBeenCalledWith(
        mockUuid,
      )
    })
  })
})
