import { Commands, SetTokenURICommandBuilder } from '@codefi-assets-and-payments/messaging-events'
import { AUTOMATIC, TestScenario } from './utils/scenario'
import {
  erc721TokenIdMock,
  tokensERC721SetTokenURIRequestMock,
  uriMock,
} from '../test/mocks'
import { EntityStatus, TokenOperationType, TokenType } from '@codefi-assets-and-payments/ts-types'
import { setTokenURIPut } from './utils/requests'
import {
  handlesMultipleCommandsWithSameIdempotencyKeys,
  handlesMultipleCommandsWithSameOperationIds,
  handlesMultipleRequestsWithSameIdempotencyKeys,
  handlesMultipleRequestsWithSameOperationIds,
} from './utils/templates'

require('dotenv').config()

jest.setTimeout(160000)

describe('ERC721 - Set Token URI', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC721 - Set Token URI')
    await scenario.init()
    await scenario.cleanRepos()
    await scenario.createToken(TokenType.ERC721)
    await scenario.mintToken()
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
    const commandPayload = SetTokenURICommandBuilder.get(
      erc721TokenIdMock,
      uriMock,
      AUTOMATIC,
      AUTOMATIC,
      AUTOMATIC,
      AUTOMATIC,
    ).build()

    it('Success', async () => {
      scenario.checkError()

      const { operation, asyncResult } = await scenario.runCommand(
        Commands.setTokenURICommand,
        commandPayload,
      )

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.operation).toBe(TokenOperationType.SetTokenURI)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
    })

    it('Handles multiple commands with same operation ids', async () => {
      await handlesMultipleCommandsWithSameOperationIds(
        scenario,
        Commands.setTokenURICommand,
        commandPayload,
      )
    })

    it('Handles multiple commands with same idempotency keys', async () => {
      await handlesMultipleCommandsWithSameIdempotencyKeys(
        scenario,
        Commands.setTokenURICommand,
        commandPayload,
      )
    })
  })

  describe('HTTP Endpoint', () => {
    it('Success', async () => {
      scenario.checkError()

      const { response, operation, asyncResult } = await scenario.runRequest(
        setTokenURIPut,
        tokensERC721SetTokenURIRequestMock,
      )

      expect(response.status).toBe(202)
      expect(response.data).toBeDefined()

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.operation).toBe(TokenOperationType.SetTokenURI)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
    })

    it('Throws when user does not have permission', async () => {
      scenario.checkError()

      try {
        await scenario.runRequest(
          setTokenURIPut,
          tokensERC721SetTokenURIRequestMock,
          { hasPermissions: false },
        )
        fail('should not reach this line')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    it('Handles multiple requests with same operation ids', async () => {
      await handlesMultipleRequestsWithSameOperationIds(
        scenario,
        setTokenURIPut,
        tokensERC721SetTokenURIRequestMock,
      )
    })

    it('Handles multiple requests with same idempotency keys', async () => {
      await handlesMultipleRequestsWithSameIdempotencyKeys(
        scenario,
        setTokenURIPut,
        tokensERC721SetTokenURIRequestMock,
      )
    })
  })
})
