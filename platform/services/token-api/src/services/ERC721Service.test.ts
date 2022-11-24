import { ERC721Token } from '@consensys/tokens'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  tenantIdMock,
  contractAddressMock,
  uuidMock,
  operationEntityMock,
  senderMock,
  recipientMock,
  subjectMock,
  chainNameMock,
  addressMock,
  authHeadersMock,
  authTokenMock,
  idempotencyKeyMock,
  entityIdMock,
  tokensERC721DeployRequestMock,
  txConfigMock,
  erc721TokenIdMock,
  uriMock,
  createMockLogger,
} from '../../test/mocks'
import { ERC721Service } from './ERC721Service'
import {
  ITransactionConfig,
  TransactionConfigBuilder,
} from '@consensys/messaging-events'

describe('ERC721Service', () => {
  let service: ERC721Service
  let erc721TokenMock: jest.Mocked<ERC721Token>
  let loggerMock: jest.Mocked<NestJSPinoLogger>

  beforeEach(() => {
    loggerMock = createMockLogger()
    erc721TokenMock = createMockInstance(ERC721Token)

    service = new ERC721Service(loggerMock, erc721TokenMock)
  })

  describe('deploy', () => {
    it('deploy a ERC721 Token - success', async () => {
      erc721TokenMock.create.mockImplementationOnce(async () => uuidMock)

      const result = await service.deploy(
        {
          ...tokensERC721DeployRequestMock,
          idempotencyKey: idempotencyKeyMock,
        },
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toBe(uuidMock)
      expect(erc721TokenMock.create).toHaveBeenCalledWith(
        tokensERC721DeployRequestMock.name,
        tokensERC721DeployRequestMock.symbol,
        tokensERC721DeployRequestMock.config,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: undefined },
      )
    })
  })

  describe('contractConstructorParams', () => {
    it('fetch constructor params - success', async () => {
      erc721TokenMock.name.mockResolvedValueOnce('token_name')
      erc721TokenMock.symbol.mockResolvedValueOnce('token_symbol')

      const result = await service.contractConstructorParams(
        contractAddressMock,
        txConfigMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toEqual({
        name: 'token_name',
        symbol: 'token_symbol',
      })

      expect(erc721TokenMock.name).toHaveBeenCalledWith(
        contractAddressMock,
        txConfigMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(erc721TokenMock.symbol).toHaveBeenCalledWith(
        contractAddressMock,
        txConfigMock,
        authTokenMock,
        authHeadersMock,
      )
    })
  })

  describe('mint', () => {
    const txConfig: ITransactionConfig =
      TransactionConfigBuilder.get(senderMock).build()

    it('mint ERC721 Token - success', async () => {
      erc721TokenMock.mint.mockImplementationOnce(async () => uuidMock)

      const result = await service.mint(
        senderMock,
        erc721TokenIdMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toBe(uuidMock)
      expect(erc721TokenMock.mint).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.mint).toHaveBeenCalledWith(
        senderMock,
        erc721TokenIdMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('mint ERC721 Token, unkown transactionId - success', async () => {
      erc721TokenMock.mint.mockImplementationOnce(async () => undefined)

      await service.mint(
        senderMock,
        erc721TokenIdMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(erc721TokenMock.mint).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.mint).toHaveBeenCalledWith(
        senderMock,
        erc721TokenIdMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('uses operation id as idempotency key', async () => {
      erc721TokenMock.mint.mockImplementationOnce(async () => uuidMock)

      await service.mint(
        senderMock,
        erc721TokenIdMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
      )

      expect(erc721TokenMock.mint).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.mint).toHaveBeenCalledWith(
        senderMock,
        erc721TokenIdMock,
        txConfig,
        operationEntityMock.id,
        undefined,
        undefined,
        { operationId: operationEntityMock.id },
      )
    })
  })

  describe('burn', () => {
    it('sucessfuly creates burn operation', async () => {
      erc721TokenMock.burn.mockResolvedValueOnce(uuidMock)

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      const result = await service.burn(
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        erc721TokenIdMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toBe(uuidMock)
      expect(erc721TokenMock.burn).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.burn).toHaveBeenCalledWith(
        erc721TokenIdMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })
  })

  describe('transfer', () => {
    const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
      senderMock,
    )
      .chainName(chainNameMock)
      .build()

    it('transfer ERC721 Token - success', async () => {
      erc721TokenMock.transferFrom.mockImplementationOnce(async () => uuidMock)

      const result = await service.transfer(
        erc721TokenIdMock,
        recipientMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        txConfig,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toBe(uuidMock)
      expect(erc721TokenMock.transferFrom).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.transferFrom).toHaveBeenCalledWith(
        txConfig.from,
        recipientMock,
        erc721TokenIdMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('transfer ERC721 Token, unknown transactionId - success', async () => {
      erc721TokenMock.transferFrom.mockImplementationOnce(async () => undefined)

      await service.transfer(
        erc721TokenIdMock,
        recipientMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        txConfig,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(erc721TokenMock.transferFrom).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.transferFrom).toHaveBeenCalledWith(
        txConfig.from,
        recipientMock,
        erc721TokenIdMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('uses operation id as idempotency key', async () => {
      erc721TokenMock.transferFrom.mockResolvedValueOnce(uuidMock)

      await service.transfer(
        erc721TokenIdMock,
        recipientMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        txConfig,
        operationEntityMock.id,
      )

      expect(erc721TokenMock.transferFrom).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.transferFrom).toHaveBeenCalledWith(
        senderMock,
        recipientMock,
        erc721TokenIdMock,
        txConfig,
        operationEntityMock.id,
        undefined,
        undefined,
        { operationId: operationEntityMock.id },
      )
    })
  })

  describe('transfer ownership', () => {
    const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
      senderMock,
    )
      .chainName(chainNameMock)
      .build()

    it('transfer ownership ERC721 Token - success', async () => {
      erc721TokenMock.transferOwnership.mockImplementationOnce(
        async () => uuidMock,
      )

      const result = await service.transferOwnership(
        contractAddressMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toBe(uuidMock)
      expect(erc721TokenMock.transferOwnership).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.transferOwnership).toHaveBeenCalledWith(
        contractAddressMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('transfer ownership ERC721 Token, unknown transactionId - success', async () => {
      erc721TokenMock.transferOwnership.mockImplementationOnce(
        async () => undefined,
      )

      await service.transferOwnership(
        contractAddressMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(erc721TokenMock.transferOwnership).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.transferOwnership).toHaveBeenCalledWith(
        contractAddressMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('uses operation id as idempotency key', async () => {
      erc721TokenMock.transferOwnership.mockResolvedValueOnce(uuidMock)

      await service.transferOwnership(
        contractAddressMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
      )

      expect(erc721TokenMock.transferOwnership).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.transferOwnership).toHaveBeenCalledWith(
        contractAddressMock,
        txConfig,
        operationEntityMock.id,
        undefined,
        undefined,
        { operationId: operationEntityMock.id },
      )
    })
  })

  describe('set token URI', () => {
    const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
      senderMock,
    )
      .chainName(chainNameMock)
      .build()

    it('set token URI - ERC721 - success', async () => {
      erc721TokenMock.setTokenURI.mockImplementationOnce(async () => uuidMock)

      const result = await service.setTokenURI(
        erc721TokenIdMock,
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

      expect(result).toBe(uuidMock)
      expect(erc721TokenMock.setTokenURI).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.setTokenURI).toHaveBeenCalledWith(
        erc721TokenIdMock,
        uriMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('set token URI - ERC721 - unknown transactionId - success', async () => {
      erc721TokenMock.setTokenURI.mockImplementationOnce(async () => undefined)

      await service.setTokenURI(
        erc721TokenIdMock,
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

      expect(erc721TokenMock.setTokenURI).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.setTokenURI).toHaveBeenCalledWith(
        erc721TokenIdMock,
        uriMock,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('uses operation id as idempotency key', async () => {
      erc721TokenMock.setTokenURI.mockResolvedValueOnce(uuidMock)

      await service.setTokenURI(
        erc721TokenIdMock,
        uriMock,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
      )

      expect(erc721TokenMock.setTokenURI).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock.setTokenURI).toHaveBeenCalledWith(
        erc721TokenIdMock,
        uriMock,
        txConfig,
        operationEntityMock.id,
        undefined,
        undefined,
        { operationId: operationEntityMock.id },
      )
    })
  })
})
