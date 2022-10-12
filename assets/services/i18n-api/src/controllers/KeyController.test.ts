import { KeyController } from './KeyController'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import { KeyService } from '../services/Key.service'

describe('KeyleController', () => {
  let logger: NestJSPinoLogger
  let service: KeyService
  let controller: KeyController

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    service = createMockInstance(KeyService)
    controller = new KeyController(logger, service)
  })

  describe('find', () => {
    const mockResponse = { foo: 'bar' }
    beforeEach(() => {
      service.find = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockResponse))
    })
    it('success', async () => {
      await expect(controller.find('en')).resolves.toEqual(mockResponse)
      expect(logger.info).toHaveBeenCalledWith(
        {
          filter: '',
          locale: 'en',
        },
        'find',
      )
    })
  })
})
