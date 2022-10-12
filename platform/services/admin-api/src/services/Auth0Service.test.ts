import { Auth0Service } from './Auth0Service'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import cfg from '../../src/config'
import {
  audienceMock,
  clientIdMock,
  clientSecretMock,
  domainMock,
  mockJwtAccessToken,
} from '../../test/mocks'

jest.mock('auth0', () => ({
  ManagementClient: jest.fn(),
  AuthenticationClient: jest.fn(),
}))

describe('Auth0Service', () => {
  let service: Auth0Service
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>
  let auth0Mock: jest.Mocked<any>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    m2mTokenServiceMock = createMockInstance(M2mTokenService)

    service = new Auth0Service(loggerMock, m2mTokenServiceMock)

    auth0Mock = require('auth0')

    jest.resetAllMocks()
  })

  describe('getManagementClient', () => {
    it('uses provided args', async () => {
      const mockClient = {}
      auth0Mock.ManagementClient.mockReturnValueOnce(mockClient)

      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(
        mockJwtAccessToken,
      )

      cfg().auth0.tenantDomain = domainMock

      const client = await service.getManagementClient({
        clientId: clientIdMock,
        clientSecret: clientSecretMock,
        audience: audienceMock,
      })

      expect(client).toBe(mockClient)

      expect(auth0Mock.ManagementClient).toHaveBeenCalledTimes(1)
      expect(auth0Mock.ManagementClient).toHaveBeenCalledWith({
        domain: domainMock,
        token: mockJwtAccessToken,
      })

      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        clientIdMock,
        clientSecretMock,
        audienceMock,
      )
    })

    it('uses config if args not provided', async () => {
      const mockClient = {}
      auth0Mock.ManagementClient.mockReturnValueOnce(mockClient)

      m2mTokenServiceMock.createM2mToken.mockResolvedValueOnce(
        mockJwtAccessToken,
      )

      cfg().auth0.tenantDomain = domainMock
      cfg().auth0.clientId = clientIdMock
      cfg().auth0.clientSecret = clientSecretMock
      cfg().auth0.audience = audienceMock

      const client = await service.getManagementClient()

      expect(client).toBe(mockClient)

      expect(auth0Mock.ManagementClient).toHaveBeenCalledTimes(1)
      expect(auth0Mock.ManagementClient).toHaveBeenCalledWith({
        domain: domainMock,
        token: mockJwtAccessToken,
      })

      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1)
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        clientIdMock,
        clientSecretMock,
        audienceMock,
      )
    })
  })

  describe('getAuthenticationClient', () => {
    it('uses provided args', async () => {
      const mockClient = {}
      auth0Mock.AuthenticationClient.mockReturnValueOnce(mockClient)

      const client = service.getAuthenticationClient({
        clientId: clientIdMock,
        clientSecret: clientSecretMock,
        domain: domainMock,
      })

      expect(client).toBe(mockClient)

      expect(auth0Mock.AuthenticationClient).toHaveBeenCalledTimes(1)
      expect(auth0Mock.AuthenticationClient).toHaveBeenCalledWith({
        clientId: clientIdMock,
        clientSecret: clientSecretMock,
        domain: domainMock,
      })
    })

    it('uses config if args not provided', async () => {
      const mockClient = {}
      auth0Mock.AuthenticationClient.mockReturnValue(mockClient)

      cfg().auth0.clientId = clientIdMock
      cfg().auth0.clientSecret = clientSecretMock
      cfg().auth0.tenantDomain = domainMock

      const client = service.getAuthenticationClient()

      expect(client).toBe(mockClient)

      expect(auth0Mock.AuthenticationClient).toHaveBeenCalledTimes(1)
      expect(auth0Mock.AuthenticationClient).toHaveBeenCalledWith({
        clientId: clientIdMock,
        clientSecret: clientSecretMock,
        domain: domainMock,
      })
    })
  })
})
