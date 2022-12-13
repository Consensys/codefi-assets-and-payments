import {
  uuidMock,
  tokensDeployRequestMock,
  tenantIdMock,
  subjectMock,
  tokenIdMock,
  addressMock,
  chainNameMock,
  amountMock,
  operationEntityMock,
  tokenEntityMock,
  idempotencyKeyMock,
  operationIdMock,
  addressFromMock,
  entityIdMock,
  tokensRegisterRequestMock,
  uriMock,
  contractAddressMock,
  createMockLogger,
} from '../../test/mocks'
import { TokensController } from './TokensController'
import { TokensManagerService } from '../services/TokensManagerService'
import { TokensService } from '../services/TokensService'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  ITransactionConfig,
  TransactionConfigBuilder,
} from '@consensys/messaging-events'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import {
  TokensMintSchema,
  TokensTransferSchema,
  TokensExecSchema,
  TokensSetTokenURISchema,
} from '../validation/ApiRequestsSchema'
import {
  TokensBurnRequest,
  TokensExecRequest,
  TokensMintRequest,
  TokensTransferRequest,
  TokenQueryRequest,
  TokenType,
  SetTokenURIRequest,
} from '@consensys/ts-types'
import { ErrorCode } from '@consensys/error-handler'
import {
  craftRequestWithAuthHeaders,
  craftAuthTokenWithTenantId,
} from '@consensys/auth'
import { TokenOperationType } from '@consensys/ts-types'

