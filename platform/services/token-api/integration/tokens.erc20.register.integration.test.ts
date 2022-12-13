import { AUTOMATIC, TestScenario } from './utils/scenario'
import { chainNameMock, tokensMintRequestMock } from '../test/mocks'
import { EntityStatus, TokenType } from '@consensys/ts-types'
import { mintTokenPut, registerTokenPost } from './utils/requests'
import { Commands, RegisterTokenCommandBuilder } from '@consensys/messaging-events'
import {
  handlesMultipleCommandsWithSameIdempotencyKeys,
  handlesMultipleCommandsWithSameOperationIds,
  handlesMultipleRequestsWithSameOperationIds,
} from './utils/templates'

require('dotenv').config()

jest.setTimeout(160000)

describe('ERC20 - Register', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC20 - Register')
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

  describe('HTTP Endpoint', () => {
    it('Success', async () => {
      scenario.checkError()

      const originalToken = await scenario.tokenRepo.findOne({
        id: scenario.token.id,
      })

      await scenario.runRequest(
        registerTokenPost,
        {
          contractAddress: originalToken.contractAddress,
          type: TokenType.ERC20,
        },
        {
          simulateExternalToken: true,
          requiresToken: false,
          hasTransaction: false,
        },
      )

      const newToken = await scenario.tokenRepo.findOne({
        contractAddress: originalToken.contractAddress,
      })

      expect(newToken).toBeDefined()
      scenario.token = newToken

      const { operation: mintOperation } = await scenario.runRequest(
        mintTokenPut,
        {
          ...tokensMintRequestMock,
          tokenAddress: newToken.contractAddress,
        },
      )

      expect(mintOperation.status).toEqual(EntityStatus.Confirmed)
    })

    it('Handles multiple requests with same operation ids', async () => {
      const originalToken = await scenario.tokenRepo.findOne({
        id: scenario.token.id,
      })

      await handlesMultipleRequestsWithSameOperationIds(
        scenario,
        registerTokenPost,
        {
          contractAddress: originalToken.contractAddress,
          type: TokenType.ERC20,
        },
        {
          simulateExternalToken: true,
          requiresToken: false,
          hasTransaction: false,
        },
      )
    })
  })
})
