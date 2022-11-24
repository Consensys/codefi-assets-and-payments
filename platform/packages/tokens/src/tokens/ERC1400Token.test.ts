import { ContractManager } from '@consensys/nestjs-orchestrate'
import { createMockInstance } from 'jest-create-mock-instance'
import { uuidMock } from '../../test/mock'
import { ERC1400Token } from './ERC1400Token'

describe('ERC1400Token', () => {
  let contractManagerMock: jest.Mocked<ContractManager>

  beforeEach(() => {
    contractManagerMock = createMockInstance(ContractManager)

    contractManagerMock.deploy.mockImplementationOnce(async () => uuidMock)
    contractManagerMock.exec.mockImplementationOnce(async () => uuidMock)

    new ERC1400Token(contractManagerMock)
  })

  describe('create token', () => {
    it('success', async () => {
      expect(true)
    })
  })
})
