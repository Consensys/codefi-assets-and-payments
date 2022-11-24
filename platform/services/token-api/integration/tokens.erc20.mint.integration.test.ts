import { mintTokenPut } from './utils/requests'
import { tokensMintRequestMock } from '../test/mocks'
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

describe('ERC20 - Mint', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC20 - Mint')
    await scenario.init()
    await scenario.cleanRepos()
    await scenario.createToken(TokenType.ERC20)
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
        TokenType.ERC20,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
        AUTOMATIC,
      )
        .account(scenario.address)
        .amount('0x64')
        .build()

    it('Success with large amount', async () => {
      scenario.checkError()

      const { operation, asyncResult, message } = await scenario.runCommand(
        Commands.tokenMintCommand,
        commandPayload(),
      )

      expect(message.type).toEqual(TokenType.ERC20)
      expect(message.operationId).toEqual(operation.id)
      expect(message.account).toEqual(scenario.address)

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
    })

    it('Success with small amount', async () => {
      scenario.checkError()

      const { operation, asyncResult, message } = await scenario.runCommand(
        Commands.tokenMintCommand,
        MintTokenCommandBuilder.get(
          TokenType.ERC20,
          AUTOMATIC,
          AUTOMATIC,
          AUTOMATIC,
          AUTOMATIC,
        )
          .account(scenario.address)
          .amount(
            '0x0000000000000000000000000000000000000000000000000000000000000064',
          )
          .build(),
      )

      expect(message.type).toEqual(TokenType.ERC20)
      expect(message.operationId).toEqual(operation.id)
      expect(message.account).toEqual(scenario.address)

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
    })

    it('Success with very large amount', async () => {
      scenario.checkError()

      const { operation, asyncResult, message } = await scenario.runCommand(
        Commands.tokenMintCommand,
        MintTokenCommandBuilder.get(
          TokenType.ERC20,
          AUTOMATIC,
          AUTOMATIC,
          AUTOMATIC,
          AUTOMATIC,
        )
          .account(scenario.address)
          .amount(
            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          )
          .build(),
      )

      expect(message.type).toEqual(TokenType.ERC20)
      expect(message.operationId).toEqual(operation.id)
      expect(message.account).toEqual(scenario.address)

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.result).toBe(true)
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

  describe('HTTP Endpoint', () => {
    const requestArgs = () => ({
      ...tokensMintRequestMock,
      account: scenario.address,
      amount:
        '0x0000000000000000000000000000000000000000000000000000000000000064',
    })

    it('Success when submitted by another node', async () => {
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

    it('Throws without account', async () => {
      await expect(
        scenario.runRequest(mintTokenPut, {
          ...tokensMintRequestMock,
          account: undefined,
        }),
      ).rejects.toThrow('Request failed with status code 422')
    })

    it('Throws without permission', async () => {
      try {
        await scenario.runRequest(
          mintTokenPut,
          {
            ...tokensMintRequestMock,
            account: scenario.address,
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
