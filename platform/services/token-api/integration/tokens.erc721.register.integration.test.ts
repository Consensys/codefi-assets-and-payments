import { TestScenario } from './utils/scenario'
import { tokensERC721MintRequestMock } from '../test/mocks'
import { EntityStatus, TokenType } from '@codefi-assets-and-payments/ts-types'
import { mintTokenPut, registerTokenPost } from './utils/requests'
import { handlesMultipleRequestsWithSameOperationIds } from './utils/templates'

require('dotenv').config()

jest.setTimeout(160000)

describe('ERC721 - Register', () => {
  let scenario: TestScenario

  beforeAll(async () => {
    scenario = new TestScenario('ERC721 - Register')
    await scenario.init()
  })

  beforeEach(async () => {
    await scenario.cleanRepos()
    await scenario.cleanMessages()
    await scenario.createToken(TokenType.ERC721)
  })

  afterEach(async () => {
    await scenario.cleanRepos()
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
          type: TokenType.ERC721,
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
          ...tokensERC721MintRequestMock,
          tokenAddress: newToken.contractAddress,
          to: scenario.address,
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
          type: TokenType.ERC721,
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
