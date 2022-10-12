const { onExecuteCredentialsExchange: action } = require('./m2mRateLimit')
const { runAction } = require('./test/utils')

describe('Action - M2M Rate Limit', () => {
  const clientIdMock = 'TestClientId'
  const tenantIdMock = 'TestTenantId'

  const secretsMock = {
    DISABLE_RATE_LIMIT_TENANTS: '',
    RATE_LIMIT_MAX_ATTEMPTS: '5',
    RATE_LIMIT_PERIOD_IN_SECONDS: '600',
  }

  const eventMock = {
    secrets: secretsMock,
    tenant: {
      id: tenantIdMock,
    },
    client: {
      client_id: clientIdMock,
    },
  }
  const redisKeyMock = `${eventMock.client.client_id}-limiter`

  let redisClientMock

  beforeEach(async () => {
    redisClientMock = {
      connect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      decr: jest.fn(),
    }

    const redisMock = {
      createClient: () => redisClientMock,
    }

    jest.mock('redis', () => redisMock, { virtual: true })
  })

  it('skips rate limiting if tenant is exempt', async () => {
    await runAction(action, {
      ...eventMock,
      secrets: { ...secretsMock, DISABLE_RATE_LIMIT_TENANTS: tenantIdMock },
    })

    expect(redisClientMock.get).not.toHaveBeenCalled()
    expect(redisClientMock.set).not.toHaveBeenCalled()
  })

  it('rejects request if error when setting up key', async () => {
    redisClientMock.set.mockRejectedValueOnce(new Error())

    const api = await runAction(action, eventMock)

    expect(api.access.deny).toHaveBeenCalledWith(
      'server_error',
      'Error checking token rate limit: ERR1',
    )
    expect(redisClientMock.set).toHaveBeenCalledTimes(1)
    expect(redisClientMock.set).toHaveBeenCalledWith(
      redisKeyMock,
      parseInt(secretsMock.RATE_LIMIT_MAX_ATTEMPTS),
      {
        EX: parseInt(secretsMock.RATE_LIMIT_PERIOD_IN_SECONDS),
        NX: true,
      },
    )
  })

  it('rejects request if error when fetching key', async () => {
    redisClientMock.get.mockRejectedValueOnce(new Error())

    const api = await runAction(action, eventMock)

    expect(api.access.deny).toHaveBeenCalledWith(
      'server_error',
      'Error checking token rate limit: ERR2',
    )
    expect(redisClientMock.set).toHaveBeenCalledTimes(1)
    expect(redisClientMock.set).toHaveBeenCalledWith(
      redisKeyMock,
      parseInt(secretsMock.RATE_LIMIT_MAX_ATTEMPTS),
      {
        EX: parseInt(secretsMock.RATE_LIMIT_PERIOD_IN_SECONDS),
        NX: true,
      },
    )
    expect(redisClientMock.get).toHaveBeenCalledTimes(1)
    expect(redisClientMock.get).toHaveBeenCalledWith(redisKeyMock)
  })

  it.each([['0', '-1']])('rejects request if rate limit hit', async value => {
    redisClientMock.get.mockResolvedValueOnce(value)

    const api = await runAction(action, eventMock)

    expect(api.access.deny).toHaveBeenCalledWith(
      'invalid_request',
      `Rate limit of ${secretsMock.RATE_LIMIT_MAX_ATTEMPTS} in ${secretsMock.RATE_LIMIT_PERIOD_IN_SECONDS} seconds reached`,
    )
    expect(redisClientMock.set).toHaveBeenCalledTimes(1)
    expect(redisClientMock.set).toHaveBeenCalledWith(
      redisKeyMock,
      parseInt(secretsMock.RATE_LIMIT_MAX_ATTEMPTS),
      {
        EX: parseInt(secretsMock.RATE_LIMIT_PERIOD_IN_SECONDS),
        NX: true,
      },
    )
    expect(redisClientMock.get).toHaveBeenCalledTimes(1)
    expect(redisClientMock.get).toHaveBeenCalledWith(redisKeyMock)
  })

  it('rejects request if error when decreasing counter', async () => {
    redisClientMock.get.mockResolvedValueOnce(
      secretsMock.RATE_LIMIT_MAX_ATTEMPTS,
    )
    redisClientMock.decr.mockRejectedValueOnce(new Error())

    const api = await runAction(action, eventMock)

    expect(api.access.deny).toHaveBeenCalledWith(
      'server_error',
      `Error checking token rate limit: ERR3`,
    )
    expect(redisClientMock.set).toHaveBeenCalledTimes(1)
    expect(redisClientMock.set).toHaveBeenCalledWith(
      redisKeyMock,
      parseInt(secretsMock.RATE_LIMIT_MAX_ATTEMPTS),
      {
        EX: parseInt(secretsMock.RATE_LIMIT_PERIOD_IN_SECONDS),
        NX: true,
      },
    )
    expect(redisClientMock.get).toHaveBeenCalledTimes(1)
    expect(redisClientMock.get).toHaveBeenCalledWith(redisKeyMock)
    expect(redisClientMock.decr).toHaveBeenCalledTimes(1)
    expect(redisClientMock.decr).toHaveBeenCalledWith(redisKeyMock)
  })

  it('updates counter if rate limit not hit', async () => {
    redisClientMock.get.mockResolvedValueOnce(
      secretsMock.RATE_LIMIT_MAX_ATTEMPTS,
    )

    await runAction(action, eventMock)

    expect(redisClientMock.set).toHaveBeenCalledTimes(1)
    expect(redisClientMock.set).toHaveBeenCalledWith(
      redisKeyMock,
      parseInt(secretsMock.RATE_LIMIT_MAX_ATTEMPTS),
      {
        EX: parseInt(secretsMock.RATE_LIMIT_PERIOD_IN_SECONDS),
        NX: true,
      },
    )
    expect(redisClientMock.get).toHaveBeenCalledTimes(1)
    expect(redisClientMock.get).toHaveBeenCalledWith(redisKeyMock)
    expect(redisClientMock.decr).toHaveBeenCalledTimes(1)
    expect(redisClientMock.decr).toHaveBeenCalledWith(redisKeyMock)
  })
})
