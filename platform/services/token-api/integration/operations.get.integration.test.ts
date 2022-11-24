import { TestScenario } from './utils/scenario'
import { TokenEntity } from 'src/data/entities/TokenEntity'
import { MAX_PAGINATED_LIMIT } from '../src/validation/ApiRequestsSchema'
import { TokenOperationQueryRequest, TokenType } from '@consensys/ts-types'
import { getOperations } from './utils/requests'

require('dotenv').config()

jest.setTimeout(160000)

describe('Operations - Get', () => {
  let scenario: TestScenario
  let totalItems = 3
  let tokensDeployed: TokenEntity[] = []

  beforeAll(async () => {
    scenario = new TestScenario('Operations - Get')
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

    const { data: operations } = await getOperations(
      {},
      scenario.authTokenWithTenantId,
    )

    expect(operations.count).toEqual(totalItems)
    expect(operations).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining(
          tokensDeployed.map((token) =>
            expect.objectContaining({
              id: token.operationId,
              transactionId: token.transactionId,
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
      const { data: result } = await getOperations(
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

    const request: TokenOperationQueryRequest = {
      transactionId: tokensDeployed[0].transactionId,
    }

    const { data: operations } = await getOperations(
      request,
      scenario.authTokenWithTenantId,
    )

    expect(operations.count).toEqual(1)
    expect(operations.items[0].id).toEqual(tokensDeployed[0].operationId)
  })

  it('Success if no items match the query', async () => {
    scenario.checkError()

    const request: TokenOperationQueryRequest = {
      id: 'fake-operation-id',
    }

    const { data: tokens } = await getOperations(
      request,
      scenario.authTokenWithTenantId,
    )

    expect(tokens.count).toEqual(0)
    expect(tokens.items).toEqual([])
  })
})
