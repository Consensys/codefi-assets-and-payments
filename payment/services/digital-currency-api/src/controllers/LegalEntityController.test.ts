import createMockInstance from 'jest-create-mock-instance'

import { requestWithTenantIdAndEntityId, uuidMock } from '../../test/mocks'
import { LegalEntityController } from './LegalEntityController'
import { LegalEntityResponse } from '@consensys/ts-types'
import { LegalEntityService } from '../services/LegalEntityService'
import { LegalEntityEntity } from '../data/entities/LegalEntityEntity'

describe('LegalEntityController', () => {
  let legalEntityService: jest.Mocked<LegalEntityService>
  let controller: LegalEntityController

  beforeEach(() => {
    legalEntityService = createMockInstance(LegalEntityService)
    controller = new LegalEntityController(legalEntityService)
  })

  it('(OK) find all entities', async () => {
    const entities: LegalEntityEntity[] = [
      createMockInstance(LegalEntityEntity),
      createMockInstance(LegalEntityEntity),
    ]

    legalEntityService.findAll.mockResolvedValue(entities)
    const results = await controller.findAll(requestWithTenantIdAndEntityId)
    expect(results).toMatchObject(entities)
  })

  it(`(OK) GET find one legal entity`, async () => {
    const legalEntity: LegalEntityEntity = createMockInstance(LegalEntityEntity)

    legalEntityService.findOne.mockResolvedValue(legalEntity)

    const result: LegalEntityResponse = await controller.findById(
      uuidMock,
      requestWithTenantIdAndEntityId,
    )
    expect(result).toBe(legalEntity)
  })
})
