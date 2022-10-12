import { ERC721Token } from '@codefi-assets-and-payments/tokens'
import createMockInstance from 'jest-create-mock-instance'
import {
  tenantIdMock,
  uuidMock,
  operationEntityMock,
  senderMock,
  subjectMock,
  chainNameMock,
  authHeadersMock,
  authTokenMock,
  idempotencyKeyMock,
  entityIdMock,
  createMockLogger,
} from '../../test/mocks'
import { ERC721Service } from './ERC721Service'
import { TransactionConfigBuilder } from '@codefi-assets-and-payments/messaging-events'
import { TokenOperationType } from '@codefi-assets-and-payments/ts-types'

describe('ERC721Service', () => {
  let service: ERC721Service
  let erc721TokenMock: jest.Mocked<ERC721Token>

  beforeEach(() => {
    const loggerMock = createMockLogger()
    erc721TokenMock = createMockInstance(ERC721Token)

    service = new ERC721Service(loggerMock, erc721TokenMock)
  })

  describe('exec', () => {
    const txConfig = TransactionConfigBuilder.get(senderMock)
      .chainName(chainNameMock)
      .build()

    it('(OK) when calling custom function by name', async () => {
      const functionName = 'mint'
      const params = ['A', 1]

      erc721TokenMock[functionName].mockResolvedValueOnce(uuidMock)

      const result = await service.exec(
        functionName,
        params,
        txConfig,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        operationEntityMock.id,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )

      expect(result).toEqual({
        transaction: uuidMock,
        operationType: TokenOperationType.Mint,
      })

      expect(erc721TokenMock[functionName]).toHaveBeenCalledTimes(1)
      expect(erc721TokenMock[functionName]).toHaveBeenCalledWith(
        ...params,
        txConfig,
        idempotencyKeyMock,
        authTokenMock,
        authHeadersMock,
      )
    })

    it('(ValidationException) when calling function that is not implemented', async () => {
      const functionName = 'nonExistent'
      await expect(
        service.exec(
          functionName,
          [],
          txConfig,
          tenantIdMock,
          entityIdMock,
          subjectMock,
          operationEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
        ),
      ).rejects.toThrow(
        `tokenType=CodefiERC721 functionName=${functionName} is not a function`,
      )
    })

    it('(ValidationException) when calling implemented custom function with no equivalent TokenOperationType', async () => {
      const functionName = 'create'
      const params = []

      await expect(
        service.exec(
          functionName,
          params,
          txConfig,
          tenantIdMock,
          entityIdMock,
          subjectMock,
          operationEntityMock.id,
          idempotencyKeyMock,
          authTokenMock,
          authHeadersMock,
        ),
      ).rejects.toThrow(
        `tokenType=CodefiERC721 functionName=${functionName} does not have a TokenOperationType assigned`,
      )
    })
  })
})
