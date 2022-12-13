import { Commands, TransferTokenCommandBuilder } from '@consensys/messaging-events'
import { AUTOMATIC, TestScenario } from './utils/scenario'
import {
  erc721TokenIdMock,
  erc721TokenIdUniqueMock,
  tokensERC721TransferRequestMock,
} from '../test/mocks'
import { EntityStatus, TokenOperationType, TokenType } from '@consensys/ts-types'
import { transferTokenPut } from './utils/requests'
import {
  handlesMultipleCommandsWithSameIdempotencyKeys,
  handlesMultipleCommandsWithSameOperationIds,
  handlesMultipleRequestsWithSameIdempotencyKeys,
  handlesMultipleRequestsWithSameOperationIds,
} from './utils/templates'

require('dotenv').config()

jest.setTimeout(160000)

describe('ERC721 - Transfer', () => {
  let scenario: TestScenario
  let tokenId: string

  beforeAll(async () => {
    scenario = new TestScenario('ERC721 - Transfer')
    await scenario.init()
    await scenario.cleanRepos()
    await scenario.createToken(TokenType.ERC721)
  })

  beforeEach(async () => {
    tokenId = erc721TokenIdUniqueMock()

    await scenario.cleanMessages()
    await scenario.mintToken({ tokenId })
  })

  afterEach(async () => {
    await scenario.operationRepo.delete({})
  })

  afterAll(async () => {
    await scenario.destroy()
  })

  describe('Kafka Command', () => {
    const commandPayload = () =>
      TransferTokenCommandBuilder.get(
        TokenType.ERC721,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
      )
        .tokenId(tokenId)
        .from(scenario.address)
        .recipient(scenario.recipient)
        .build()

    it(`Success`, async () => {
      scenario.checkError()

      const { operation, asyncResult } = await scenario.runCommand(
        Commands.transferTokenCommand,
        commandPayload(),
      )

      expect(operation.status).toEqual(EntityStatus.Confirmed)
      expect(operation.operation).toEqual(TokenOperationType.Transfer)
      expect(operation.transactionHash).toBeDefined()
      expect(operation.blockNumber).toBeDefined()

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
    })

    it('Handles multiple commands with same operation ids', async () => {
      await handlesMultipleCommandsWithSameOperationIds(
        scenario,
        Commands.transferTokenCommand,
        commandPayload(),
      )
    })

    it('Handles multiple commands with same idempotency keys', async () => {
      await handlesMultipleCommandsWithSameIdempotencyKeys(
        scenario,
        Commands.transferTokenCommand,
        commandPayload(),
      )
    })
  })

  describe('HTTP Endpoint', () => {
    it('Throws without recipient', async () => {
      await expect(
        scenario.runRequest(transferTokenPut, {
          ...tokensERC721TransferRequestMock,
          to: undefined,
        }),
      ).rejects.toThrow('Request failed with status code 422')
    })

    it('Throws without permission', async () => {
      try {
        await scenario.runRequest(
          transferTokenPut,
          {
            ...tokensERC721TransferRequestMock,
          },
          { hasPermissions: false },
        )
        fail('Should not reach this line')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    it('Handles multiple requests with same operation ids', async () => {
      await handlesMultipleRequestsWithSameOperationIds(
        scenario,
        transferTokenPut,
        { ...tokensERC721TransferRequestMock, tokenId },
      )
    })

    it('Handles multiple requests with same idempotency keys', async () => {
      await handlesMultipleRequestsWithSameIdempotencyKeys(
        scenario,
        transferTokenPut,
        { ...tokensERC721TransferRequestMock, tokenId },
      )
    })
  })
})
