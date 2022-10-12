import {
  Commands,
  DeployTokenCommandBuilder,
  Events,
  ITokenDeployedEvent,
} from '@codefi-assets-and-payments/messaging-events'
import { AUTOMATIC, TestScenario } from './utils/scenario'
import { tokensERC721DeployRequestMock } from '../test/mocks'
import { EntityStatus } from '@codefi-assets-and-payments/ts-types'
import { deployTokenPost } from './utils/requests'
import {
  handlesMultipleCommandsWithSameIdempotencyKeys,
  handlesMultipleCommandsWithSameOperationIds,
  handlesMultipleRequestsWithSameIdempotencyKeys,
  handlesMultipleRequestsWithSameOperationIds,
} from './utils/templates'

require('dotenv').config()

jest.setTimeout(160000)

describe('ERC721 - Deploy', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC721 - Deploy')
    await scenario.init()
  })

  beforeEach(async () => {
    await scenario.cleanRepos()
    await scenario.cleanMessages()
  })

  afterEach(async () => {
    await scenario.cleanRepos()
  })

  afterAll(async () => {
    await scenario.destroy()
  })

  describe('Kafka Command', () => {
    const commandPayload = DeployTokenCommandBuilder.get(
      tokensERC721DeployRequestMock.type,
      tokensERC721DeployRequestMock.name,
      tokensERC721DeployRequestMock.symbol,
      null,
      AUTOMATIC,
      AUTOMATIC,
      AUTOMATIC,
      AUTOMATIC,
    ).build()

    it('Success', async () => {
      scenario.checkError()

      const { operation, asyncResult } = await scenario.runCommand(
        Commands.tokenDeployCommand,
        commandPayload,
      )

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()

      expect(asyncResult.result).toBe(true)
      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.transactionHash).toBe(operation.transactionHash)

      const token = await scenario.tokenRepo.findOne({
        operationId: operation.id,
      })

      expect(token.status).toBe(EntityStatus.Confirmed)
      expect(token.contractAddress).toBeDefined()

      const { confidential, config, ...expectedToken } =
        tokensERC721DeployRequestMock

      expect(token).toEqual(expect.objectContaining(expectedToken))
    })

    it('Handles multiple commands with same operation ids', async () => {
      await handlesMultipleCommandsWithSameOperationIds(
        scenario,
        Commands.tokenDeployCommand,
        commandPayload,
      )
    })

    it('Handles multiple commands with same idempotency keys', async () => {
      await handlesMultipleCommandsWithSameIdempotencyKeys(
        scenario,
        Commands.tokenDeployCommand,
        commandPayload,
      )
    })
  })

  describe('HTTP Endpoint', () => {
    it('Success', async () => {
      scenario.checkError()

      const { response, operation, asyncResult } = await scenario.runRequest(
        deployTokenPost,
        tokensERC721DeployRequestMock,
      )

      expect(response.status).toBe(202)
      expect(response.data).toBeDefined()

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()

      expect(asyncResult.operationId).toBe(operation.id)
      expect(asyncResult.transactionHash).toBe(operation.transactionHash)

      const token = await scenario.tokenRepo.findOne({
        transactionId: response.data.token.transactionId,
      })
      expect(token.status).toBe(EntityStatus.Confirmed)
      expect(token.contractAddress).toBeDefined()
    })
    it('Success when submitted by alternate node', async () => {
      scenario.checkError()

      await scenario.addSubscriber(
        'deployed',
        Events.tokenDeployedEvent.getMessageName(),
      )

      const { response, operation } = await scenario.runRequest(
        deployTokenPost,
        tokensERC721DeployRequestMock,
        { simulateExternalToken: true, simulateExternalOperation: true },
      )

      expect(response.status).toBe(202)
      expect(response.data).toBeDefined()

      expect(operation.status).toBe(EntityStatus.Confirmed)
      expect(operation.blockNumber).toBeDefined()
      expect(operation.transactionHash).toBeDefined()

      const deployedEvent: ITokenDeployedEvent =
        await scenario.getConsumedMessage('deployed')
      expect(deployedEvent.blockNumber).toBeDefined()
      expect(deployedEvent.transactionHash).toBeDefined()
      expect(deployedEvent.deployerAddress).toBeDefined()
      expect(deployedEvent.contractAddress).toBeDefined()

      const token = await scenario.tokenRepo.findOne({
        transactionId: response.data.token.transactionId,
      })
      expect(token.status).toBe(EntityStatus.Confirmed)
      expect(token.contractAddress).toBeDefined()
    })

    it('Throws if token has no type', async () => {
      scenario.checkError()
      try {
        await scenario.runRequest(deployTokenPost, {
          ...tokensERC721DeployRequestMock,
          type: undefined,
        })
        fail('should not reach this line')
      } catch (error) {
        expect(error.response.status).toBe(422)
      }
    })

    it('Throws when user does not have permission', async () => {
      scenario.checkError()
      try {
        await scenario.runRequest(
          deployTokenPost,
          tokensERC721DeployRequestMock,
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
        deployTokenPost,
        tokensERC721DeployRequestMock,
      )
    })

    it('Handles multiple requests with same idempotency keys', async () => {
      await handlesMultipleRequestsWithSameIdempotencyKeys(
        scenario,
        deployTokenPost,
        tokensERC721DeployRequestMock,
      )
    })
  })
})
