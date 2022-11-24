import { mintTokenPut } from './utils/requests'
import {
  erc721TokenIdUniqueMock,
  tokensERC721MintRequestMock,
} from '../test/mocks'
import { Commands, MintTokenCommandBuilder } from '@consensys/messaging-events'
import { EntityStatus, TokenOperationType, TokenType } from '@consensys/ts-types'
import { AUTOMATIC, TestScenario } from './utils/scenario'
import {
  handlesMultipleCommandsWithSameIdempotencyKeys,
  handlesMultipleCommandsWithSameOperationIds,
  handlesMultipleRequestsWithSameIdempotencyKeys,
  handlesMultipleRequestsWithSameOperationIds,
} from './utils/templates'

require('dotenv').config()

jest.setTimeout(160000)

describe('ERC721 - Mint', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC721 - Mint')
    await scenario.init()
    await scenario.cleanRepos()
    await scenario.createToken(TokenType.ERC721)
  })

  beforeEach(async () => {
    await scenario.cleanMessages()
  })

  afterEach(async () => {
    await scenario.operationRepo.delete({})
  })

  afterAll(async () => {
    await scenario.destroy()
  })

  describe('Kafka Command', () => {
    const commandPayload = () =>
      MintTokenCommandBuilder.get(
        TokenType.ERC721,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
      )
        .tokenId(erc721TokenIdUniqueMock())
        .build()

    it(`Success`, async () => {
      scenario.checkError()

      const { operation, asyncResult, message } = await scenario.runCommand(
        Commands.tokenMintCommand,
        commandPayload(),
      )

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.operation).toBe(TokenOperationType.Mint)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)

      expect(message.type).toEqual(TokenType.ERC721)
      expect(message.operationId).toEqual(operation.id)
      expect(message.account).toEqual(scenario.address)
    })

    it('Handles multiple commands with same operation ids', async () => {
      await handlesMultipleCommandsWithSameOperationIds(
        scenario,
        Commands.tokenMintCommand,
        commandPayload(),
      )
    })

    it('Handles multiple commands with same idempotency keys', async () => {
      await handlesMultipleCommandsWithSameIdempotencyKeys(
        scenario,
        Commands.tokenMintCommand,
        commandPayload(),
      )
    })
  })

  describe('HTTP Request', () => {
    const requestArgs = () => ({
      ...tokensERC721MintRequestMock,
      tokenAddress: scenario.token.contractAddress,
      to: scenario.address,
      tokenId: erc721TokenIdUniqueMock(),
    })

    it('Success when submitted by alternate node', async () => {
      scenario.checkError()

      const { response, operation } = await scenario.runRequest(
        mintTokenPut,
        requestArgs(),
        { simulateExternalOperation: true },
      )

      expect(response.status).toBe(202)
      expect(response.data).toBeDefined()

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.operation).toBe(TokenOperationType.Mint)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()
    })

    it('Throws when user does not have permission', async () => {
      scenario.checkError()

      try {
        await scenario.runRequest(mintTokenPut, requestArgs(), {
          hasPermissions: false,
        })

        fail('should not reach this line')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    it('Handles multiple requests with same operation ids', async () => {
      await handlesMultipleRequestsWithSameOperationIds(
        scenario,
        mintTokenPut,
        requestArgs(),
      )
    })

    it('Handles multiple requests with same idempotency keys', async () => {
      await handlesMultipleRequestsWithSameIdempotencyKeys(
        scenario,
        mintTokenPut,
        requestArgs(),
      )
    })
  })
})
