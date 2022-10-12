import { TenantService } from './TenantService'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import { Repository } from 'typeorm'
import { updateResultMock, uuidMock } from '../../test/mocks'
import { TenantEntity } from '../data/entities/TenantEntity'

describe('TenantService', () => {
  let service: TenantService
  let logger: jest.Mocked<NestJSPinoLogger>
  let repositoryMock: jest.Mocked<Repository<any>>

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    repositoryMock = createMockInstance(Repository)

    service = new TenantService(logger, repositoryMock)
  })

  describe('create', () => {
    it('success', async () => {
      const entityToSave: TenantEntity = {
        id: uuidMock,
        name: 'name',
        metadata: '{}',
        defaultNetworkKey: 'networkkey',
        createdAt: expect.any(Date),
      }
      await service.create(uuidMock, 'name', '{}', 'networkkey')
      expect(repositoryMock.insert).toHaveBeenCalledTimes(1)
      expect(repositoryMock.insert).toHaveBeenCalledWith(entityToSave)
    })
  })

  describe('findOne', () => {
    it('success', async () => {
      const params: Partial<TenantEntity> = {
        id: uuidMock,
      }

      await service.findOne(params)
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findOne).toHaveBeenCalledWith(params)
    })
  })

  describe('update', () => {
    it('success', async () => {
      const params: Partial<TenantEntity> = {
        id: uuidMock,
      }
      const update: Partial<TenantEntity> = {
        name: 'newname',
      }
      repositoryMock.update.mockImplementationOnce(async () => updateResultMock)
      await service.update(params, update)
      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(params, update)
    })
  })

  describe('delete', () => {
    it('success', async () => {
      repositoryMock.delete.mockImplementationOnce(async () => updateResultMock)

      await service.delete('id1')
      expect(repositoryMock.delete).toHaveBeenCalledTimes(1)
      expect(repositoryMock.delete).toHaveBeenCalledWith({
        id: 'id1',
      })
    })
  })
})
