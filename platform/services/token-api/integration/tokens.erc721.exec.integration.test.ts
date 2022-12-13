import { erc721TokenIdMock, erc721TokenIdUniqueMock } from '../test/mocks'
import { Commands, ExecTokenCommandBuilder } from '@consensys/messaging-events'
import { EntityStatus, TokenOperationType, TokenType } from '@consensys/ts-types'
import { AUTOMATIC, TestScenario } from './utils/scenario'
import { execTokenPost } from './utils/requests'
import {
  handlesMultipleCommandsWithSameIdempotencyKeys,
  handlesMultipleCommandsWithSameOperationIds,
  handlesMultipleRequestsWithSameIdempotencyKeys,
  handlesMultipleRequestsWithSameOperationIds,
} from './utils/templates'

require('dotenv').config()

jest.setTimeout(1600000)

describe('ERC721 - Exec', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC721 - Exec')
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
    const commandPayload = () => {
      const functionName = 'mint'
      const params = [scenario.address, erc721TokenIdUniqueMock()]

      return ExecTokenCommandBuilder.get(
        functionName,
        params,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
      ).build()
    }

    it('Success', async () => {
      scenario.checkError()

      const { operation, asyncResult } = await scenario.runCommand(
        Commands.execTokenCommand,
        commandPayload(),
      )

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.operation).toBe(TokenOperationType.Mint)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
    })

    it('Handles multiple commands with same operation ids', async () => {
      await handlesMultipleCommandsWithSameOperationIds(
        scenario,
        Commands.execTokenCommand,
        commandPayload(),
      )
    })

    it('Handles multiple commands with same idempotency keys', async () => {
      await handlesMultipleCommandsWithSameIdempotencyKeys(
        scenario,
        Commands.execTokenCommand,
        commandPayload(),
      )
    })
  })

  describe('HTTP Endpoint', () => {
    const requestArgs = () => ({
      functionName: 'mint',
      params: [scenario.address, erc721TokenIdUniqueMock()],
    })

    it('Success', async () => {
      scenario.checkError()

      const { response, operation, asyncResult } = await scenario.runRequest(
        execTokenPost,
        requestArgs(),
      )

      expect(response.status).toBe(202)
      expect(response.data).toBeDefined()

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.operation).toBe(TokenOperationType.Mint)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
    })

    it('Throws when user does not have permission', async () => {
      try {
        await scenario.runRequest(execTokenPost, requestArgs(), {
          hasPermissions: false,
        })
        fail('should not reach this line')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    it('Throws when the token type does not exist', async () => {
      // Modify deployed token type manually with a type that is not implemented
      // Not a very good method, as if we eventually implement this token service the test will break
      const modifiedToken = {
        ...scenario.token,
        type: TokenType.DVP,
      }
      await scenario.tokenRepo.save(modifiedToken)

      try {
        await scenario.runRequest(execTokenPost, requestArgs())
        fail('should not reach this line')
      } catch (error) {
        expect(error.response.data.message).toEqual(
          `tokenType=${modifiedToken.type} is not implemented`,
        )
      } finally {
        await scenario.tokenRepo.save({
          ...scenario.token,
          type: TokenType.ERC721,
        })
      }
    })

    it('Throws when the token function does not exist', async () => {
      const functionName = 'nonExistent'
      try {
        await scenario.runRequest(execTokenPost, {
          functionName,
          params: [scenario.address, erc721TokenIdMock],
        })
        fail('should not reach this line')
      } catch (error) {
        expect(error.response.data.message).toEqual(
          `tokenType=${TokenType.ERC721} functionName=${functionName} is not a function`,
        )
      }
    })

    it('Handles multiple requests with same operation ids', async () => {
      await handlesMultipleRequestsWithSameOperationIds(
        scenario,
        execTokenPost,
        requestArgs(),
      )
    })

    it('Handles multiple requests with same idempotency keys', async () => {
      await handlesMultipleRequestsWithSameIdempotencyKeys(
        scenario,
        execTokenPost,
        requestArgs(),
      )
    })
  })
})
