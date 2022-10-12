import { WalletType } from '@codefi-assets-and-payments/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Repository } from 'typeorm'
import { addressMock, updateResultMock, uuidMock } from '../../test/mocks'
import { EthereumAddressEntity } from '../data/entities/EthereumAddressEntity'
import { EthereumAddressService } from './EthereumAddressService'

describe('EthereumAddressService', () => {
  let service: EthereumAddressService
  let logger: jest.Mocked<NestJSPinoLogger>
  let repositoryMock: jest.Mocked<Repository<any>>

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    repositoryMock = createMockInstance(Repository)

    service = new EthereumAddressService(logger, repositoryMock)
  })

  describe('create', () => {
    it('success', async () => {
      await service.create(
        uuidMock,
        addressMock,
        WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        '{}',
      )

      expect(repositoryMock.save).toHaveBeenCalledTimes(1)
      expect(repositoryMock.save).toHaveBeenCalledWith({
        id: expect.any(String),
        entityId: uuidMock,
        address: addressMock,
        type: WalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        metadata: '{}',
        createdAt: expect.any(Date),
      })
    })
  })

  describe('findOne', () => {
    it('success', async () => {
      const params: Partial<EthereumAddressEntity> = {
        address: addressMock,
        entityId: uuidMock,
      }

      await service.findOne(params)
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findOne).toHaveBeenCalledWith(params)
    })
  })

  describe('findAndUpdate', () => {
    it('success', async () => {
      const params: Partial<EthereumAddressEntity> = {
        address: addressMock,
        entityId: uuidMock,
      }
      repositoryMock.update.mockImplementationOnce(
        async () => updateResultMock as any,
      )
      await service.findAndUpdate(params, 'newmetadata')

      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(params, {
        metadata: 'newmetadata',
      })
    })
  })

  describe('delete', () => {
    it('success', async () => {
      const params: Partial<EthereumAddressEntity> = {
        address: addressMock,
        entityId: uuidMock,
      }
      repositoryMock.delete.mockImplementationOnce(
        async () => updateResultMock as any,
      )

      await service.delete(params)
      expect(repositoryMock.delete).toHaveBeenCalledTimes(1)
      expect(repositoryMock.delete).toHaveBeenCalledWith(params)
    })
  })
})
