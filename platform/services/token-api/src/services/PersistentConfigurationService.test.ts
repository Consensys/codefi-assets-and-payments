import { PersistentConfigurationService } from './PersistentConfigurationService'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import { ContractRegistry, OrchestrateUtils } from '@codefi-assets-and-payments/nestjs-orchestrate'
import cfg from '../config'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { authTokenMock, createMockLogger } from '../../test/mocks'
import mockContractJson from '@codefi-assets-and-payments/contracts/build/contracts/CodefiERC20.json'

jest.setTimeout(20000)

const headersForPublicTenant =
  OrchestrateUtils.buildOrchestrateHeadersForPublicTenant()

export interface IContract {
  name: string
  tag: string
  abi: any[]
  bytecode: string
  deployedBytecode: string
}

describe('PersistentConfigurationService', () => {
  let service: PersistentConfigurationService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let contractRegistryMock: jest.Mocked<ContractRegistry>
  let m2mTokenServiceMock: jest.Mocked<M2mTokenService>

  beforeEach(() => {
    loggerMock = createMockLogger()
    contractRegistryMock = createMockInstance(ContractRegistry)
    m2mTokenServiceMock = createMockInstance(M2mTokenService)

    service = new PersistentConfigurationService(
      loggerMock,
      contractRegistryMock,
      m2mTokenServiceMock,
    )
  })

  describe('General', () => {
    it('perform initial configuration - register contracts', async () => {
      cfg().performInitialConfiguration = true
      cfg().contractsToRegister = ['CodefiERC20']
      m2mTokenServiceMock.createM2mToken.mockImplementationOnce(
        async () => authTokenMock,
      )
      await service.performConfiguration()
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledTimes(1)
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledWith('CodefiERC20', authTokenMock)
      expect(
        contractRegistryMock.registerNewContractVersion,
      ).toHaveBeenCalledTimes(1)
      expect(
        contractRegistryMock.registerNewContractVersion,
      ).toHaveBeenCalledWith(
        'CodefiERC20',
        expect.any(Object),
        authTokenMock,
        headersForPublicTenant,
      )
    })

    it('perform initial configuration - contract already registered', async () => {
      const contract: IContract = {
        name: 'CodefiERC20',
        tag: '0',
        abi: [],
        bytecode: '',
        deployedBytecode: mockContractJson.deployedBytecode,
      }
      contractRegistryMock.getContractByContractName.mockImplementationOnce(
        async () => contract,
      )
      m2mTokenServiceMock.createM2mToken.mockImplementationOnce(
        async () => authTokenMock,
      )
      cfg().performInitialConfiguration = true
      cfg().contractsToRegister = ['CodefiERC20']
      await service.performConfiguration()
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledTimes(1)
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledWith('CodefiERC20', authTokenMock)
      expect(
        contractRegistryMock.registerNewContractVersion,
      ).toHaveBeenCalledTimes(0)
    })

    it('should not perform initial configuration', async () => {
      cfg().performInitialConfiguration = false
      await service.performConfiguration()
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledTimes(0)
      expect(
        contractRegistryMock.registerNewContractVersion,
      ).toHaveBeenCalledTimes(0)
    })

    it('perform initial configuration - contract does not exist contracts pkg', async () => {
      jest.resetModules()
      const contractName = 'CodefiERC20'
      jest.doMock(
        `@codefi-assets-and-payments/contracts/build/contracts/${contractName}.json`,
        () => {
          return undefined
        },
      )
      cfg().performInitialConfiguration = true
      cfg().contractsToRegister = [contractName]
      await service.performConfiguration()
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledTimes(0)
      expect(
        contractRegistryMock.registerNewContractVersion,
      ).toHaveBeenCalledTimes(0)
    })
  })
})
