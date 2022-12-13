import { HolderService } from './HolderService'
import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  addressMock,
  addressMock2,
  chainNameMock,
  digitalCurrencyEntityMock,
  uuidMock,
} from '../../test/mocks'
import { M2mTokenService } from '@consensys/auth'
import {
  ChainRegistry,
  ContractRegistry,
} from '@consensys/nestjs-orchestrate'
import { DigitalCurrencyService } from './DigitalCurrencyService'
import { EntityStatus } from '@consensys/ts-types'

jest.mock('ethers')

describe('HolderService', () => {
  let service: HolderService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let m2mServiceMock: jest.Mocked<M2mTokenService>
  let orchestrateChainRegistryMock: jest.Mocked<ChainRegistry>
  let contractRegistryMock: jest.Mocked<ContractRegistry>
  let digitalCurrencyServiceMock: jest.Mocked<DigitalCurrencyService>
  let ethersMock
  let ethersProviderMock

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    orchestrateChainRegistryMock = createMockInstance(ChainRegistry)
    m2mServiceMock = createMockInstance(M2mTokenService)
    contractRegistryMock = createMockInstance(ContractRegistry)
    digitalCurrencyServiceMock = createMockInstance(DigitalCurrencyService)

    service = new HolderService(
      loggerMock,
      m2mServiceMock,
      orchestrateChainRegistryMock,
      contractRegistryMock,
      digitalCurrencyServiceMock,
    )

    ethersProviderMock = {
      getLogs: jest.fn(() => Promise.resolve([])),
      getTransaction: jest.fn(() => ({
        from: addressMock,
      })),
      getTransactionReceipt: jest.fn(() => ({})),
    }

    const contractMock = {
      callStatic: { balanceOf: jest.fn() },
    }

    ethersMock = require('ethers')

    ethersMock.ethers = {
      providers: {
        JsonRpcProvider: jest.fn(() => ethersProviderMock),
      },
      Contract: jest.fn(() => contractMock),
    }
  })

  describe('find holder balance on-chain', () => {
    it('success', async () => {
      orchestrateChainRegistryMock.getAllChains.mockImplementationOnce(
        async () => [
          {
            name: chainNameMock,
            urls: ['https://chain'],
            uuid: uuidMock,
            tenantID: '_',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      )
      contractRegistryMock.getContractByContractName.mockImplementationOnce(
        async () => {
          return {
            name: 'contractMock',
            tag: '0',
            abi: [''],
            bytecode: '',
            deployedBytecode: '',
          }
        },
      )

      digitalCurrencyServiceMock.findOneByAddressAndChainName.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )

      await service.findBalance(addressMock2, addressMock, chainNameMock)

      expect(
        digitalCurrencyServiceMock.findOneByAddressAndChainName,
      ).toHaveBeenCalledTimes(1)
      expect(
        digitalCurrencyServiceMock.findOneByAddressAndChainName,
      ).toHaveBeenCalledWith(addressMock, chainNameMock)
      expect(orchestrateChainRegistryMock.getAllChains).toHaveBeenCalledTimes(1)
      expect(orchestrateChainRegistryMock.getAllChains).toHaveBeenCalledWith(
        undefined,
      )
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledTimes(1)
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledWith('CodefiERC20', undefined)
      expect(loggerMock.warn).toHaveBeenCalledTimes(0)
      expect(loggerMock.error).toHaveBeenCalledTimes(0)
    })

    it('fails - contract not registered', async () => {
      orchestrateChainRegistryMock.getAllChains.mockImplementationOnce(
        async () => [
          {
            name: chainNameMock,
            urls: ['https://chain'],
            uuid: uuidMock,
            tenantID: '_',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      )
      digitalCurrencyServiceMock.findOneByAddressAndChainName.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )
      contractRegistryMock.getContractByContractName.mockReset()

      await service.findBalance(addressMock2, addressMock, chainNameMock)

      expect(
        digitalCurrencyServiceMock.findOneByAddressAndChainName,
      ).toHaveBeenCalledTimes(1)
      expect(
        digitalCurrencyServiceMock.findOneByAddressAndChainName,
      ).toHaveBeenCalledWith(addressMock, chainNameMock)

      expect(orchestrateChainRegistryMock.getAllChains).toHaveBeenCalledTimes(1)
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledTimes(1)
      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })

    it('fails - chain not found', async () => {
      orchestrateChainRegistryMock.getAllChains.mockImplementationOnce(
        async () => [],
      )
      digitalCurrencyServiceMock.findOneByAddressAndChainName.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )
      contractRegistryMock.getContractByContractName.mockReset()

      await expect(
        service.findBalance(addressMock2, addressMock, chainNameMock),
      ).rejects.toThrowError(
        `Chain is not registered for provided name=${chainNameMock}`,
      )

      expect(
        digitalCurrencyServiceMock.findOneByAddressAndChainName,
      ).toHaveBeenCalledTimes(1)
      expect(
        digitalCurrencyServiceMock.findOneByAddressAndChainName,
      ).toHaveBeenCalledWith(addressMock, chainNameMock)
      expect(orchestrateChainRegistryMock.getAllChains).toHaveBeenCalledTimes(1)
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledTimes(0)
    })

    it('fails - digital currency not found', async () => {
      const test = {
        ...digitalCurrencyEntityMock,
        status: EntityStatus.Pending,
      }

      digitalCurrencyServiceMock.findOneByAddressAndChainName.mockReset()
      digitalCurrencyServiceMock.findOneByAddressAndChainName.mockImplementationOnce(
        async () => test,
      )
      await expect(
        service.findBalance(addressMock2, addressMock, chainNameMock),
      ).rejects.toThrowError(`Digital currency not found`)

      expect(
        digitalCurrencyServiceMock.findOneByAddressAndChainName,
      ).toHaveBeenCalledTimes(1)
      expect(
        digitalCurrencyServiceMock.findOneByAddressAndChainName,
      ).toHaveBeenCalledWith(addressMock, chainNameMock)
      expect(loggerMock.warn).toHaveBeenCalledTimes(1)
      expect(orchestrateChainRegistryMock.getAllChains).toHaveBeenCalledTimes(0)
      expect(
        contractRegistryMock.getContractByContractName,
      ).toHaveBeenCalledTimes(0)
    })
  })
})
