import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import { validCreateApiRequest, mockUuid } from '../../test/mocks'
import { ResourceServerApiController } from './ResourceServerApiController'
import { ResourceServerApiService } from '../services/ResourceServerApiService'

describe('ResourceServerApiController', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let controller: ResourceServerApiController
  let resourceServerApiServiceMock: jest.Mocked<ResourceServerApiService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    resourceServerApiServiceMock = createMockInstance(ResourceServerApiService)
    controller = new ResourceServerApiController(
      loggerMock,
      resourceServerApiServiceMock,
    )
  })

  describe('ResourceServerApiPost', () => {
    it('success', async () => {
      const validCreateApiReq = validCreateApiRequest()
      await controller.createApi(validCreateApiReq)
      expect(resourceServerApiServiceMock.createApi).toHaveBeenCalledTimes(1)
      expect(resourceServerApiServiceMock.createApi).toHaveBeenCalledWith(
        validCreateApiReq.name,
        validCreateApiReq.identifier,
        validCreateApiReq.scopes,
        validCreateApiReq.token_lifetime,
        true,
      )
    })
  })

  describe('getApiScopes', () => {
    it('success', async () => {
      await controller.getApiScopes(mockUuid)
      expect(
        resourceServerApiServiceMock.getResourceServerScopes,
      ).toHaveBeenCalledTimes(1)
      expect(
        resourceServerApiServiceMock.getResourceServerScopes,
      ).toHaveBeenCalledWith(mockUuid)
    })
  })

  describe('getDefaultApiScopes', () => {
    it('success', async () => {
      await controller.getDefaultApiScopes()
      expect(
        resourceServerApiServiceMock.getResourceServerScopes,
      ).toHaveBeenCalledTimes(1)
      expect(
        resourceServerApiServiceMock.getResourceServerScopes,
      ).toHaveBeenCalledWith()
    })
  })
})
