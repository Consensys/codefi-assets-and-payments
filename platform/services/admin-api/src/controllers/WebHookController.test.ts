import { WebHookController } from './WebHookController'
import { WebHookService } from '../services/WebHookService'
import createMockInstance from 'jest-create-mock-instance'
import { authRegisterRequestMock } from '../../test/mocks'
import { AuthHookRegisterRequest } from '../requests/AuthHookRegisterRequest'
import { NestJSPinoLogger } from '@consensys/observability'

describe('WebHookController', () => {
  let controller: WebHookController
  let webHookServiceMock: jest.Mocked<WebHookService>
  let authRegisterRequest: AuthHookRegisterRequest
  let loggerMock: jest.Mocked<NestJSPinoLogger>

  beforeEach(() => {
    authRegisterRequest = {
      ...authRegisterRequestMock,
    }
    webHookServiceMock = createMockInstance(WebHookService)
    loggerMock = createMockInstance(NestJSPinoLogger)
    controller = new WebHookController(loggerMock, webHookServiceMock)
  })

  it('success', async () => {
    webHookServiceMock.processAuthRegisterWebHook.mockImplementationOnce(
      async () => true,
    )

    const result = await controller.authHook(authRegisterRequest)
    expect(result).toMatchObject({
      registered: true,
    })
  })

  it('service throws - propagates', async () => {
    webHookServiceMock.processAuthRegisterWebHook.mockImplementationOnce(
      async () => {
        throw new Error('Boom!')
      },
    )

    await expect(controller.authHook(authRegisterRequest)).rejects.toThrowError(
      'Boom!',
    )
  })
})
