import { WebHookService } from './WebHookService'
import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import { IUserCreatedEvent } from '@consensys/messaging-events'
import { authRegisterRequestMock } from '../../test/mocks'
import cfg from '../config'
import { EventsService } from './EventsService'
import { AuthHookRegisterRequest } from 'src/requests/AuthHookRegisterRequest'

describe('WebHookService', () => {
  let service: WebHookService
  let logger: jest.Mocked<NestJSPinoLogger>
  let eventsService: jest.Mocked<EventsService>

  let authRegisterRequest: AuthHookRegisterRequest

  beforeEach(async () => {
    cfg().kafka.enabled = true

    authRegisterRequest = {
      ...authRegisterRequestMock,
    }
    logger = createMockInstance(NestJSPinoLogger)
    eventsService = createMockInstance(EventsService)
    service = new WebHookService(logger, eventsService)
  })

  describe('processAuthRegisterWebHook', () => {
    it('success', async () => {
      const expectedPayload: IUserCreatedEvent = {
        userId: authRegisterRequest.user.user_id,
        email: authRegisterRequest.user.email,
        name: authRegisterRequest.user.name,
        emailVerified: false,
        picture: undefined,
        appMetadata: '{}',
        userMetadata: '{}',
      }

      const result = await service.processAuthRegisterWebHook(
        authRegisterRequest,
      )
      expect(result).toBeTruthy()
      expect(eventsService.emitUserCreatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsService.emitUserCreatedEvent).toHaveBeenCalledWith(
        expectedPayload,
      )
    })

    it('fails to publish event returns false', async () => {
      const err = new Error('Boom!')
      eventsService.emitUserCreatedEvent.mockImplementationOnce(() => {
        throw err
      })
      try {
        await service.processAuthRegisterWebHook(
          authRegisterRequest,
        )
      } catch (error) {
        expect(error).toBe(err)
      }
    })
    it('missing properties - user_id', async () => {
      delete authRegisterRequest.user.user_id
      const result = await service.processAuthRegisterWebHook(
        authRegisterRequest,
      )
      expect(result).toBeFalsy()
      expect(eventsService.emitUserCreatedEvent).toHaveBeenCalledTimes(0)
    })

    it('missing properties - email', async () => {
      delete authRegisterRequest.user.email
      const result = await service.processAuthRegisterWebHook(
        authRegisterRequest,
      )
      expect(result).toBeFalsy()
      expect(eventsService.emitUserCreatedEvent).toHaveBeenCalledTimes(0)
    })

    it('missing properties - name', async () => {
      delete authRegisterRequest.user.name
      const result = await service.processAuthRegisterWebHook(
        authRegisterRequest,
      )
      expect(result).toBeFalsy()
      expect(eventsService.emitUserCreatedEvent).toHaveBeenCalledTimes(0)
    })
  })
})
