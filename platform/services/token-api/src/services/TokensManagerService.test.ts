import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import {
  addressMock,
  amountMock,
  chainNameMock,
  contractAddressMock,
  operationEntityMock,
  recipientMock,
  senderMock,
  subjectMock,
  tenantIdMock,
  tokenEntityMock,
  token721EntityMock,
  tokenIdMock,
  tokensDeployRequestMock,
  userIdMock,
  uuidMock,
  idempotencyKeyMock,
  authTokenMock,
  authHeadersMock,
  entityIdMock,
  tokensRegisterRequestMock,
  uriMock,
  transactionIdMock,
  operationIdMock,
  createMockLogger,
} from '../../test/mocks'
import { ERC20Service } from './ERC20Service'
import { ERC721Service } from './ERC721Service'
import { TokensManagerService } from './TokensManagerService'
import { NotFoundException } from '@nestjs/common'
import {
  ITransactionConfig,
  TransactionConfigBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { EntityStatus, TokenType, TokenOperationType } from '@codefi-assets-and-payments/ts-types'
import { TokensService } from './TokensService'
import { ValidationException } from '@codefi-assets-and-payments/error-handler'
import { OperationsService } from './OperationsService'
import { OperationEntity } from '../data/entities/OperationEntity'

describe('TokensManagerService', () => {
  let service: TokensManagerService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let erc20ServiceMock: jest.Mocked<ERC20Service>
  let erc721ServiceMock: jest.Mocked<ERC721Service>
  let tokensServiceMock: jest.Mocked<TokensService>
  let operationsServiceMock: jest.Mocked<OperationsService>

  beforeEach(() => {
    loggerMock = createMockLogger()
    erc20ServiceMock = createMockInstance(ERC20Service)
    erc721ServiceMock = createMockInstance(ERC721Service)
    tokensServiceMock = createMockInstance(TokensService)
    operationsServiceMock = createMockInstance(OperationsService)

    service = new TokensManagerService(
      loggerMock,
      erc20ServiceMock,
      erc721ServiceMock,
      tokensServiceMock,
      operationsServiceMock,
    )

    operationsServiceMock.getAll.mockResolvedValue([[], 0])
    operationsServiceMock.create.mockResolvedValue(operationEntityMock)
    tokensServiceMock.findTokenByIdOrAddress.mockResolvedValue(tokenEntityMock)
  })

  const throwsIfOperationExistsForTransaction = async (
    callService: (transactionId) => void,
  ) => {
    operationsServiceMock.findOperationByTransactionId.mockResolvedValueOnce(
      operationEntityMock,
    )

    await expect(callService(transactionIdMock)).rejects.toThrowError(
      `Transaction already has an operation record - Transaction ID: ${transactionIdMock} | Existing Operation ID: ${operationEntityMock.id}`,
    )
  }

  describe('mint', () => {
    const operationId = 'saas'

    it('mint a erc20 token - success', async () => {
      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        senderMock,
      )
        .to(tokenEntityMock.contractAddress)
        .chainName(chainNameMock)
        .build()

      erc20ServiceMock.mint.mockResolvedValueOnce(transactionIdMock)

      await service.mint(
        TokenType.ERC20,
        senderMock,
        amountMock,
        tenantIdMock,
        subjectMock,
        txConfig,
        operationId,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(erc721ServiceMock.mint).toHaveBeenCalledTimes(0)
      expect(erc20ServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(erc20ServiceMock.mint).toHaveBeenCalledWith(
        senderMock,
        amountMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationId,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId,
        operationType: TokenOperationType.Mint,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('mint a erc721 token - success', async () => {
      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        senderMock,
      )
        .to(tokenEntityMock.contractAddress)
        .chainName(chainNameMock)
        .build()

      erc721ServiceMock.mint.mockResolvedValueOnce(transactionIdMock)

      await service.mint(
        TokenType.ERC721,
        senderMock,
        tokenIdMock,
        tenantIdMock,
        subjectMock,
        txConfig,
        operationId,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(erc20ServiceMock.mint).toHaveBeenCalledTimes(0)
      expect(erc721ServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(erc721ServiceMock.mint).toHaveBeenCalledWith(
        senderMock,
        tokenIdMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationId,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId,
        operationType: TokenOperationType.Mint,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('unknown token', async () => {
      let thrownError: NotFoundException
      try {
        const txConfig: ITransactionConfig =
          TransactionConfigBuilder.get(senderMock).build()

        await service.mint(
          TokenType.DVP,
          senderMock,
          amountMock,
          tenantIdMock,
          subjectMock,
          txConfig,
          operationId,
          tokenEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        )
      } catch (err) {
        thrownError = err
      }
      expect(thrownError.getStatus()).toBe(404)
      expect(erc20ServiceMock.mint).toHaveBeenCalledTimes(0)
      expect(erc721ServiceMock.mint).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('does nothing if operation ID already exists', async () => {
      operationsServiceMock.getAll.mockResolvedValueOnce([
        [operationEntityMock],
        1,
      ])

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        senderMock,
      )
        .chainName(chainNameMock)
        .build()

      const result = await service.mint(
        TokenType.ERC20,
        senderMock,
        amountMock,
        tenantIdMock,
        subjectMock,
        txConfig,
        operationId,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(result).toEqual(operationEntityMock)
      expect(erc721ServiceMock.mint).toHaveBeenCalledTimes(0)
      expect(erc20ServiceMock.mint).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('throws if operation already exists for transaction', async () => {
      await throwsIfOperationExistsForTransaction(async (transactionId) => {
        erc20ServiceMock.mint.mockResolvedValueOnce(transactionId)

        const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
          senderMock,
        )
          .chainName(chainNameMock)
          .build()

        await service.mint(
          TokenType.ERC20,
          senderMock,
          amountMock,
          tenantIdMock,
          subjectMock,
          txConfig,
          operationIdMock,
          tokenEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        )
      })
    })
  })

  describe('deploy', () => {
    it('confidential token not implemented - throws', async () => {
      await expect(
        service.deploy(
          {
            ...tokensDeployRequestMock,
            confidential: true,
          },
          tenantIdMock,
          entityIdMock,
          userIdMock,
          authTokenMock,
          authHeadersMock,
        ),
      ).rejects.toThrowError('Confidential token not implemented')

      expect(erc20ServiceMock.deploy).toHaveBeenCalledTimes(0)
      expect(erc721ServiceMock.deploy).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
      expect(tokensServiceMock.save).toHaveBeenCalledTimes(0)
    })

    it('deploy implemented token - success', async () => {
      erc20ServiceMock.deploy.mockResolvedValueOnce(uuidMock)
      operationsServiceMock.create.mockResolvedValueOnce(operationEntityMock)
      tokensServiceMock.save.mockResolvedValueOnce(tokenEntityMock)

      const result = await service.deploy(
        tokensDeployRequestMock,
        tenantIdMock,
        entityIdMock,
        userIdMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toStrictEqual({
        token: tokenEntityMock,
        operation: operationEntityMock,
      })
      expect(erc721ServiceMock.deploy).toHaveBeenCalledTimes(0)
      expect(erc20ServiceMock.deploy).toHaveBeenCalledWith(
        tokensDeployRequestMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(operationsServiceMock.create).toBeCalledWith({
        operationId: tokensDeployRequestMock.operationId,
        operationType: TokenOperationType.Deploy,
        transactionId: uuidMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: tokensDeployRequestMock.config.chainName,
        createdBy: userIdMock,
      })
      expect(tokensServiceMock.save).toHaveBeenCalledWith({
        id: undefined,
        name: tokensDeployRequestMock.name,
        symbol: tokensDeployRequestMock.symbol,
        decimals: tokensDeployRequestMock.decimals,
        status: EntityStatus.Pending,
        type: tokensDeployRequestMock.type,
        chainName: tokensDeployRequestMock.config.chainName,
        deployerAddress: tokensDeployRequestMock.config.from,
        operationId: uuidMock,
        transactionId: uuidMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        createdBy: userIdMock,
        createdAt: expect.any(Date),
      })
    })

    it('deploy not implemented token - throws', async () => {
      await expect(
        service.deploy(
          {
            ...tokensDeployRequestMock,
            type: TokenType.DVP,
          },
          tenantIdMock,
          entityIdMock,
          userIdMock,
          authTokenMock,
          authHeadersMock,
        ),
      ).rejects.toThrowError(`tokenType=${TokenType.DVP} is not implemented`)

      expect(erc20ServiceMock.deploy).toHaveBeenCalledTimes(0)
      expect(erc721ServiceMock.deploy).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
      expect(tokensServiceMock.save).toHaveBeenCalledTimes(0)
    })

    it('does nothing if operation ID already exists', async () => {
      operationsServiceMock.getAll.mockResolvedValueOnce([
        [operationEntityMock],
        1,
      ])

      tokensServiceMock.getAll.mockResolvedValueOnce([[tokenEntityMock], 1])

      const result = await service.deploy(
        { ...tokensDeployRequestMock, operationId: operationIdMock },
        tenantIdMock,
        entityIdMock,
        userIdMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toEqual({
        token: tokenEntityMock,
        operation: operationEntityMock,
      })
      expect(erc721ServiceMock.deploy).toHaveBeenCalledTimes(0)
      expect(erc20ServiceMock.deploy).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
      expect(tokensServiceMock.save).toHaveBeenCalledTimes(0)
    })

    it('throws if operation already exists for transaction', async () => {
      await throwsIfOperationExistsForTransaction(async (transactionId) => {
        erc20ServiceMock.deploy.mockResolvedValueOnce(transactionId)

        await service.deploy(
          { ...tokensDeployRequestMock, operationId: operationIdMock },
          tenantIdMock,
          entityIdMock,
          userIdMock,
          authTokenMock,
          authHeadersMock,
        )
      })
    })
  })

  describe('register', () => {
    it('register token - success', async () => {
      const constructorParams = {
        name: 'token_name',
        symbol: 'smd',
        decimals: 18,
      }
      erc20ServiceMock.contractConstructorParams.mockResolvedValueOnce(
        constructorParams,
      )

      operationsServiceMock.create.mockResolvedValueOnce({
        id: uuidMock,
      } as OperationEntity)

      await service.register(
        tokensRegisterRequestMock,
        tenantIdMock,
        entityIdMock,
        userIdMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(erc20ServiceMock.contractConstructorParams).toHaveBeenCalledWith(
        tokensRegisterRequestMock.contractAddress,
        tokensRegisterRequestMock.config,
        authTokenMock,
        authHeadersMock,
      )
      expect(erc721ServiceMock.contractConstructorParams).toHaveBeenCalledTimes(
        0,
      )
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId: undefined,
        operationType: TokenOperationType.Register,
        status: EntityStatus.Confirmed,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: tokensRegisterRequestMock.config.chainName,
        createdBy: userIdMock,
      })
      expect(tokensServiceMock.save).toHaveBeenCalledWith({
        id: undefined,
        name: constructorParams.name,
        symbol: constructorParams.symbol,
        decimals: constructorParams.decimals,
        status: EntityStatus.Confirmed,
        type: tokensRegisterRequestMock.type,
        chainName: tokensRegisterRequestMock.config.chainName,
        deployerAddress: tokensRegisterRequestMock.config.from,
        contractAddress: tokensRegisterRequestMock.contractAddress,
        operationId: uuidMock,
        transactionId: null,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        createdBy: userIdMock,
        createdAt: expect.any(Date),
      })
    })

    it('register not implemented token - throws', async () => {
      await expect(
        service.register(
          {
            ...tokensRegisterRequestMock,
            type: TokenType.DVP,
          },
          tenantIdMock,
          entityIdMock,
          userIdMock,
          authTokenMock,
          authHeadersMock,
        ),
      ).rejects.toThrowError(`tokenType=${TokenType.DVP} is not implemented`)

      expect(erc20ServiceMock.contractConstructorParams).toHaveBeenCalledTimes(
        0,
      )
      expect(erc721ServiceMock.contractConstructorParams).toHaveBeenCalledTimes(
        0,
      )
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
      expect(tokensServiceMock.save).toHaveBeenCalledTimes(0)
    })

    it('contract constructor params not compatible - throws', async () => {
      erc20ServiceMock.contractConstructorParams.mockRejectedValueOnce(
        new Error(),
      )

      await expect(
        service.register(
          tokensRegisterRequestMock,
          tenantIdMock,
          entityIdMock,
          userIdMock,
          authTokenMock,
          authHeadersMock,
        ),
      ).rejects.toThrowError(
        `Contract address ${tokensRegisterRequestMock.contractAddress} does not match a ${tokensRegisterRequestMock.type}`,
      )

      expect(erc20ServiceMock.contractConstructorParams).toHaveBeenCalledWith(
        tokensRegisterRequestMock.contractAddress,
        tokensRegisterRequestMock.config,
        authTokenMock,
        authHeadersMock,
      )
      expect(erc721ServiceMock.contractConstructorParams).toHaveBeenCalledTimes(
        0,
      )
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
      expect(tokensServiceMock.save).toHaveBeenCalledTimes(0)
    })

    it('does nothing if operation ID already exists', async () => {
      operationsServiceMock.getAll.mockResolvedValueOnce([
        [operationEntityMock],
        1,
      ])

      tokensServiceMock.getAll.mockResolvedValueOnce([[tokenEntityMock], 1])

      await service.register(
        { ...tokensRegisterRequestMock, operationId: operationIdMock },
        tenantIdMock,
        entityIdMock,
        userIdMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(erc721ServiceMock.contractConstructorParams).toHaveBeenCalledTimes(
        0,
      )
      expect(erc20ServiceMock.contractConstructorParams).toHaveBeenCalledTimes(
        0,
      )
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
      expect(tokensServiceMock.save).toHaveBeenCalledTimes(0)
    })
  })

  describe('transfer', () => {
    const operationId = 'saas'
    it('transfer a erc20 token - success', async () => {
      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        senderMock,
      )
        .to(tokenEntityMock.contractAddress)
        .chainName(chainNameMock)
        .build()

      erc20ServiceMock.transfer.mockResolvedValueOnce(transactionIdMock)

      await service.transfer(
        TokenType.ERC20,
        amountMock,
        recipientMock,
        tenantIdMock,
        subjectMock,
        txConfig,
        operationId,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(erc20ServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(erc20ServiceMock.transfer).toHaveBeenCalledWith(
        amountMock,
        recipientMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        txConfig,
        operationId,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId,
        operationType: TokenOperationType.Transfer,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('transfer a erc20 token when operationId is undefined - success', async () => {
      tokensServiceMock.findTokenByIdOrAddress.mockImplementationOnce(
        async () => tokenEntityMock,
      )
      erc20ServiceMock.transfer.mockResolvedValueOnce(transactionIdMock)

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        senderMock,
      )
        .to(contractAddressMock)
        .chainName(chainNameMock)
        .build()

      await service.transfer(
        TokenType.ERC20,
        amountMock,
        recipientMock,
        tenantIdMock,
        subjectMock,
        txConfig,
        undefined,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(tokensServiceMock.findTokenByIdOrAddress).toHaveBeenCalledTimes(1)
      expect(tokensServiceMock.findTokenByIdOrAddress).toHaveBeenCalledWith({
        tokenEntityId: tokenEntityMock.id,
        contractAddress: contractAddressMock,
        chainName: chainNameMock,
      })
      expect(erc20ServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(erc20ServiceMock.transfer).toHaveBeenCalledWith(
        amountMock,
        recipientMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        txConfig,
        undefined,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationType: TokenOperationType.Transfer,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('transfer a erc721 token - success', async () => {
      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        senderMock,
      )
        .to(tokenEntityMock.contractAddress)
        .chainName(chainNameMock)
        .build()

      erc721ServiceMock.transfer.mockResolvedValueOnce(transactionIdMock)

      await service.transfer(
        TokenType.ERC721,
        tokenIdMock,
        recipientMock,
        tenantIdMock,
        subjectMock,
        txConfig,
        operationId,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(erc721ServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(erc721ServiceMock.transfer).toHaveBeenCalledWith(
        tokenIdMock,
        recipientMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        txConfig,
        operationId,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId,
        operationType: TokenOperationType.Transfer,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('unknown token', async () => {
      let thrownError: NotFoundException
      try {
        const txConfig: ITransactionConfig =
          TransactionConfigBuilder.get(senderMock).build()

        await service.transfer(
          TokenType.DVP,
          tokenIdMock,
          recipientMock,
          tenantIdMock,
          subjectMock,
          txConfig,
          operationId,
          tokenEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        )
      } catch (err) {
        thrownError = err
      }
      expect(thrownError.getStatus()).toBe(404)
      expect(erc20ServiceMock.deploy).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('does nothing if operation ID already exists', async () => {
      operationsServiceMock.getAll.mockResolvedValueOnce([
        [operationEntityMock],
        1,
      ])

      const txConfig: ITransactionConfig =
        TransactionConfigBuilder.get(senderMock).build()

      const result = await service.transfer(
        TokenType.ERC20,
        amountMock,
        recipientMock,
        tenantIdMock,
        subjectMock,
        txConfig,
        operationIdMock,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(result).toEqual(operationEntityMock)
      expect(erc721ServiceMock.transfer).toHaveBeenCalledTimes(0)
      expect(erc20ServiceMock.transfer).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('throws if operation already exists for transaction', async () => {
      await throwsIfOperationExistsForTransaction(async (transactionId) => {
        erc20ServiceMock.transfer.mockResolvedValueOnce(transactionId)

        const txConfig: ITransactionConfig =
          TransactionConfigBuilder.get(senderMock).build()

        await service.transfer(
          TokenType.ERC20,
          amountMock,
          recipientMock,
          tenantIdMock,
          subjectMock,
          txConfig,
          operationIdMock,
          tokenEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        )
      })
    })
  })

  describe('burning tokens', () => {
    it('(OK) burn erc20 supported token', async () => {
      tokensServiceMock.findById.mockResolvedValueOnce(tokenEntityMock)
      erc20ServiceMock.burn.mockResolvedValueOnce(transactionIdMock)

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .to(tokenEntityMock.contractAddress)
        .build()

      await service.burn(
        amountMock,
        txConfig,
        tenantIdMock,
        subjectMock,
        operationEntityMock.id,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(erc20ServiceMock.burn).toHaveBeenCalledTimes(1)
      expect(erc20ServiceMock.burn).toHaveBeenCalledWith(
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        amountMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId: operationEntityMock.id,
        operationType: TokenOperationType.Burn,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('(OK) burn erc721 supported token', async () => {
      tokensServiceMock.findTokenByIdOrAddress.mockResolvedValueOnce(
        token721EntityMock,
      )
      erc721ServiceMock.burn.mockResolvedValueOnce(transactionIdMock)

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .to(tokenEntityMock.contractAddress)
        .chainName(chainNameMock)
        .build()

      await service.burn(
        tokenIdMock,
        txConfig,
        tenantIdMock,
        subjectMock,
        operationEntityMock.id,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(erc721ServiceMock.burn).toHaveBeenCalledTimes(1)
      expect(erc721ServiceMock.burn).toHaveBeenCalledWith(
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        tokenIdMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId: operationEntityMock.id,
        operationType: TokenOperationType.Burn,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('(OK) should throw if token is not supported', async () => {
      tokensServiceMock.findTokenByIdOrAddress.mockResolvedValueOnce({
        ...tokenEntityMock,
        type: TokenType.DVP,
      })

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      await expect(
        service.burn(
          amountMock,
          txConfig,
          entityIdMock,
          subjectMock,
          operationEntityMock.id,
          tokenEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          tenantIdMock,
        ),
      ).rejects.toThrow()

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('(ValidationException) if amount not set', async () => {
      tokensServiceMock.findById.mockResolvedValueOnce(tokenEntityMock)

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      await expect(
        service.burn(
          null,
          txConfig,
          tenantIdMock,
          subjectMock,
          operationEntityMock.id,
          tokenEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        ),
      ).rejects.toThrow(ValidationException)

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('does nothing if operation ID already exists', async () => {
      operationsServiceMock.getAll.mockResolvedValueOnce([
        [operationEntityMock],
        1,
      ])

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      const result = await service.burn(
        tokenIdMock,
        txConfig,
        tenantIdMock,
        subjectMock,
        operationEntityMock.id,
        tokenEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(result).toEqual(operationEntityMock)
      expect(erc721ServiceMock.burn).toHaveBeenCalledTimes(0)
      expect(erc20ServiceMock.burn).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('throws if operation already exists for transaction', async () => {
      await throwsIfOperationExistsForTransaction(async (transactionId) => {
        tokensServiceMock.findById.mockResolvedValueOnce(tokenEntityMock)
        erc20ServiceMock.burn.mockResolvedValueOnce(transactionId)

        const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
          addressMock,
        )
          .chainName(chainNameMock)
          .build()

        await service.burn(
          tokenIdMock,
          txConfig,
          tenantIdMock,
          subjectMock,
          operationIdMock,
          tokenEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        )
      })
    })
  })

  describe('exec', () => {
    it('(OK) execs method successfully', async () => {
      tokensServiceMock.findTokenByIdOrAddress.mockResolvedValueOnce(
        tokenEntityMock,
      )

      const functionName = 'functionName'
      const params = ['A', 1, true]
      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      erc20ServiceMock.exec.mockResolvedValueOnce({
        transaction: transactionIdMock,
        operationType: TokenOperationType.Mint,
      })

      await service.exec(
        functionName,
        params,
        txConfig,
        tenantIdMock,
        subjectMock,
        tokenEntityMock.id,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(erc20ServiceMock.exec).toHaveBeenCalledTimes(1)
      expect(erc20ServiceMock.exec).toHaveBeenCalledWith(
        functionName,
        params,
        { ...txConfig, to: tokenEntityMock.contractAddress },
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId: operationEntityMock.id,
        operationType: TokenOperationType.Mint,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('(Error) if token type not implemented', async () => {
      tokensServiceMock.findTokenByIdOrAddress.mockResolvedValueOnce({
        ...tokenEntityMock,
        type: TokenType.DVP,
      })

      const functionName = 'functionName'
      const params = ['A', 1, true]
      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      await expect(
        service.exec(
          functionName,
          params,
          txConfig,
          tenantIdMock,
          subjectMock,
          tokenEntityMock.id,
          operationEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
        ),
      ).rejects.toThrow(`tokenType=${TokenType.DVP} is not implemented`)

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('does nothing if operation ID already exists', async () => {
      operationsServiceMock.getAll.mockResolvedValueOnce([
        [operationEntityMock],
        1,
      ])

      const functionName = 'functionName'
      const params = ['A', 1, true]
      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      const result = await service.exec(
        functionName,
        params,
        txConfig,
        tenantIdMock,
        subjectMock,
        tokenEntityMock.id,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(result).toEqual(operationEntityMock)
      expect(erc721ServiceMock.exec).toHaveBeenCalledTimes(0)
      expect(erc20ServiceMock.exec).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('throws if operation already exists for transaction', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await throwsIfOperationExistsForTransaction(async (transactionId) => {
        tokensServiceMock.findTokenByIdOrAddress.mockResolvedValueOnce(
          tokenEntityMock,
        )

        erc20ServiceMock.exec.mockResolvedValueOnce({
          transaction: transactionIdMock,
          operationType: TokenOperationType.Mint,
        })

        const functionName = 'functionName'
        const params = ['A', 1, true]
        const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
          addressMock,
        )
          .chainName(chainNameMock)
          .build()

        await service.exec(
          functionName,
          params,
          txConfig,
          tenantIdMock,
          subjectMock,
          tokenEntityMock.id,
          operationIdMock,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        )
      })
    })
  })

  describe('set token uri', () => {
    it('(OK) set token URI on supported ERC721 token', async () => {
      tokensServiceMock.findTokenByIdOrAddress.mockResolvedValueOnce({
        ...tokenEntityMock,
        type: TokenType.ERC721,
      })
      erc721ServiceMock.setTokenURI.mockResolvedValueOnce(transactionIdMock)

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .to(tokenEntityMock.contractAddress)
        .chainName(chainNameMock)
        .build()

      await service.setTokenURI(
        tokenIdMock,
        uriMock,
        txConfig,
        tenantIdMock,
        subjectMock,
        tokenEntityMock.id,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(erc721ServiceMock.setTokenURI).toHaveBeenCalledTimes(1)
      expect(erc721ServiceMock.setTokenURI).toHaveBeenCalledWith(
        tokenIdMock,
        uriMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.create).toHaveBeenCalledWith({
        operationId: operationEntityMock.id,
        operationType: TokenOperationType.SetTokenURI,
        transactionId: transactionIdMock,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        chainName: chainNameMock,
        createdBy: subjectMock,
      })
    })

    it('(Error) if not supported token', async () => {
      tokensServiceMock.findTokenByIdOrAddress.mockResolvedValueOnce({
        ...tokenEntityMock,
        type: TokenType.ERC20,
      })

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      const errorMsg = `setTokenURI only supported on ERC721 tokens`

      await expect(
        service.setTokenURI(
          tokenIdMock,
          uriMock,
          txConfig,
          tenantIdMock,
          subjectMock,
          tokenEntityMock.id,
          operationEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        ),
      ).rejects.toThrow(errorMsg)

      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('does nothing if operation ID already exists', async () => {
      operationsServiceMock.getAll.mockResolvedValueOnce([
        [operationEntityMock],
        1,
      ])

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      const result = await service.setTokenURI(
        tokenIdMock,
        uriMock,
        txConfig,
        tenantIdMock,
        subjectMock,
        tokenEntityMock.id,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        entityIdMock,
      )

      expect(result).toEqual(operationEntityMock)
      expect(erc721ServiceMock.setTokenURI).toHaveBeenCalledTimes(0)
      expect(operationsServiceMock.create).toHaveBeenCalledTimes(0)
    })

    it('throws if operation already exists for transaction', async () => {
      await throwsIfOperationExistsForTransaction(async (transactionId) => {
        tokensServiceMock.findTokenByIdOrAddress.mockResolvedValueOnce({
          ...tokenEntityMock,
          type: TokenType.ERC721,
        })

        erc721ServiceMock.setTokenURI.mockResolvedValueOnce(transactionId)

        const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
          addressMock,
        )
          .chainName(chainNameMock)
          .build()

        await service.setTokenURI(
          tokenIdMock,
          uriMock,
          txConfig,
          tenantIdMock,
          subjectMock,
          tokenEntityMock.id,
          operationIdMock,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
          entityIdMock,
        )
      })
    })
  })
})
