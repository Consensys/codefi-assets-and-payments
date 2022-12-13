import { Commands, TransferTokenCommandBuilder } from '@consensys/messaging-events'
import { AUTOMATIC, TestScenario } from './utils/scenario'
import { tokensTransferRequestMock } from '../test/mocks'
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

describe('ERC20 - Transfer', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC20 - Transfer')
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
    const commandPayload = () =>
      TransferTokenCommandBuilder.get(
        TokenType.ERC20,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
      )
        .amount('0x64')
        .from(scenario.address)
        .recipient(scenario.recipient)
        .build()

    it(`Success with large amount`, async () => {
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

    it(`Success with small amount`, async () => {
      scenario.checkError()

      const { operation, asyncResult } = await scenario.runCommand(
        Commands.transferTokenCommand,
        TransferTokenCommandBuilder.get(
          TokenType.ERC20,
          AUTOMATIC,
          AUTOMATIC,
          AUTOMATIC,
          AUTOMATIC,
        )
          .amount(
            '0x0000000000000000000000000000000000000000000000000000000000000064',
          )
          .from(scenario.address)
          .recipient(scenario.recipient)
          .build(),
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
          ...tokensTransferRequestMock,
          account: undefined,
        }),
      ).rejects.toThrow('Request failed with status code 422')
    })

    it('Throws without permission', async () => {
      try {
        await scenario.runRequest(
          transferTokenPut,
          {
            ...tokensTransferRequestMock,
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
        tokensTransferRequestMock,
      )
    })

    it('Handles multiple requests with same idempotency keys', async () => {
      await handlesMultipleRequestsWithSameIdempotencyKeys(
        scenario,
        transferTokenPut,
        tokensTransferRequestMock,
      )
    })
  })
})
