import { Auth0ExceptionsFilter } from './Auth0ExceptionsFilter'
import { TestingModule, Test } from '@nestjs/testing'
import { Auth0Exception } from '../errors/Auth0Exception'
import { ArgumentsHost } from '@nestjs/common'

describe('Auth0ExceptionsFilter', () => {
  const notFoundResponseMock = {
    statusCode: 404,
    message: 'The specified resource was not found',
  }

  let auth0ExceptionsFilter: Auth0ExceptionsFilter
  const argumentsHost: ArgumentsHost = {
    getArgs: jest.fn().mockReturnThis(),
    getArgByIndex: jest.fn().mockReturnThis(),
    switchToRpc: jest.fn().mockReturnThis(),
    switchToHttp: jest.fn().mockReturnThis(),
    switchToWs: jest.fn().mockReturnThis(),
    getType: jest.fn().mockReturnThis(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Auth0ExceptionsFilter],
    }).compile()
    auth0ExceptionsFilter = module.get<Auth0ExceptionsFilter>(
      Auth0ExceptionsFilter,
    )
  })

  it('should be defined', () => {
    expect(auth0ExceptionsFilter).toBeDefined()
  })

  it('should be defined', () => {
    expect(auth0ExceptionsFilter.catch).toBeDefined()
  })

  it('Should return Not Found', () => {
    const status = jest.fn(() => {
      return {
        json: jest.fn(),
      }
    })
    argumentsHost.switchToHttp().getResponse = jest.fn().mockReturnValueOnce({
      body: { data: 'mocked data' },
      status,
    })

    auth0ExceptionsFilter.catch = jest
      .fn()
      .mockReturnValueOnce(notFoundResponseMock)
    const test = jest.spyOn(auth0ExceptionsFilter, 'catch')
    const exception = new Auth0Exception({ message: 'Not Found' })
    const response = auth0ExceptionsFilter.catch(exception, argumentsHost)
    expect(test).toBeCalled()
    expect(response).toEqual(notFoundResponseMock)
  })
})
