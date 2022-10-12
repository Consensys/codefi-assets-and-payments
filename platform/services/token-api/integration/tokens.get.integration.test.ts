import { getTokens } from './utils/requests'
import { TokenQueryRequest, TokenType } from '@codefi-assets-and-payments/ts-types'
import { TestScenario } from './utils/scenario'
import { TokenEntity } from 'src/data/entities/TokenEntity'
import { MAX_PAGINATED_LIMIT } from '../src/validation/ApiRequestsSchema'

require('dotenv').config()

jest.setTimeout(160000)

describe('Tokens - Get', () => {
  let scenario: TestScenario
  let totalItems = 3
  let tokensDeployed: TokenEntity[] = []

  beforeAll(async () => {
    scenario = new TestScenario('Tokens - Get')
    await scenario.init()

    for (let i = 0; i < totalItems; i++) {
      tokensDeployed.push(await scenario.createToken(TokenType.ERC20))
    }
  })

  afterAll(async () => {
    await scenario.cleanMessages()
    await scenario.cleanRepos()
    await scenario.destroy()
  })

  it('Success getting all', async () => {
    scenario.checkError()

    const request: TokenQueryRequest = {}

    const { data: tokens } = await getTokens(
      request,
      scenario.authTokenWithTenantId,
    )

    expect(tokens).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining(
          tokensDeployed.map((token) =>
            expect.objectContaining({
              id: token.id,
              type: token.type,
              name: token.name,
              symbol: token.symbol,
              decimals: token.decimals,
            }),
          ),
        ),
        count: totalItems,
        skip: 0,
        limit: MAX_PAGINATED_LIMIT,
      }),
    )
  })

  it('Success getting all paginated', async () => {
    scenario.checkError()

    const limit = 2

    let returnedItems = 0
    while (returnedItems < totalItems) {
      const { data: result } = await getTokens(
        {
          skip: returnedItems,
          limit,
        },
        scenario.authTokenWithTenantId,
      )

      const expectedItems =
        result.items.length === limit ? limit : result.count % limit

      expect(result.items.length).toEqual(expectedItems)

      returnedItems += result.items.length
    }

    expect(returnedItems).toEqual(totalItems)
  })

  it('Success getting queried item', async () => {
    scenario.checkError()

    const request: TokenQueryRequest = {
      contractAddress: tokensDeployed[0].contractAddress,
      chainName: tokensDeployed[0].chainName,
    }

    const { data: tokens } = await getTokens(
      request,
      scenario.authTokenWithTenantId,
    )

    expect(tokens.count).toEqual(1)
    expect(tokens.items[0].id).toEqual(tokensDeployed[0].id)
  })

  it('Success if no items match the query', async () => {
    scenario.checkError()

    const request: TokenQueryRequest = {
      transactionId: 'fake-transaction-id',
    }

    const { data: tokens } = await getTokens(
      request,
      scenario.authTokenWithTenantId,
    )

    expect(tokens.count).toEqual(0)
    expect(tokens.items).toEqual([])
  })
})
