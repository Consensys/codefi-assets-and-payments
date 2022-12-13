import { UserService } from '../services/UserService'
import { UserController } from './UserController'
import createMockInstance from 'jest-create-mock-instance'
import {
  countMock,
  createUserRequestMock,
  entityIdMock,
  inviteUserRequestMock,
  limitMock,
  mockUserEmail,
  mockUserId,
  skipMock,
  subjectMock,
  tenantIdMock,
  updateUserRequestMock,
  userCreatedResponseMock,
} from '../../test/mocks'
import { NestJSPinoLogger } from '@consensys/observability'
import { craftRequestWithAuthHeaders, superTenantId } from '@consensys/auth'
import { superEntityId } from '@consensys/auth/dist/utils/authUtils'

describe('UserController', () => {
  let userServiceMock: jest.Mocked<UserService>
  let controller: UserController
  let loggerMock: jest.Mocked<NestJSPinoLogger>

  beforeEach(() => {
    userServiceMock = createMockInstance(UserService)
    loggerMock = createMockInstance(NestJSPinoLogger)
    controller = new UserController(loggerMock, userServiceMock)
    process.env.AUTH_CUSTOM_NAMESPACE = 'test'
  })

  describe('invite user by email', () => {
    it('success', async () => {
      await controller.inviteUser(inviteUserRequestMock)
      expect(userServiceMock.createUser).toHaveBeenCalledTimes(1)
      expect(userServiceMock.createUser).toHaveBeenCalledWith(
        inviteUserRequestMock,
        {
          useInviteConnection: true,
        },
      )
    })

    it('fails - throws', async () => {
      userServiceMock.createUser.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.inviteUser(inviteUserRequestMock),
      ).rejects.toThrowError('boom')
    })
  })

  describe('get user by id', () => {
    it('success', async () => {
      await controller.getUserById(mockUserId)
      expect(userServiceMock.getUserById).toHaveBeenCalledTimes(1)
      expect(userServiceMock.getUserById).toHaveBeenCalledWith(mockUserId)
    })
  })

  describe('get user by email', () => {
    it('success', async () => {
      await controller.getUsersByEmail(mockUserEmail)
      expect(userServiceMock.getUsersByEmail).toHaveBeenCalledTimes(1)
      expect(userServiceMock.getUsersByEmail).toHaveBeenCalledWith(
        mockUserEmail,
      )
    })
  })

  describe('get users by entity', () => {
    it('success', async () => {
      const serviceResponseMock = {
        items: [userCreatedResponseMock, userCreatedResponseMock],
        count: countMock,
        limit: limitMock,
        skip: skipMock,
      }

      userServiceMock.getUsersByEntity.mockResolvedValueOnce(
        serviceResponseMock,
      )

      const response = await controller.getUsersByEntity(
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tenantIdMock,
        entityIdMock,
        skipMock,
        limitMock,
      )

      expect(response).toEqual(serviceResponseMock)

      expect(userServiceMock.getUsersByEntity).toHaveBeenCalledTimes(1)
      expect(userServiceMock.getUsersByEntity).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        limitMock,
        skipMock,
      )
    })

    it('success with super tenant', async () => {
      const serviceResponseMock = {
        items: [userCreatedResponseMock, userCreatedResponseMock],
        count: countMock,
        limit: limitMock,
        skip: skipMock,
      }

      userServiceMock.getUsersByEntity.mockResolvedValueOnce(
        serviceResponseMock,
      )

      const response = await controller.getUsersByEntity(
        craftRequestWithAuthHeaders(superTenantId, entityIdMock, subjectMock),
        tenantIdMock,
        entityIdMock,
        skipMock,
        limitMock,
      )

      expect(response).toEqual(serviceResponseMock)

      expect(userServiceMock.getUsersByEntity).toHaveBeenCalledTimes(1)
      expect(userServiceMock.getUsersByEntity).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        limitMock,
        skipMock,
      )
    })

    it('success with super entity', async () => {
      const serviceResponseMock = {
        items: [userCreatedResponseMock, userCreatedResponseMock],
        count: countMock,
        limit: limitMock,
        skip: skipMock,
      }

      userServiceMock.getUsersByEntity.mockResolvedValueOnce(
        serviceResponseMock,
      )

      const response = await controller.getUsersByEntity(
        craftRequestWithAuthHeaders(tenantIdMock, superEntityId, subjectMock),
        tenantIdMock,
        entityIdMock,
        skipMock,
        limitMock,
      )

      expect(response).toEqual(serviceResponseMock)

      expect(userServiceMock.getUsersByEntity).toHaveBeenCalledTimes(1)
      expect(userServiceMock.getUsersByEntity).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
        limitMock,
        skipMock,
      )
    })

    it('throws if tenant id does not match', async () => {
      const incorrectTenant = 'wrongTenant'

      userServiceMock.getUsersByEntity.mockResolvedValueOnce({
        items: [userCreatedResponseMock, userCreatedResponseMock],
        count: countMock,
        limit: limitMock,
        skip: skipMock,
      })

      await expect(
        controller.getUsersByEntity(
          craftRequestWithAuthHeaders(
            incorrectTenant,
            entityIdMock,
            subjectMock,
          ),
          tenantIdMock,
          entityIdMock,
          skipMock,
          limitMock,
        ),
      ).rejects.toThrowError(
        `Tenant in access token (${incorrectTenant}) must match requested tenant (${tenantIdMock})`,
      )
    })

    it('throws if entity id does not match', async () => {
      const incorrectEntity = 'wrongEntity'

      userServiceMock.getUsersByEntity.mockResolvedValueOnce({
        items: [userCreatedResponseMock, userCreatedResponseMock],
        count: countMock,
        limit: limitMock,
        skip: skipMock,
      })

      await expect(
        controller.getUsersByEntity(
          craftRequestWithAuthHeaders(
            tenantIdMock,
            incorrectEntity,
            subjectMock,
          ),
          tenantIdMock,
          entityIdMock,
          skipMock,
          limitMock,
        ),
      ).rejects.toThrowError(
        `Entity in access token (${incorrectEntity}) must match requested entity (${entityIdMock})`,
      )
    })
  })

  describe('delete user', () => {
    it('success', async () => {
      await controller.deleteUser(mockUserId)
      expect(userServiceMock.deleteUserById).toHaveBeenCalledTimes(1)
      expect(userServiceMock.deleteUserById).toHaveBeenCalledWith(mockUserId)
    })

    it('fails - throws', async () => {
      userServiceMock.deleteUserById.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(controller.deleteUser(mockUserId)).rejects.toThrowError(
        'boom',
      )
    })
  })

  describe('create user', () => {
    it('success', async () => {
      await controller.createUser(createUserRequestMock)
      expect(userServiceMock.createUser).toHaveBeenCalledTimes(1)
      expect(userServiceMock.createUser).toHaveBeenCalledWith(
        createUserRequestMock,
      )
    })

    it('fails - throws', async () => {
      userServiceMock.createUser.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.createUser(createUserRequestMock),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update user', () => {
    it('success', async () => {
      await controller.updateUser(updateUserRequestMock, mockUserId)
      expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1)
      expect(userServiceMock.updateUser).toHaveBeenCalledWith(
        updateUserRequestMock,
        mockUserId,
      )
    })

    it('fails - throws', async () => {
      userServiceMock.updateUser.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.updateUser(updateUserRequestMock, mockUserId),
      ).rejects.toThrowError('boom')
    })
  })
})
