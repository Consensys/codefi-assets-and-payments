import { EntityStatus, TokenType } from '@consensys/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { Repository } from 'typeorm'
import {
  tenantIdMock,
  userIdMock,
  updateResultMock,
  tokenEntityMock,
  chainNameMock,
  entityIdMock,
  createMockLogger,
} from '../../test/mocks'
import { TokensService } from './TokensService'

describe('TokensService', () => {
  let service: TokensService
  let tokensRepoMock: jest.Mocked<Repository<any>>
  let loggerMock: jest.Mocked<NestJSPinoLogger>

  beforeEach(() => {
    loggerMock = createMockLogger()
    tokensRepoMock = createMockInstance(Repository)

    service = new TokensService(loggerMock, tokensRepoMock)
  })

  it('save token - success', async () => {
    tokensRepoMock.save.mockImplementationOnce(async () => tokenEntityMock)
    const result = await service.save(tokenEntityMock)

    expect(result).toBe(tokenEntityMock)
    expect(tokensRepoMock.save).toHaveBeenCalledTimes(1)
    expect(tokensRepoMock.save).toHaveBeenCalledWith({
      id: tokenEntityMock.id,
      type: TokenType.ERC20,
      status: EntityStatus.Pending,
      name: tokenEntityMock.name,
      symbol: tokenEntityMock.symbol,
      decimals: 18,
      deployerAddress: tokenEntityMock.deployerAddress,
      contractAddress: tokenEntityMock.contractAddress,
      operationId: expect.any(String),
      transactionId: expect.any(String),
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      createdBy: userIdMock,
      createdAt: expect.any(Date),
      chainName: chainNameMock,
    })
  })

  it('save token without id - success', async () => {
    const tokenEntityWithoutId = { ...tokenEntityMock, id: null }
    tokensRepoMock.save.mockImplementationOnce(async () => tokenEntityWithoutId)
    const result = await service.save(tokenEntityWithoutId)

    expect(result).toBe(tokenEntityWithoutId)
    expect(tokensRepoMock.save).toHaveBeenCalledTimes(1)
    expect(tokensRepoMock.save).toHaveBeenCalledWith({
      id: expect.any(String),
      type: TokenType.ERC20,
      status: EntityStatus.Pending,
      name: tokenEntityMock.name,
      symbol: tokenEntityMock.symbol,
      decimals: 18,
      deployerAddress: tokenEntityMock.deployerAddress,
      contractAddress: tokenEntityMock.contractAddress,
      operationId: expect.any(String),
      transactionId: expect.any(String),
      tenantId: tenantIdMock,
      entityId: entityIdMock,
      createdBy: userIdMock,
      createdAt: expect.any(Date),
      chainName: chainNameMock,
    })
  })

  it('update token - success', async () => {
    tokensRepoMock.update.mockImplementationOnce(async () => updateResultMock)

    const result = await service.update(
      { id: tokenEntityMock.id },
      tokenEntityMock,
    )

    expect(result).toBe(1)
    expect(tokensRepoMock.update).toHaveBeenCalledTimes(1)
    expect(tokensRepoMock.update).toHaveBeenCalledWith(
      { id: tokenEntityMock.id },
      {
        id: expect.any(String),
        type: TokenType.ERC20,
        status: EntityStatus.Pending,
        name: tokenEntityMock.name,
        symbol: tokenEntityMock.symbol,
        decimals: 18,
        deployerAddress: tokenEntityMock.deployerAddress,
        contractAddress: tokenEntityMock.contractAddress,
        operationId: expect.any(String),
        transactionId: expect.any(String),
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        createdBy: userIdMock,
        createdAt: expect.any(Date),
        chainName: chainNameMock,
      },
    )
  })

  it('find token by transactionId - success', async () => {
    tokensRepoMock.findOne.mockImplementationOnce(async () => tokenEntityMock)

    const result = await service.findTokenBy({
      transactionId: tokenEntityMock.transactionId,
    })

    expect(result).toBe(tokenEntityMock)
    expect(tokensRepoMock.findOne).toHaveBeenCalledTimes(1)
    expect(tokensRepoMock.findOne).toHaveBeenCalledWith({
      transactionId: tokenEntityMock.transactionId,
    })
  })

  it('find token by tokenId - success', async () => {
    tokensRepoMock.findOne.mockImplementationOnce(async () => tokenEntityMock)

    const result = await service.findById(tokenEntityMock.id)

    expect(result).toBe(tokenEntityMock)
    expect(tokensRepoMock.findOne).toHaveBeenCalledTimes(1)
    expect(tokensRepoMock.findOne).toHaveBeenCalledWith(tokenEntityMock.id)
  })

  describe('findTokenByIdOrAddress', () => {
    it('(OK) Finds and returns token by tokenEntityId', async () => {
      tokensRepoMock.findOne.mockResolvedValueOnce(tokenEntityMock)

      const tokenEntityId = 'tokenEntityId'

      const result = await service.findTokenByIdOrAddress({ tokenEntityId })

      expect(result).toBe(tokenEntityMock)
      expect(tokensRepoMock.findOne).toHaveBeenCalledTimes(1)
      expect(tokensRepoMock.findOne).toHaveBeenCalledWith(tokenEntityId)
    })

    it('(OK) Finds and returns token by contractAddress and chainName', async () => {
      tokensRepoMock.findOne.mockResolvedValueOnce(tokenEntityMock)

      const contractAddress = 'contractAddress'
      const chainName = 'chainName'

      const result = await service.findTokenByIdOrAddress({
        contractAddress,
        chainName,
      })

      expect(result).toBe(tokenEntityMock)
      expect(tokensRepoMock.findOne).toHaveBeenCalledTimes(1)
      expect(tokensRepoMock.findOne).toHaveBeenCalledWith({
        contractAddress,
        chainName,
      })
    })

    it.each([
      ['contractAddress', undefined],
      [undefined, 'chainName'],
    ])(
      '(ValidationException) when tokenEntityId=undefined and contractAddress=%s and chainName=%s',
      async (contractAddress, chainName) => {
        await expect(
          service.findTokenByIdOrAddress({ contractAddress, chainName }),
        ).rejects.toThrow(
          'Either tokenEntityId or (contractAddress and chainName) are required',
        )
      },
    )

    it('(EntityNotFoundException) when tokenEntityId does not return a token', async () => {
      tokensRepoMock.findOne.mockResolvedValueOnce(undefined)

      const tokenEntityId = 'tokenEntityId'

      await expect(
        service.findTokenByIdOrAddress({ tokenEntityId }),
      ).rejects.toThrow(`Token entity not found id=${tokenEntityId}`)
    })

    it('(EntityNotFoundException) when contractAddress and chainName do not return a token', async () => {
      tokensRepoMock.findOne.mockResolvedValueOnce(undefined)

      const contractAddress = 'contractAddress'
      const chainName = 'chainName'

      await expect(
        service.findTokenByIdOrAddress({ contractAddress, chainName }),
      ).rejects.toThrow(
        `Token entity not found contractAddress=${contractAddress} chainName=${chainName}`,
      )
    })
  })

  describe('getAll', () => {
    it('forward params to repository', async () => {
      tokensRepoMock.findAndCount.mockResolvedValueOnce([[tokenEntityMock], 1])

      const params = {
        skip: 10,
        take: 20,
        where: {
          transactionId: tokenEntityMock.transactionId,
        },
      }

      const result = await service.getAll(params)

      expect(result).toEqual([[tokenEntityMock], 1])
      expect(tokensRepoMock.findAndCount).toHaveBeenCalledTimes(1)
      expect(tokensRepoMock.findAndCount).toHaveBeenCalledWith(params)
    })
  })
})
