import { DigitalCurrencyService } from './DigitalCurrencyService'
import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import { Repository } from 'typeorm'
import { LegalEntityService } from './LegalEntityService'
import { OperationService } from './OperationService'
import { EventsService } from './EventsService'
import {
  addressMock,
  addressMock2,
  digitalCurrencyEntityMock,
  entityIdMock,
  ethereumAddressEntityMock,
  legalEntityMock,
  operationMock,
  subjectMock,
  tenantIdMock,
  uuidMock,
  walletsMock,
} from '../../test/mocks'
import { DigitalCurrencyEntity } from '../data/entities/DigitalCurrencyEntity'
import {
  EntityStatus,
  OperationType,
} from '@consensys/ts-types'
import { EthereumAddressService } from './EthereumAddressService'

describe('DigitalCurrencyService', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let repositoryMock: jest.Mocked<Repository<any>>
  let legalEntityServiceMock: jest.Mocked<LegalEntityService>
  let operationServiceMock: jest.Mocked<OperationService>
  let eventsServiceMock: jest.Mocked<EventsService>
  let ethereumAddressServiceMock: jest.Mocked<EthereumAddressService>

  let service: DigitalCurrencyService

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    legalEntityServiceMock = createMockInstance(LegalEntityService)
    operationServiceMock = createMockInstance(OperationService)
    eventsServiceMock = createMockInstance(EventsService)
    ethereumAddressServiceMock = createMockInstance(EthereumAddressService)
    repositoryMock = createMockInstance(Repository)
    legalEntityServiceMock.findOne.mockImplementationOnce(
      async () => legalEntityMock,
    )
    ethereumAddressServiceMock.findOne.mockImplementationOnce(
      async () => ethereumAddressEntityMock,
    )
    repositoryMock.findOne.mockReset()
    service = new DigitalCurrencyService(
      loggerMock,
      repositoryMock,
      legalEntityServiceMock,
      operationServiceMock,
      eventsServiceMock,
      ethereumAddressServiceMock,
    )
  })

  describe('create', () => {
    it('success', async () => {
      await service.create(
        'name',
        'symbol',
        18,
        tenantIdMock,
        subjectMock,
        EntityStatus.Pending,
        entityIdMock,
      )

      const expectedEntity: DigitalCurrencyEntity = {
        id: expect.any(String),
        name: 'name',
        symbol: 'symbol',
        decimals: 18,
        deployerAddress: legalEntityMock.ethereumAddress,
        createdBy: subjectMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        status: EntityStatus.Pending,
        operationId: expect.any(String),
        totalMinted: '0x0',
        totalBurnt: '0x0',
        chainName: legalEntityMock.orchestrateChainName,
      }

      expect(repositoryMock.save).toHaveBeenCalledTimes(1)
      expect(repositoryMock.save).toHaveBeenCalledWith(expectedEntity)
      expect(operationServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.create).toHaveBeenCalledWith(
        OperationType.Creation,
        EntityStatus.Pending,
        legalEntityMock.orchestrateChainName,
        '0x0',
        legalEntityMock.ethereumAddress,
        expect.any(String),
        tenantIdMock,
        entityIdMock,
        subjectMock,
      )
      expect(eventsServiceMock.emitDeployTokenCommand).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitDeployTokenCommand).toHaveBeenCalledWith(
        'name',
        'symbol',
        18,
        expect.any(String),
        legalEntityMock.ethereumAddress,
        legalEntityMock.orchestrateChainName,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
    })

    it('throws - failt to emit event, operation set to failed', async () => {
      eventsServiceMock.emitDeployTokenCommand.mockReset()
      eventsServiceMock.emitDeployTokenCommand.mockImplementationOnce(
        async () => {
          throw Error('errorMessageMock')
        },
      )

      try {
        await service.create(
          'name',
          'symbol',
          18,
          tenantIdMock,
          subjectMock,
          EntityStatus.Pending,
          entityIdMock,
        )
      } catch (e) {
        expect(loggerMock.error).toHaveBeenCalledTimes(1)
        expect(operationServiceMock.update).toHaveBeenCalledTimes(1)
        expect(operationServiceMock.update).toHaveBeenCalledWith(
          { id: expect.any(String) },
          { status: EntityStatus.Failed },
        )
      }
    })

    it('success - ethereum address specified', async () => {
      legalEntityServiceMock.findOne.mockReset()
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )
      await service.create(
        'name',
        'symbol',
        18,
        tenantIdMock,
        subjectMock,
        EntityStatus.Pending,
        entityIdMock,
        addressMock,
      )

      const expectedEntity: DigitalCurrencyEntity = {
        id: expect.any(String),
        name: 'name',
        symbol: 'symbol',
        decimals: 18,
        deployerAddress: addressMock,
        createdBy: subjectMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        status: EntityStatus.Pending,
        operationId: expect.any(String),
        totalMinted: '0x0',
        totalBurnt: '0x0',
        chainName: legalEntityMock.orchestrateChainName,
      }

      expect(repositoryMock.save).toHaveBeenCalledTimes(1)
      expect(repositoryMock.save).toHaveBeenCalledWith(expectedEntity)
      expect(operationServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.create).toHaveBeenCalledWith(
        OperationType.Creation,
        EntityStatus.Pending,
        legalEntityMock.orchestrateChainName,
        '0x0',
        addressMock,
        expect.any(String),
        tenantIdMock,
        entityIdMock,
        subjectMock,
      )
      expect(eventsServiceMock.emitDeployTokenCommand).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitDeployTokenCommand).toHaveBeenCalledWith(
        'name',
        'symbol',
        18,
        expect.any(String),
        addressMock,
        legalEntityMock.orchestrateChainName,
        subjectMock,
        tenantIdMock,
        entityIdMock,
      )
    })

    it('success - ethereum address specified - not found', async () => {
      ethereumAddressServiceMock.findOne.mockReset()
      legalEntityServiceMock.findOne.mockReset()
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )
      await expect(
        service.create(
          'name',
          'symbol',
          18,
          tenantIdMock,
          subjectMock,
          EntityStatus.Pending,
          entityIdMock,
          addressMock,
        ),
      ).rejects.toThrowError(
        `Entity id=${legalEntityMock.id} can't act on behalf of ethereum address=${addressMock}`,
      )
    })

    it('entity not found', async () => {
      legalEntityServiceMock.findOne.mockReset()
      legalEntityServiceMock.findOne.mockImplementationOnce(() => {
        throw new Error(
          `Entity id=${entityIdMock} not registered for tenantId=${tenantIdMock}`,
        )
      })

      await expect(
        service.create(
          'name',
          'symbol',
          18,
          tenantIdMock,
          subjectMock,
          EntityStatus.Pending,
          undefined,
        ),
      ).rejects.toThrowError(
        `Entity id=${entityIdMock} not registered for tenantId=${tenantIdMock}`,
      )

      expect(repositoryMock.save).toHaveBeenCalledTimes(0)
      expect(eventsServiceMock.emitDeployTokenCommand).toHaveBeenCalledTimes(0)
    })
  })

  describe('save', () => {
    it('success', async () => {
      await service.save(
        'name',
        'symbol',
        3,
        EntityStatus.Pending,
        addressMock,
        addressMock2,
        'chainName',
      )
      const expectedEntity: DigitalCurrencyEntity = {
        id: expect.any(String),
        name: 'name',
        symbol: 'symbol',
        status: EntityStatus.Pending,
        currencyEthereumAddress: addressMock,
        deployerAddress: addressMock2,
        decimals: 3,
        chainName: 'chainName',
        totalMinted: '0x0',
        totalBurnt: '0x0',
        createdAt: expect.any(Date),
      }

      expect(repositoryMock.save).toHaveBeenCalledTimes(1)
      expect(repositoryMock.save).toHaveBeenCalledWith(expectedEntity)
    })
  })

  describe('transfer', () => {
    it('success', async () => {
      operationServiceMock.create.mockImplementationOnce(
        async () => operationMock,
      )
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )

      await service.transfer(
        digitalCurrencyEntityMock.id,
        '0x1',
        addressMock,
        tenantIdMock,
        subjectMock,
        entityIdMock,
      )
      expect(operationServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.create).toHaveBeenCalledWith(
        OperationType.Transfer,
        EntityStatus.Pending,
        legalEntityMock.orchestrateChainName,
        '0x1',
        legalEntityMock.ethereumAddress,
        expect.anything(),
        legalEntityMock.tenantId,
        entityIdMock,
        subjectMock,
        legalEntityMock.ethereumAddress,
        addressMock,
        digitalCurrencyEntityMock.currencyEthereumAddress,
      )
      expect(eventsServiceMock.emitTransferTokenCommand).toHaveBeenCalledTimes(
        1,
      )
    })

    it('throws - fail to emit event, operation set to failed', async () => {
      operationServiceMock.create.mockImplementationOnce(
        async () => operationMock,
      )
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )
      eventsServiceMock.emitTransferTokenCommand.mockReset()
      eventsServiceMock.emitTransferTokenCommand.mockImplementationOnce(
        async () => {
          throw Error('errorMessageMock')
        },
      )

      try {
        await service.transfer(
          digitalCurrencyEntityMock.id,
          '0x1',
          addressMock,
          tenantIdMock,
          subjectMock,
          entityIdMock,
        )
      } catch (e) {
        expect(loggerMock.error).toHaveBeenCalledTimes(1)
        expect(operationServiceMock.update).toHaveBeenCalledTimes(1)
        expect(operationServiceMock.update).toHaveBeenCalledWith(
          { id: expect.any(String) },
          { status: EntityStatus.Failed },
        )
      }
    })

    it('success - ethereum address specified', async () => {
      legalEntityServiceMock.findOne.mockReset()
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )

      await service.transfer(
        digitalCurrencyEntityMock.id,
        '0x1',
        addressMock,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        addressMock,
      )
      expect(operationServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.create).toHaveBeenCalledWith(
        OperationType.Transfer,
        EntityStatus.Pending,
        legalEntityMock.orchestrateChainName,
        '0x1',
        addressMock,
        expect.anything(),
        legalEntityMock.tenantId,
        entityIdMock,
        subjectMock,
        legalEntityMock.ethereumAddress,
        addressMock,
        digitalCurrencyEntityMock.currencyEthereumAddress,
      )
      expect(eventsServiceMock.emitTransferTokenCommand).toHaveBeenCalledTimes(
        1,
      )
    })
  })

  describe('mint', () => {
    it('success', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )
      await service.mint(
        uuidMock,
        '0x7',
        addressMock,
        tenantIdMock,
        subjectMock,
        entityIdMock,
      )

      expect(operationServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.create).toHaveBeenCalledWith(
        OperationType.Mint,
        EntityStatus.Pending,
        digitalCurrencyEntityMock.chainName,
        '0x7',
        legalEntityMock.ethereumAddress,
        expect.any(String),
        tenantIdMock,
        entityIdMock,
        subjectMock,
        undefined,
        addressMock,
        digitalCurrencyEntityMock.currencyEthereumAddress,
      )
    })

    it('throws - fail to emit event, operation set to failed', async () => {
      eventsServiceMock.emitMintTokenCommand.mockReset()
      eventsServiceMock.emitMintTokenCommand.mockImplementationOnce(
        async () => {
          throw Error('errorMessageMock')
        },
      )
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )

      try {
        await service.mint(
          uuidMock,
          '0x7',
          addressMock,
          tenantIdMock,
          subjectMock,
          entityIdMock,
        )
      } catch (e) {
        expect(loggerMock.error).toHaveBeenCalledTimes(1)
        expect(operationServiceMock.update).toHaveBeenCalledTimes(1)
        expect(operationServiceMock.update).toHaveBeenCalledWith(
          { id: expect.any(String) },
          { status: EntityStatus.Failed },
        )
      }
    })

    it('success - ethereum address specified', async () => {
      legalEntityServiceMock.findOne.mockReset()
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )
      operationServiceMock.create.mockImplementationOnce(
        async () => operationMock,
      )
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )
      await service.mint(
        uuidMock,
        '0x7',
        addressMock,
        tenantIdMock,
        subjectMock,
        entityIdMock,
        addressMock,
      )

      expect(operationServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.create).toHaveBeenCalledWith(
        OperationType.Mint,
        EntityStatus.Pending,
        digitalCurrencyEntityMock.chainName,
        '0x7',
        addressMock,
        expect.any(String),
        tenantIdMock,
        entityIdMock,
        subjectMock,
        undefined,
        addressMock,
        digitalCurrencyEntityMock.currencyEthereumAddress,
      )
    })

    it('currency not mined yet', async () => {
      const currencyNotMined = {
        ...digitalCurrencyEntityMock,
        currencyEthereumAddress: undefined,
      }
      repositoryMock.findOne.mockReset()
      repositoryMock.findOne.mockImplementationOnce(
        async () => currencyNotMined,
      )
      await expect(
        service.mint(
          uuidMock,
          '0x7',
          addressMock,
          tenantIdMock,
          subjectMock,
          entityIdMock,
        ),
      ).rejects.toThrowError(
        `Digital currency does not have ethereum address yet, currencyId=${uuidMock}`,
      )
    })
    it('minter is not the deployer', async () => {
      const currency: DigitalCurrencyEntity = {
        ...digitalCurrencyEntityMock,
        deployerAddress: addressMock2,
      }
      repositoryMock.findOne.mockReset()
      repositoryMock.findOne.mockImplementationOnce(async () => currency)
      await expect(
        service.mint(
          uuidMock,
          '0x7',
          addressMock,
          tenantIdMock,
          subjectMock,
          entityIdMock,
        ),
      ).rejects.toThrowError(
        `Cannot mint a currency if the user (address=${addressMock}) is not the deployer (deployer=${addressMock2})`,
      )
    })
  })

  describe('findOneById', () => {
    it('success', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )
      await service.findOneById(uuidMock, tenantIdMock)
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        id: uuidMock,
        tenantId: tenantIdMock,
      })
    })
    it('not found', async () => {
      await expect(
        service.findOneById(uuidMock, tenantIdMock),
      ).rejects.toThrowError(
        `Digital currency not found id=${uuidMock} and tenantId=${tenantIdMock}`,
      )
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        id: uuidMock,
        tenantId: tenantIdMock,
      })
    })
  })

  describe('findOneByAddressAndChainName', () => {
    it('success', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )
      await service.findOneByAddressAndChainName(addressMock, 'chainName')
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        currencyEthereumAddress: addressMock,
        chainName: 'chainName',
      })
    })
    it('not found', async () => {
      const result = await service.findOneByAddressAndChainName(
        addressMock,
        'chainName',
      )
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        currencyEthereumAddress: addressMock,
        chainName: 'chainName',
      })
      expect(result).toBeUndefined()
    })
  })

  describe('updateByOperationId', () => {
    it('success', async () => {
      const resultMock = {
        affected: 1,
      } as any
      repositoryMock.update.mockImplementationOnce(async () => resultMock)
      const update = { currencyEthereumAddress: addressMock }
      const result = await service.updateByOperationId(uuidMock, update)
      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(
        { operationId: uuidMock },
        update,
      )
      expect(result).toBe(resultMock.affected)
    })
  })

  describe('updateById', () => {
    it('success', async () => {
      const resultMock = {
        affected: 1,
      } as any
      repositoryMock.update.mockImplementationOnce(async () => resultMock)
      const update = { id: uuidMock }
      const result = await service.updateById(uuidMock, update)
      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(
        { id: uuidMock },
        update,
      )
      expect(result).toBe(resultMock.affected)
    })
  })
  describe('findAll', () => {
    it('success', async () => {
      await service.findAll(tenantIdMock)
      expect(repositoryMock.find).toHaveBeenCalledTimes(1)
      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: { tenantId: tenantIdMock },
        order: {
          createdAt: 'DESC',
        },
      })
    })
  })

  describe('computeOperation', () => {
    it('success - type mint', async () => {
      const currencyWithMintedValue = {
        ...digitalCurrencyEntityMock,
        totalMinted: '0x1',
      }
      const updateResult = {
        affected: 1,
      } as any
      repositoryMock.findOne.mockImplementationOnce(
        async () => currencyWithMintedValue,
      )
      repositoryMock.update.mockImplementationOnce(async () => updateResult)
      await service.computeOperation(operationMock)

      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(
        {
          id: currencyWithMintedValue.id,
        },
        {
          totalMinted: '0xb',
        },
      )
    })
    it('success - type burn', async () => {
      const currencyWithBurntValue = {
        ...digitalCurrencyEntityMock,
        totalBurnt: '0xb',
      }
      const updateResult = {
        affected: 1,
      } as any
      repositoryMock.findOne.mockImplementationOnce(
        async () => currencyWithBurntValue,
      )
      repositoryMock.update.mockImplementationOnce(async () => updateResult)
      await service.computeOperation({
        ...operationMock,
        operationType: OperationType.Burn,
      })

      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(
        {
          id: currencyWithBurntValue.id,
        },
        {
          totalBurnt: '0x15',
        },
      )
    })
    it('not supported type - no action', async () => {
      await service.computeOperation({
        ...operationMock,
        operationType: OperationType.Transfer,
      })

      expect(repositoryMock.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('burn', () => {
    it('success', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )

      await service.burn(
        uuidMock,
        '0x2',
        tenantIdMock,
        subjectMock,
        entityIdMock,
        undefined,
      )

      expect(operationServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.create).toHaveBeenCalledWith(
        OperationType.Burn,
        EntityStatus.Pending,
        digitalCurrencyEntityMock.chainName,
        '0x2',
        legalEntityMock.ethereumAddress,
        expect.any(String),
        tenantIdMock,
        entityIdMock,
        subjectMock,
        legalEntityMock.ethereumAddress,
        undefined,
        digitalCurrencyEntityMock.currencyEthereumAddress,
      )
    })

    it('throws - fail to emit event, operation set to failed', async () => {
      eventsServiceMock.emitBurnTokenCommand.mockReset()
      eventsServiceMock.emitBurnTokenCommand.mockImplementationOnce(
        async () => {
          throw Error('errorMessageMock')
        },
      )
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )
      try {
        await service.burn(
          uuidMock,
          '0x2',
          tenantIdMock,
          subjectMock,
          entityIdMock,
          undefined,
        )
      } catch (e) {
        expect(loggerMock.error).toHaveBeenCalledTimes(1)
        expect(operationServiceMock.update).toHaveBeenCalledTimes(1)
        expect(operationServiceMock.update).toHaveBeenCalledWith(
          { id: expect.any(String) },
          { status: EntityStatus.Failed },
        )
      }
    })

    it('success - ethereum address specified', async () => {
      legalEntityServiceMock.findOne.mockReset()
      legalEntityServiceMock.findOne.mockImplementationOnce(
        async () => legalEntityMock,
      )
      repositoryMock.findOne.mockImplementationOnce(
        async () => digitalCurrencyEntityMock,
      )

      await service.burn(
        uuidMock,
        '0x2',
        tenantIdMock,
        subjectMock,
        entityIdMock,
        addressMock,
      )

      expect(operationServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.create).toHaveBeenCalledWith(
        OperationType.Burn,
        EntityStatus.Pending,
        digitalCurrencyEntityMock.chainName,
        '0x2',
        addressMock,
        expect.any(String),
        tenantIdMock,
        entityIdMock,
        subjectMock,
        legalEntityMock.ethereumAddress,
        undefined,
        digitalCurrencyEntityMock.currencyEthereumAddress,
      )
    })

    it('currency not mined yet', async () => {
      const currencyNotMined = {
        ...digitalCurrencyEntityMock,
        currencyEthereumAddress: undefined,
      }
      repositoryMock.findOne.mockReset()
      repositoryMock.findOne.mockImplementationOnce(
        async () => currencyNotMined,
      )
      await expect(
        service.burn(uuidMock, '0x7', tenantIdMock, subjectMock, entityIdMock),
      ).rejects.toThrowError(
        `Digital currency does not have ethereum address yet, currencyId=${uuidMock}`,
      )
    })
  })
})
