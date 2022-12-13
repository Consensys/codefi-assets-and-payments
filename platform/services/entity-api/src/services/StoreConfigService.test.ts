import { filePathMock, storeConfigMock } from '../../test/mocks'
import { StoreConfigService } from './StoreConfigService'
import fs from 'fs'
import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import config from '../config'

jest.mock('../config', () => jest.fn())

describe('StoreConfigService', () => {
  let service: StoreConfigService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let mockConfig: jest.Mocked<any>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    service = new StoreConfigService(loggerMock)
    mockConfig = config as jest.Mocked<any>
  })

  describe('get', () => {
    it('(OK) returns correct stores if specified in env', async () => {
      mockConfig.mockReturnValue({
        stores: JSON.stringify(storeConfigMock),
      })

      const result = await service.get()
      expect(result).toEqual(storeConfigMock)
    })

    it('(OK) returns correct stores if valid file exists and no stores in env', async () => {
      mockConfig.mockReturnValue({
        storesFile: filePathMock,
      })

      jest
        .spyOn(fs.promises, 'readFile')
        .mockResolvedValueOnce(JSON.stringify(storeConfigMock))

      const result = await service.get()
      expect(result).toEqual(storeConfigMock)
      expect(fs.promises.readFile).toHaveBeenCalledWith(filePathMock)
    })

    it('(OK) returns correct stores if valid file exists and invalid json in env', async () => {
      mockConfig.mockReturnValue({
        storesFile: filePathMock,
        stores: 'invalid json',
      })

      jest
        .spyOn(fs.promises, 'readFile')
        .mockResolvedValueOnce(JSON.stringify(storeConfigMock))

      const result = await service.get()
      expect(result).toEqual(storeConfigMock)
      expect(fs.promises.readFile).toHaveBeenCalledWith(filePathMock)
    })

    it('(FAIL) returns empty object if cannot read file', async () => {
      jest.spyOn(fs.promises, 'readFile').mockImplementation(() => {
        throw new Error()
      })

      const result = await service.get()
      expect(result).toEqual({})
    })

    it('(FAIL) returns empty object if cannot parse JSON in file', async () => {
      jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('invalid json')
      const result = await service.get()
      expect(result).toEqual({})
    })
  })
})