describe('TokensController', () => {
  let controller: TokensController
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let tokensManagerServiceMock: jest.Mocked<TokensManagerService>
  let tokensServiceMock: jest.Mocked<TokensService>

  beforeEach(async () => {
    tokensManagerServiceMock = createMockInstance(TokensManagerService)
    tokensServiceMock = createMockInstance(TokensService)
    loggerMock = createMockLogger()
    controller = new TokensController(
      loggerMock,
      tokensManagerServiceMock,
      tokensServiceMock,
    )
  })

  describe('findAll', () => {
    it('resturns paginated items', async () => {
      const items = [tokenEntityMock]
      const count = 1
      const skip = 20
      const limit = 10
      const whereFilter = {
        id: operationIdMock,
        contractAddress: contractAddressMock,
        chainName: chainNameMock,
      }

      tokensServiceMock.getAll.mockResolvedValueOnce([items, count])

      const mockedQuery: TokenQueryRequest = {
        ...whereFilter,
        skip,
        limit,
      }

      const result = await controller.findAll(mockedQuery)

      expect(result).toEqual({
        items,
        count,
        skip,
        limit,
      })
      expect(tokensServiceMock.getAll).toHaveBeenCalledTimes(1)
      expect(tokensServiceMock.getAll).toHaveBeenCalledWith({
        skip,
        take: limit,
        where: whereFilter,
        order: {
          createdAt: 'DESC',
        },
      })
    })
  })

  describe('Burn', () => {
    it('/(PUT) Burn a ERC20 token - success', async () => {
      tokensManagerServiceMock.burn.mockResolvedValue({
        ...operationEntityMock,
        operation: TokenOperationType.Burn,
      })

      const config: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      const burnReq: TokensBurnRequest = {
        config,
        amount: amountMock,
        operationId: operationEntityMock.id,
      }

      const result = await controller.burn(
        burnReq,
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tokenIdMock,
      )
      expect(result).toStrictEqual({
        ...operationEntityMock,
        operation: TokenOperationType.Burn,
      })
    })
    it('/(PUT) Burn a ERC721 token - success', async () => {
      tokensManagerServiceMock.burn.mockResolvedValue({
        ...operationEntityMock,
        operation: TokenOperationType.Burn,
      })

      const config: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      const burnReq: TokensBurnRequest = {
        config,
        tokenId: '123',
        operationId: operationEntityMock.id,
      }

      const result = await controller.burn(
        burnReq,
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
        tokenIdMock,
      )
      expect(result).toStrictEqual({
        ...operationEntityMock,
        operation: TokenOperationType.Burn,
      })
    })
  })

  describe('Deploy', () => {
    it('/(POST) Deploy a token - success', async () => {
      tokensManagerServiceMock.deploy.mockImplementationOnce(async () => ({
        token: tokenEntityMock,
        operation: operationEntityMock,
      }))
      const result = await controller.deploy(
        tokensDeployRequestMock,
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
      )

      expect(result).toStrictEqual({
        token: tokenEntityMock,
        operation: operationEntityMock,
      })
    })
  })

  describe('Register', () => {
    it('/(POST) Register a token - success', async () => {
      tokensManagerServiceMock.register.mockImplementationOnce(async () => ({
        token: tokenEntityMock,
        operation: operationEntityMock,
      }))
      await controller.register(
        tokensRegisterRequestMock,
        craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
      )

      expect(tokensManagerServiceMock.register).toHaveBeenCalledWith(
        tokensRegisterRequestMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        craftAuthTokenWithTenantId(tenantIdMock, entityIdMock, subjectMock),
        undefined,
      )
    })
  })

  describe('Mint', () => {
    describe('Validation Pipe', () => {
      const validationPipe = new JoiValidationPipe(TokensMintSchema)
      it('Should throw if account is not 20 byte hex', () => {
        const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
          '0x3c527636B645dA67430C98bb99fE1F0ed074B2a7',
        ).build()

        const mockedMint: TokensMintRequest = {
          type: TokenType.ERC20,
          tokenAddress: '0x4f2c484c3bcF07cF8Ffab0652b37aeBb86588166',
          amount:
            '0x2f59c9464a979eaeb21fd0efcce76b95669aca98e4bcbffbd795cafa765b2925',
          account: '0x000', //bad data
          config: txConfig,
        }

        let validationError
        try {
          validationPipe.transform(mockedMint)
        } catch (error) {
          validationError = error
        }

        expect(validationError.message).toEqual(
          '"account" with value "0x000" fails to match the required pattern: /^0x([A-Fa-f0-9]{40})$/',
        )
        expect(validationError.errorCode).toEqual(
          ErrorCode.ApplicationValidation,
        )
      })

      it('Should throw if tx config has a bad "from" address', () => {
        const txConfig: ITransactionConfig =
          TransactionConfigBuilder.get('0xbadAddress').build()

        const mockedMint: TokensMintRequest = {
          type: TokenType.ERC20,
          tokenAddress: '0x4f2c484c3bcF07cF8Ffab0652b37aeBb86588166',
          amount:
            '0x0000000000000000000000000000000000000000000000000000000000000064',
          account: '0x3c527636B645dA67430C98bb99fE1F0ed074B2a7',
          config: txConfig,
        }

        let validationError
        try {
          validationPipe.transform(mockedMint)
        } catch (error) {
          validationError = error
        }

        expect(validationError.message).toEqual(
          '"config.from" with value "0xbadAddress" fails to match the required pattern: /^0x([A-Fa-f0-9]{40})$/',
        )
        expect(validationError.errorCode).toEqual(
          ErrorCode.ApplicationValidation,
        )
      })
    })

    it('(PUT) Mint a ERC20 token - success', async () => {
      tokensManagerServiceMock.mint.mockImplementationOnce(
        async () => operationEntityMock,
      )
      const txConfig: ITransactionConfig =
        TransactionConfigBuilder.get('0x00000000111').build()

      const mockedMint: TokensMintRequest = {
        type: TokenType.ERC20,
        tokenAddress: '0x4f2c484c3bcF07cF8Ffab0652b37aeBb86588166',
        amount:
          '0x0000000000000000000000000000000000000000000000000000000000000064',
        account: '0x3c527636B645dA67430C98bb99fE1F0ed074B2a7',
        config: txConfig,
        idempotencyKey: idempotencyKeyMock,
      }

      await expect(
        controller.mint(
          mockedMint,
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          tokenIdMock,
        ),
      ).resolves.toBeDefined()
      expect(tokensManagerServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.mint).toHaveBeenCalledWith(
        TokenType.ERC20,
        txConfig.from,
        mockedMint.amount,
        tenantIdMock,
        subjectMock,
        txConfig,
        mockedMint.operationId,
        tokenIdMock,
        idempotencyKeyMock,
        craftAuthTokenWithTenantId(tenantIdMock, entityIdMock, subjectMock),
        undefined, // headers
        entityIdMock,
      )
    })

    it('(PUT) Mint a ERC721 token - success', async () => {
      tokensManagerServiceMock.mint.mockImplementationOnce(
        async () => operationEntityMock,
      )
      const toAccount = '0x3c527636B645dA67430C98bb99fE1F0ed074B2a7'
      const erc721Token = '123'
      const txConfig: ITransactionConfig =
        TransactionConfigBuilder.get('0x00000000111').build()

      const mockedMint: TokensMintRequest = {
        type: TokenType.ERC721,
        tokenAddress: '0x4f2c484c3bcF07cF8Ffab0652b37aeBb86588166',
        tokenId: erc721Token,
        to: toAccount,
        config: txConfig,
        idempotencyKey: idempotencyKeyMock,
      }

      await expect(
        controller.mint(
          mockedMint,
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          tokenIdMock,
        ),
      ).resolves.toBeDefined()
      expect(tokensManagerServiceMock.mint).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.mint).toHaveBeenCalledWith(
        TokenType.ERC721,
        toAccount,
        erc721Token,
        tenantIdMock,
        subjectMock,
        txConfig,
        mockedMint.operationId,
        tokenIdMock,
        idempotencyKeyMock,
        craftAuthTokenWithTenantId(tenantIdMock, entityIdMock, subjectMock),
        undefined, // headers
        entityIdMock,
      )
    })
  })

  describe('Transfer', () => {
    describe('Validation Pipe', () => {
      const validationPipe = new JoiValidationPipe(TokensTransferSchema)
      it('Should throw if account is not 20 byte hex', () => {
        const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
          '0x3c527636B645dA67430C98bb99fE1F0ed074B2a7',
        ).build()

        const mockedTransfer: TokensTransferRequest = {
          type: TokenType.ERC20,
          tokenId: uuidMock,
          amount:
            '0x2f59c9464a979eaeb21fd0efcce76b95669aca98e4bcbffbd795cafa765b2925',
          account: '0x000', //bad data
          config: txConfig,
        }

        let validationError
        try {
          validationPipe.transform(mockedTransfer)
        } catch (error) {
          validationError = error
        }

        expect(validationError.message).toEqual(
          '"account" with value "0x000" fails to match the required pattern: /^0x([A-Fa-f0-9]{40})$/',
        )
        expect(validationError.errorCode).toEqual(
          ErrorCode.ApplicationValidation,
        )
      })

      it('Should throw if tx config has a bad "from" address', () => {
        const txConfig: ITransactionConfig =
          TransactionConfigBuilder.get('0xbadAddress').build()

        const mockedMint: TokensTransferRequest = {
          type: TokenType.ERC20,
          amount:
            '0x0000000000000000000000000000000000000000000000000000000000000064',
          account: '0x3c527636B645dA67430C98bb99fE1F0ed074B2a7',
          config: txConfig,
        }

        let validationError
        try {
          validationPipe.transform(mockedMint)
        } catch (error) {
          validationError = error
        }

        expect(validationError.message).toEqual(
          '"config.from" with value "0xbadAddress" fails to match the required pattern: /^0x([A-Fa-f0-9]{40})$/',
        )
        expect(validationError.errorCode).toEqual(
          ErrorCode.ApplicationValidation,
        )
      })
    })

    it('(PUT) Transfer ERC20 tokens - success', async () => {
      tokensManagerServiceMock.transfer.mockImplementationOnce(
        async () => operationEntityMock,
      )
      const txConfig: ITransactionConfig =
        TransactionConfigBuilder.get('0x00000000111').build()

      const mockedTransfer: TokensTransferRequest = {
        type: TokenType.ERC20,
        amount:
          '0x0000000000000000000000000000000000000000000000000000000000000064',
        account: '0x3c527636B645dA67430C98bb99fE1F0ed074B2a7',
        config: txConfig,
        idempotencyKey: idempotencyKeyMock,
      }

      await expect(
        controller.transfer(
          mockedTransfer,
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          uuidMock,
        ),
      ).resolves.toBeDefined()
      expect(tokensManagerServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.transfer).toHaveBeenCalledWith(
        TokenType.ERC20,
        mockedTransfer.amount,
        mockedTransfer.account,
        tenantIdMock,
        subjectMock,
        txConfig,
        mockedTransfer.operationId,
        uuidMock,
        idempotencyKeyMock,
        craftAuthTokenWithTenantId(tenantIdMock, entityIdMock, subjectMock),
        undefined, // headers
        entityIdMock,
      )
    })
    it('(PUT) Transfer ERC721 tokens - success', async () => {
      tokensManagerServiceMock.transfer.mockImplementationOnce(
        async () => operationEntityMock,
      )
      const txConfig: ITransactionConfig =
        TransactionConfigBuilder.get('0x00000000111').build()

      const mockedTransfer: TokensTransferRequest = {
        type: TokenType.ERC721,
        tokenId: '123',
        to: '0x3c527636B645dA67430C98bb99fE1F0ed074B2a7',
        config: txConfig,
        idempotencyKey: idempotencyKeyMock,
      }

      await expect(
        controller.transfer(
          mockedTransfer,
          craftRequestWithAuthHeaders(tenantIdMock, entityIdMock, subjectMock),
          uuidMock,
        ),
      ).resolves.toBeDefined()
      expect(tokensManagerServiceMock.transfer).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.transfer).toHaveBeenCalledWith(
        TokenType.ERC721,
        '123', // this is ERC721 tokenId
        mockedTransfer.to,
        tenantIdMock,
        subjectMock,
        txConfig,
        mockedTransfer.operationId,
        uuidMock,
        idempotencyKeyMock,
        craftAuthTokenWithTenantId(tenantIdMock, entityIdMock, subjectMock),
        undefined, // headers
        entityIdMock,
      )
    })
  })

  describe('Exec', () => {
    const txConfig: ITransactionConfig =
      TransactionConfigBuilder.get(addressFromMock).build()

    describe('Validation Pipe', () => {
      const validationPipe = new JoiValidationPipe(TokensExecSchema)

      it('Should throw if no functionName is passed', () => {
        const mockedExec: TokensExecRequest = {
          functionName: undefined,
          params: ['A', 'B'],
          config: txConfig,
        }

        try {
          validationPipe.transform(mockedExec)
          fail('Should not reach this point')
        } catch (error) {
          expect(error.message).toEqual('"functionName" is required')
          expect(error.errorCode).toEqual(ErrorCode.ApplicationValidation)
        }
      })

      it('Should throw if no params are passed', () => {
        const mockedExec: TokensExecRequest = {
          functionName: 'approve',
          params: undefined,
          config: txConfig,
        }

        try {
          validationPipe.transform(mockedExec)
          fail('Should not reach this point')
        } catch (error) {
          expect(error.message).toEqual('"params" is required')
          expect(error.errorCode).toEqual(ErrorCode.ApplicationValidation)
        }
      })

      it('Should throw if no config is passed', () => {
        const mockedExec: TokensExecRequest = {
          functionName: 'approve',
          params: ['A', 'B'],
          config: undefined,
        }

        try {
          validationPipe.transform(mockedExec)
          fail('Should not reach this point')
        } catch (error) {
          expect(error.message).toEqual('"config" is required')
          expect(error.errorCode).toEqual(ErrorCode.ApplicationValidation)
        }
      })
    })

    it('(PUT) Exec - success', async () => {
      tokensManagerServiceMock.exec.mockImplementationOnce(
        async () => operationEntityMock,
      )

      const mockedExec: TokensExecRequest = {
        functionName: 'approve',
        params: ['0x0x000000002222', '0x3ec'],
        config: txConfig,
        idempotencyKey: idempotencyKeyMock,
        operationId: operationIdMock,
      }

      const authToken = craftRequestWithAuthHeaders(
        tenantIdMock,
        entityIdMock,
        subjectMock,
      )

      await expect(
        controller.exec(mockedExec, authToken, tokenIdMock),
      ).resolves.toEqual(operationEntityMock)
      expect(tokensManagerServiceMock.exec).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.exec).toHaveBeenCalledWith(
        mockedExec.functionName,
        mockedExec.params,
        txConfig,
        tenantIdMock,
        subjectMock,
        tokenIdMock,
        operationIdMock,
        idempotencyKeyMock,
        craftAuthTokenWithTenantId(tenantIdMock, entityIdMock, subjectMock),
        undefined, // headers (not passed, as for now, we don't want a user to be allowed to act on tokens from other tenants)
        entityIdMock,
      )
    })
  })

  describe('Set Token URI', () => {
    const txConfig: ITransactionConfig =
      TransactionConfigBuilder.get(addressFromMock).build()

    describe('Validation Pipe', () => {
      const validationPipe = new JoiValidationPipe(TokensSetTokenURISchema)

      it('Should throw if no token ID is passed', () => {
        const mockedSetTokenURI: SetTokenURIRequest = {
          tokenId: undefined,
          uri: uriMock,
          config: txConfig,
        }

        try {
          validationPipe.transform(mockedSetTokenURI)
          fail('Should not reach this point')
        } catch (error) {
          expect(error.message).toEqual('"tokenId" is required')
          expect(error.errorCode).toEqual(ErrorCode.ApplicationValidation)
        }
      })

      it('Should throw if no URI is passed', () => {
        const mockedSetTokenURI: SetTokenURIRequest = {
          tokenId: tokenIdMock,
          uri: undefined,
          config: txConfig,
        }

        try {
          validationPipe.transform(mockedSetTokenURI)
          fail('Should not reach this point')
        } catch (error) {
          expect(error.message).toEqual('"uri" is required')
          expect(error.errorCode).toEqual(ErrorCode.ApplicationValidation)
        }
      })

      it('Should throw if no config is passed', () => {
        const mockedSetTokenURI: SetTokenURIRequest = {
          tokenId: tokenIdMock,
          uri: uriMock,
          config: undefined,
        }

        try {
          validationPipe.transform(mockedSetTokenURI)
          fail('Should not reach this point')
        } catch (error) {
          expect(error.message).toEqual('"config" is required')
          expect(error.errorCode).toEqual(ErrorCode.ApplicationValidation)
        }
      })
    })

    it('(PUT) Set Token URI - success', async () => {
      tokensManagerServiceMock.setTokenURI.mockImplementationOnce(
        async () => operationEntityMock,
      )

      const mockedSetTokenURI: SetTokenURIRequest = {
        tokenId: tokenIdMock,
        uri: uriMock,
        config: txConfig,
        idempotencyKey: idempotencyKeyMock,
        operationId: operationIdMock,
      }

      const authToken = craftRequestWithAuthHeaders(
        tenantIdMock,
        entityIdMock,
        subjectMock,
      )

      await expect(
        controller.setTokenURI(mockedSetTokenURI, authToken, tokenIdMock),
      ).resolves.toEqual(operationEntityMock)
      expect(tokensManagerServiceMock.setTokenURI).toHaveBeenCalledTimes(1)
      expect(tokensManagerServiceMock.setTokenURI).toHaveBeenCalledWith(
        tokenIdMock,
        uriMock,
        txConfig,
        tenantIdMock,
        subjectMock,
        tokenIdMock,
        operationIdMock,
        idempotencyKeyMock,
        craftAuthTokenWithTenantId(tenantIdMock, entityIdMock, subjectMock),
        undefined, // headers (not passed, as for now, we don't want a user to be allowed to act on tokens from other tenants)
        entityIdMock,
      )
    })
  })
})
