import { ERC20Token } from '@codefi-assets-and-payments/tokens'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import {
  tenantIdMock,
  tokensDeployRequestMock,
  uuidMock,
  operationEntityMock,
  senderMock,
  amountMock,
  recipientMock,
  subjectMock,
  chainNameMock,
  addressMock,
  idempotencyKeyMock,
  authHeadersMock,
  entityIdMock,
  contractAddressMock,
  txConfigMock,
  errorMessageMock,
  createMockLogger,
} from '../../test/mocks'
import { ERC20Service } from './ERC20Service'
import {
  ITransactionConfig,
  TransactionConfigBuilder,
} from '@codefi-assets-and-payments/messaging-events'
import { unpadHex } from '../utils/bignumberUtils'
import { craftAuthTokenWithTenantId } from '@codefi-assets-and-payments/auth'

const authTokenMock: string = craftAuthTokenWithTenantId(
  tenantIdMock,
  entityIdMock,
  subjectMock,
)

describe('ERC20Service', () => {
  let service: ERC20Service
  let erc20TokenMock: jest.Mocked<ERC20Token>
  let loggerMock: jest.Mocked<NestJSPinoLogger>

  beforeEach(() => {
    loggerMock = createMockLogger()
    erc20TokenMock = createMockInstance(ERC20Token)

    service = new ERC20Service(loggerMock, erc20TokenMock)
  })

  describe('mint', () => {
    const sender = '0x1'
    const amount = '0x2'
    const tenantId = 'tenantId'
    const subject = 'subjectId'
    const txConfig: ITransactionConfig =
      TransactionConfigBuilder.get(sender).build()

    it('mint ERC20 Token - success', async () => {
      erc20TokenMock.mint.mockImplementationOnce(async () => 'transactionId')
      await service.mint(
        sender,
        amount,
        txConfig,
        tenantId,
        entityIdMock,
        subject,
      )
    })

    it('mint ERC20 Token, unkown transactionId - success', async () => {
      erc20TokenMock.mint.mockImplementationOnce(async () => undefined)

      await service.mint(
        sender,
        '0x100',
        txConfig,
        tenantId,
        entityIdMock,
        subject,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(erc20TokenMock.mint).toHaveBeenCalledTimes(1)
      expect(erc20TokenMock.mint).toHaveBeenCalledWith(
        sender,
        unpadHex('0x100'),
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('mint ERC20 Token, amount > 32 bit - success', async () => {
      const amountLarge =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

      erc20TokenMock.mint.mockImplementationOnce(async () => undefined)

      await service.mint(
        sender,
        amountLarge,
        txConfig,
        tenantId,
        entityIdMock,
        subject,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(erc20TokenMock.mint).toHaveBeenCalledTimes(1)
      expect(erc20TokenMock.mint).toHaveBeenCalledWith(
        sender,
        unpadHex(amountLarge),
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })

    it('uses operation id as idempotency key', async () => {
      erc20TokenMock.mint.mockImplementationOnce(async () => uuidMock)

      await service.mint(
        sender,
        '0x100',
        txConfig,
        tenantId,
        entityIdMock,
        subject,
        operationEntityMock.id,
      )

      expect(erc20TokenMock.mint).toHaveBeenCalledTimes(1)
      expect(erc20TokenMock.mint).toHaveBeenCalledWith(
        sender,
        unpadHex('0x100'),
        txConfig,
        operationEntityMock.id,
        undefined,
        undefined,
        { operationId: operationEntityMock.id },
      )
    })

    it('Throws if error in token', async () => {
      erc20TokenMock.mint.mockImplementationOnce(() => {
        throw Error(errorMessageMock)
      })

      await expect(
        service.mint(sender, amount, txConfig, tenantId, entityIdMock, subject),
      ).rejects.toThrowError(errorMessageMock)
    })
  })

  describe('transfer', () => {
    const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
      senderMock,
    )
      .chainName(chainNameMock)
      .build()

    it('transfer ERC20 Token - success', async () => {
      erc20TokenMock.transfer.mockImplementationOnce(async () => uuidMock)

      await service.transfer(
        amountMock,
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
    })

    it('uses operation id as idempotency key', async () => {
      erc20TokenMock.transfer.mockImplementationOnce(async () => uuidMock)

      await service.transfer(
        amountMock,
        recipientMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        txConfig,
        operationEntityMock.id,
      )

      expect(erc20TokenMock.transfer).toHaveBeenCalledTimes(1)
      expect(erc20TokenMock.transfer).toHaveBeenCalledWith(
        recipientMock,
        amountMock,
        txConfig,
        operationEntityMock.id,
        undefined,
        undefined,
        { operationId: operationEntityMock.id },
      )
    })

    it('Throws if error in token', async () => {
      erc20TokenMock.transfer.mockImplementationOnce(() => {
        throw Error(errorMessageMock)
      })

      await expect(
        service.transfer(
          amountMock,
          recipientMock,
          tenantIdMock,
          entityIdMock,
          subjectMock,
          txConfig,
          operationEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
        ),
      ).rejects.toThrowError(errorMessageMock)
    })

    it('transfer ERC20 Token, unknown transactionId - success', async () => {
      erc20TokenMock.transfer.mockReset()
      erc20TokenMock.transfer.mockImplementationOnce(async () => undefined)

      await service.transfer(
        amountMock,
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
    })

    it('transfer ERC20 Token, amount > 32 bit - success', async () => {
      const amountLarge =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

      erc20TokenMock.transfer.mockImplementationOnce(async () => undefined)

      await service.transfer(
        amountLarge,
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

      expect(erc20TokenMock.transfer).toHaveBeenCalledTimes(1)
      expect(erc20TokenMock.transfer).toHaveBeenCalledWith(
        recipientMock,
        unpadHex(amountLarge),
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: operationEntityMock.id },
      )
    })
  })

  describe('burn', () => {
    it('sucessfuly creates burn operation', async () => {
      erc20TokenMock.burn.mockResolvedValueOnce(uuidMock)

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
        amountMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toBe(uuidMock)
    })

    it('uses operation id as idempotency key', async () => {
      erc20TokenMock.burn.mockResolvedValueOnce(uuidMock)

      const txConfig: ITransactionConfig = TransactionConfigBuilder.get(
        addressMock,
      )
        .chainName(chainNameMock)
        .build()

      await service.burn(
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        amountMock,
        operationEntityMock.id,
      )

      expect(erc20TokenMock.burn).toHaveBeenCalledTimes(1)
      expect(erc20TokenMock.burn).toHaveBeenCalledWith(
        amountMock,
        txConfig,
        operationEntityMock.id,
        undefined,
        undefined,
        { operationId: operationEntityMock.id },
      )
    })
  })

  describe('deploy', () => {
    it('deploy a ERC20 Token - success', async () => {
      erc20TokenMock.create.mockImplementationOnce(async () => uuidMock)

      const result = await service.deploy(
        {
          ...tokensDeployRequestMock,
          idempotencyKey: idempotencyKeyMock,
        },
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toBe(uuidMock)
      expect(erc20TokenMock.create).toHaveBeenCalledWith(
        tokensDeployRequestMock.name,
        tokensDeployRequestMock.symbol,
        tokensDeployRequestMock.decimals,
        tokensDeployRequestMock.config,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
        { operationId: undefined },
      )
    })

    it('uses operation id as idempotency key', async () => {
      erc20TokenMock.create.mockResolvedValueOnce(uuidMock)

      await service.deploy({
        ...tokensDeployRequestMock,
        operationId: operationEntityMock.id,
      })

      expect(erc20TokenMock.create).toHaveBeenCalledWith(
        tokensDeployRequestMock.name,
        tokensDeployRequestMock.symbol,
        tokensDeployRequestMock.decimals,
        tokensDeployRequestMock.config,
        operationEntityMock.id,
        undefined,
        undefined,
        { operationId: operationEntityMock.id },
      )
    })
  })

  describe('contractConstructorParams', () => {
    it('fetch constructor params - success', async () => {
      erc20TokenMock.name.mockResolvedValueOnce('token_name')
      erc20TokenMock.symbol.mockResolvedValueOnce('token_symbol')
      erc20TokenMock.decimals.mockResolvedValueOnce('18')

      const result = await service.contractConstructorParams(
        contractAddressMock,
        txConfigMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toEqual({
        name: 'token_name',
        symbol: 'token_symbol',
        decimals: 18,
      })

      expect(erc20TokenMock.name).toHaveBeenCalledWith(
        contractAddressMock,
        txConfigMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(erc20TokenMock.symbol).toHaveBeenCalledWith(
        contractAddressMock,
        txConfigMock,
        authTokenMock,
        authHeadersMock,
      )
      expect(erc20TokenMock.decimals).toHaveBeenCalledWith(
        contractAddressMock,
        txConfigMock,
        authTokenMock,
        authHeadersMock,
      )
    })
  })
})
