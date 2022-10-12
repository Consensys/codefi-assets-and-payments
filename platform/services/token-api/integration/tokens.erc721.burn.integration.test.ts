import { burnTokenPut } from './utils/requests'
import { erc721TokenIdMock } from '../test/mocks'
import { BurnTokenCommandBuilder, Commands } from '@codefi-assets-and-payments/messaging-events'
import { EntityStatus, TokenOperationType, TokenType } from '@codefi-assets-and-payments/ts-types'
import { AUTOMATIC, TestScenario } from './utils/scenario'
import {
  handlesMultipleCommandsWithSameIdempotencyKeys,
  handlesMultipleCommandsWithSameOperationIds,
  handlesMultipleRequestsWithSameIdempotencyKeys,
  handlesMultipleRequestsWithSameOperationIds,
} from './utils/templates'

require('dotenv').config()

jest.setTimeout(160000)

describe('ERC721 - Burn', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC721 - Burn')
    await scenario.init()
    await scenario.cleanRepos()
    await scenario.createToken(TokenType.ERC721)
  })

  beforeEach(async () => {
    await scenario.mintToken()
    await scenario.cleanMessages()
  })

  afterEach(async () => {
    await scenario.operationRepo.delete({})
  })

  afterAll(async () => {
    await scenario.destroy()
  })

  describe('Kafka Command', () => {
    const commandPayload = BurnTokenCommandBuilder.get(
      TokenType.ERC721,
      erc721TokenIdMock,
      AUTOMATIC,
      AUTOMATIC,
      AUTOMATIC,
      AUTOMATIC,
    ).build()

    it(`Success`, async () => {
      scenario.checkError()

      const { operation, asyncResult } = await scenario.runCommand(
        Commands.burnTokenCommand,
        commandPayload,
      )

      expect(operation.status).toEqual(EntityStatus.Confirmed)
      expect(operation.operation).toEqual(TokenOperationType.Burn)
      expect(operation.transactionHash).toBeDefined()
      expect(operation.blockNumber).toBeDefined()

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
    })

    it('Handles multiple commands with same operation ids', async () => {
      await handlesMultipleCommandsWithSameOperationIds(
        scenario,
        Commands.burnTokenCommand,
        commandPayload,
      )
    })

    it('Handles multiple commands with same idempotency keys', async () => {
      await handlesMultipleCommandsWithSameIdempotencyKeys(
        scenario,
        Commands.burnTokenCommand,
        commandPayload,
      )
    })
  })

  describe('HTTP Endpoint', () => {
    const requestArgs = { tokenId: erc721TokenIdMock }

    it('Success when submitted by alternate node', async () => {
      scenario.checkError()

      const { response, operation, asyncResult } = await scenario.runRequest(
        burnTokenPut,
        requestArgs,
        { simulateExternalOperation: true },
      )

      expect(response.status).toBe(202)
      expect(response.data).toBeDefined()

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.operation).toBe(TokenOperationType.Burn)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()
    })

    it('Handles multiple requests with same operation ids', async () => {
      await handlesMultipleRequestsWithSameOperationIds(
        scenario,
        burnTokenPut,
        requestArgs,
      )
    })

    it('Handles multiple requests with same idempotency keys', async () => {
      await handlesMultipleRequestsWithSameIdempotencyKeys(
        scenario,
        burnTokenPut,
        requestArgs,
      )
    })

    it('Throws without permission', async () => {
      try {
        await scenario.runRequest(burnTokenPut, requestArgs, {
          hasPermissions: false,
        })
        fail('Should not reach this line')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })
  })
})
