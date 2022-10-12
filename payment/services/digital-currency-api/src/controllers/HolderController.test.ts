import { GoneException, HttpStatus } from '@nestjs/common'
import createMockInstance from 'jest-create-mock-instance'
import { addressMock, addressMock2, chainNameMock } from '../../test/mocks'
import { HolderService } from '../services/HolderService'
import { HolderController } from './HolderController'

describe('HolderController', () => {
  let controller: HolderController
  let serviceMock: jest.Mocked<HolderService>

  beforeEach(() => {
    serviceMock = createMockInstance(HolderService)
    controller = new HolderController(serviceMock)
  })

  describe('getAll', () => {
    it('throws - endpoint deprecated', async () => {
      const error = new GoneException(
        {
          status: HttpStatus.GONE,
          error: `Endpoint deprecated, use "/balance".`,
        },
        `Endpoint deprecated, use "/balance".`,
      )
      await expect(
        controller.getAll(addressMock, [addressMock2], 'chain'),
      ).rejects.toStrictEqual(error)
    })

    it('success - find balance calling the blockchain', async () => {
      await controller.getBalance(addressMock, addressMock2, chainNameMock)
      expect(serviceMock.findBalance).toHaveBeenCalledTimes(1)
      expect(serviceMock.findBalance).toHaveBeenCalledWith(
        addressMock,
        addressMock2,
        chainNameMock,
      )
    })
  })
})
