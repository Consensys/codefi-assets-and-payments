import { burnTokenPut } from './utils/requests'
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

describe('ERC20 - Burn', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC20 - Burn')
    await scenario.init()
    await scenario.cleanRepos()
    await scenario.createToken(TokenType.ERC20)
    await scenario.mintToken({ amount: '0xFFFFFFFF' })
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
    const commandPayload = BurnTokenCommandBuilder.get(
      TokenType.ERC20,
      '0x64',
      AUTOMATIC,
      AUTOMATIC,
      AUTOMATIC,
      AUTOMATIC,
    ).build()

    it('Success with large amount', async () => {
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

    it('Success with small amount', async () => {
      scenario.checkError()

      const { operation, asyncResult } = await scenario.runCommand(
        Commands.burnTokenCommand,
        BurnTokenCommandBuilder.get(
          TokenType.ERC20,
          '0x0000000000000000000000000000000000000000000000000000000000000064',
          AUTOMATIC,
          AUTOMATIC,
          AUTOMATIC,
          AUTOMATIC,
        ).build(),
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
    const requestArgs = {
      amount:
        '0x0000000000000000000000000000000000000000000000000000000000000100',
    }

    it('Success when submitted by another node', async () => {
      scenario.checkError()

      const { response, operation } = await scenario.runRequest(
        burnTokenPut,
        requestArgs,
        { simulateExternalOperation: true },
      )

      expect(response.status).toBe(202)
      expect(response.data).toBeDefined()

      expect(operation.operation).toBe(TokenOperationType.Burn)
      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()
    })

    it('Fails if amount exceeds available balance', async () => {
      scenario.checkError()

      const { response, operation } = await scenario.runRequest(burnTokenPut, {
        amount:
          '0xffffff0000000000000000000000000000000000000000000000000000000100',
      })

      expect(response.status).toBe(202)
      expect(response.data).toBeDefined()

      expect(operation.operation).toBe(TokenOperationType.Burn)
      expect(operation.status).toBe(EntityStatus.Failed)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()
    })

    it('Throws without amount', async () => {
      await expect(scenario.runRequest(burnTokenPut, {})).rejects.toThrow(
        'Request failed with status code 422',
      )
    })

    it('Throws without permission', async () => {
      try {
        await scenario.runRequest(
          burnTokenPut,
          {
            amount: '0x1',
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
  })
})
