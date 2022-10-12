import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import cfg from '../config'
import config from '../config'
import { legalEntityMock, operationMock } from '../../test/mocks'
import { Repository } from 'typeorm'
import { LegalEntityEntity } from '../data/entities/LegalEntityEntity'
import { LegalEntityService } from './LegalEntityService'

describe('LegalEntityService', () => {
  let service: LegalEntityService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let repoMock: jest.Mocked<Repository<any>>

  beforeEach(() => {
    config().kafka.enabled = true
    loggerMock = createMockInstance(NestJSPinoLogger)
    repoMock = createMockInstance(Repository)
    service = new LegalEntityService(loggerMock, repoMock)
  })

  describe('LegalEntityService', () => {
    it('(OK) - it should create legal entity', async () => {
      const legalEntity: LegalEntityEntity = await service.create(
        legalEntityMock.id,
        legalEntityMock.legalEntityName,
        legalEntityMock.ethereumAddress,
        legalEntityMock.orchestrateChainName,
        legalEntityMock.tenantId,
        true,
        legalEntityMock.createdBy,
        legalEntityMock.createdAt,
        legalEntityMock.metadata,
      )

      expect(repoMock.save).toBeCalledTimes(1)
      expect(repoMock.save).toBeCalledWith(legalEntityMock)
    })

    it('(OK) - it should return a legal entity', async () => {
      repoMock.findOne.mockImplementationOnce(async () => legalEntityMock)

      const legalEntity: LegalEntityEntity = await service.findOne({
        id: legalEntityMock.id,
        tenantId: legalEntityMock.tenantId,
      })

      expect(repoMock.findOne).toBeCalledTimes(1)
      expect(repoMock.findOne).toBeCalledWith({
        id: legalEntityMock.id,
        tenantId: legalEntityMock.tenantId,
      })
    })

    it('(OK) - it should return all legal entity fora specific tenant- success', async () => {
      repoMock.find.mockImplementationOnce(async () => [legalEntityMock])

      const legalEntity: LegalEntityEntity[] = await service.findAll({
        id: legalEntityMock.id,
        tenantId: legalEntityMock.tenantId,
      })

      expect(repoMock.find).toBeCalledTimes(1)
      expect(repoMock.find).toBeCalledWith({
        id: legalEntityMock.id,
        tenantId: legalEntityMock.tenantId,
      })
    })

    it('(OK) - it should return if the entity exists', async () => {
      repoMock.findOne.mockImplementationOnce(async () => legalEntityMock)

      const entityExists = await service.existsLegalEntityWith({
        id: legalEntityMock.id,
        tenantId: legalEntityMock.tenantId,
      })

      expect(entityExists).toBeTruthy()
      expect(repoMock.findOne).toBeCalledTimes(1)
      expect(repoMock.findOne).toBeCalledWith({
        id: legalEntityMock.id,
        tenantId: legalEntityMock.tenantId,
      })
    })

    it('(OK) - it should update legal entity', async () => {
      const updateResult = {
        affected: 1,
      } as any
      repoMock.update.mockImplementationOnce(() => updateResult)
      const result = await service.update(
        { id: legalEntityMock.id },
        legalEntityMock,
      )

      expect(repoMock.update).toBeCalledTimes(1)
      expect(repoMock.update).toBeCalledWith(
        { id: legalEntityMock.id },
        legalEntityMock,
      )
      expect(result).toBe(1)
    })
  })
})
