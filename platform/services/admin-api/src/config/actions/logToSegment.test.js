const { onExecutePostLogin: action } = require('./logToSegment')
const { runAction } = require('./test/utils')

describe('Action - Log To Segment', () => {
  const clientNameMock = 'TestClient'

  const secretsMock = {
    SEGMENT_KEY: 'TestSegmentKey',
    ADMIN_APPS: clientNameMock,
  }

  const createEventMock = (requestQueryPrompt = 'none', loginCount = 123) => ({
    secrets: secretsMock,
    client: {
      name: clientNameMock,
      client_id: 'TestClientId',
    },
    connection: 'TestConnection',
    request: {
      query: {
        prompt: requestQueryPrompt,
      },
      user_agent: 'TestUserAgent',
      ip: 'TestIp',
    },
    user: {
      user_id: 'TestUserId',
      email: 'TestEmail',
      created_at: new Date().getTime(),
    },
    stats: {
      logins_count: loginCount,
    },
  })

  let analyticsMock
  let analyticsClientMock

  beforeAll(async () => {
    analyticsClientMock = {
      track: jest.fn(),
      identify: jest.fn(),
      flush: jest.fn(),
    }

    analyticsMock = jest.fn(() => analyticsClientMock)

    jest.mock('analytics-node', () => analyticsMock, {
      virtual: true,
    })
  })

  beforeEach(async () => {
    analyticsClientMock.track.mockReset()
    analyticsClientMock.identify.mockReset()
    analyticsClientMock.flush.mockReset()
  })

  it('creates client using segment key', async () => {
    await runAction(action, createEventMock())
    expect(analyticsMock).toHaveBeenCalledWith(
      secretsMock.SEGMENT_KEY,
      expect.any(Object),
    )
  })

  it('tracks but does not identify during silent account login when request query prompt is none', async () => {
    const eventMock = createEventMock('none')
    await runAction(action, eventMock)

    expect(analyticsClientMock.flush).toHaveBeenCalledTimes(1)
    expect(analyticsClientMock.identify).toHaveBeenCalledTimes(0)

    expect(analyticsClientMock.track).toHaveBeenCalledTimes(1)
    expect(analyticsClientMock.track).toHaveBeenCalledWith({
      userId: eventMock.user.user_id,
      event: 'Silent Account Login',
      properties: {
        client_name: eventMock.client.name,
        client_id: eventMock.client.client_id,
        connection: eventMock.connection,
        login_count: eventMock.stats.logins_count,
      },
      context: {
        userAgent: eventMock.request.user_agent,
        ip: eventMock.request.ip,
      },
    })
  })

  it('tracks and identifies when account created when request query prompt is not none and login count is 1', async () => {
    const eventMock = createEventMock('other', 1)
    await runAction(action, eventMock)

    expect(analyticsClientMock.flush).toHaveBeenCalledTimes(1)
    expect(analyticsClientMock.track).toHaveBeenCalledTimes(1)
    expect(analyticsClientMock.track).toHaveBeenCalledWith({
      userId: eventMock.user.user_id,
      event: 'Account Created',
      properties: {
        client_name: eventMock.client.name,
        client_id: eventMock.client.client_id,
        connection: eventMock.connection,
        login_count: eventMock.stats.logins_count,
      },
      context: {
        userAgent: eventMock.request.user_agent,
        ip: eventMock.request.ip,
      },
    })

    expect(analyticsClientMock.identify).toHaveBeenCalledTimes(1)
    expect(analyticsClientMock.identify).toHaveBeenCalledWith({
      userId: eventMock.user.user_id,
      traits: {
        email: eventMock.user.email,
        signed_up: eventMock.user.created_at,
        login_count: eventMock.stats.logins_count,
      },
      context: {
        userAgent: eventMock.request.user_agent,
        ip: eventMock.request.ip,
      },
    })
  })

  it('tracks and identifies during account login when request query prompt is not none and login count is not 1', async () => {
    const eventMock = createEventMock('other', 2)
    await runAction(action, eventMock)

    expect(analyticsClientMock.flush).toHaveBeenCalledTimes(1)
    expect(analyticsClientMock.track).toHaveBeenCalledTimes(1)
    expect(analyticsClientMock.track).toHaveBeenCalledWith({
      userId: eventMock.user.user_id,
      event: 'Account Login',
      properties: {
        client_name: eventMock.client.name,
        client_id: eventMock.client.client_id,
        connection: eventMock.connection,
        login_count: eventMock.stats.logins_count,
      },
      context: {
        userAgent: eventMock.request.user_agent,
        ip: eventMock.request.ip,
      },
    })

    expect(analyticsClientMock.identify).toHaveBeenCalledTimes(1)
    expect(analyticsClientMock.identify).toHaveBeenCalledWith({
      userId: eventMock.user.user_id,
      traits: {
        email: eventMock.user.email,
        signed_up: eventMock.user.created_at,
        login_count: eventMock.stats.logins_count,
      },
      context: {
        userAgent: eventMock.request.user_agent,
        ip: eventMock.request.ip,
      },
    })
  })

  it('does nothing if application is not eligible', async () => {
    const eventMock = {
      ...createEventMock(),
      secrets: { ...secretsMock, ADMIN_APPS: '' },
    }

    await runAction(action, eventMock)

    expect(analyticsClientMock.flush).toHaveBeenCalledTimes(0)
    expect(analyticsClientMock.track).toHaveBeenCalledTimes(0)
    expect(analyticsClientMock.identify).toHaveBeenCalledTimes(0)
  })
})
