import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  userCreateCommandMock,
  tenantIdMock,
  connectionMock,
  passwordMock,
  rolesMock,
  entityIdMock,
} from '../../test/mocks'
import { UserCreateCommandConsumer } from './UserCreateCommandConsumer'
import { UserService } from '../services/UserService'
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types'

describe('userCreateCommandConsumer', () => {
  let consumer: UserCreateCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let userServiceMock: jest.Mocked<UserService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    userServiceMock = createMockInstance(UserService)

    consumer = new UserCreateCommandConsumer(loggerMock, userServiceMock)
  })

  describe('onMessage', () => {
    it('success - without optional values', async () => {
      await consumer.onMessage(userCreateCommandMock)
      expect(userServiceMock.createUser).toHaveBeenCalledTimes(1)
      expect(userServiceMock.createUser).toHaveBeenCalledWith(
        {
          name: userCreateCommandMock.name,
          email: userCreateCommandMock.email,
          applicationClientId: userCreateCommandMock.applicationClientId,
          password: undefined,
          roles: undefined,
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          product: ProductsEnum.payments,
        },
        {
          useInviteConnection: true,
        },
      )
    })

    it('success - without optional values', async () => {
      await consumer.onMessage({
        ...userCreateCommandMock,
        connection: connectionMock,
        password: passwordMock,
        roles: rolesMock,
      })
      expect(userServiceMock.createUser).toHaveBeenCalledTimes(1)
      expect(userServiceMock.createUser).toHaveBeenCalledWith(
        {
          name: userCreateCommandMock.name,
          email: userCreateCommandMock.email,
          applicationClientId: userCreateCommandMock.applicationClientId,
          password: passwordMock,
          roles: rolesMock,
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          product: ProductsEnum.payments,
        },
        { useInviteConnection: true },
      )
    })

    it('fails log error called', async () => {
      userServiceMock.createUser.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await consumer.onMessage(userCreateCommandMock)
      expect(loggerMock.error).toHaveBeenCalledTimes(2)
    })
  })
})
