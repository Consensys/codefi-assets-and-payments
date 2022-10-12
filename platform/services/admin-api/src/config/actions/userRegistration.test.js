const { onExecutePostLogin: action } = require('./userRegistration')
const { runAction } = require('./test/utils')
const { default: axios } = require('axios')

describe('Action - User Registration', () => {
  const clientNameMock = 'TestClientName'
  const accessTokenMock = 'TestAccessToken'

  const secretsMock = {
    ADMIN_APPS: clientNameMock,
    TOKEN_ENDPOINT: 'TestTokenEndpoint',
    CLIENT_ID: 'TestClientId',
    CLIENT_SECRET: 'TestClientSecret',
    API_AUDIENCE: 'TestAudience',
    USER_REGISTRATION_CALLBACK_URL: 'TestCallbackUrl',
  }

  const eventMock = {
    secrets: secretsMock,
    client: {
      name: clientNameMock,
    },
    user: {},
  }

  let axiosMock

  beforeAll(async () => {
    axiosMock = {
      post: jest.fn(),
    }

    jest.mock('axios', () => axiosMock)
  })

  beforeEach(async () => {
    axiosMock.post.mockReset()
  })

  it('updates user app metadata if register request indicated registered', async () => {
    axiosMock.post
      .mockImplementationOnce(() => ({}))
      .mockImplementationOnce(() => ({ data: { registered: true } }))

    const api = await runAction(action, eventMock)

    expect(api.user.setAppMetadata).toHaveBeenCalledTimes(1)
    expect(api.user.setAppMetadata).toHaveBeenCalledWith('registered', true)
  })

  it('sends token request using credentials in secrets', async () => {
    axiosMock.post
      .mockImplementationOnce(() => ({}))
      .mockImplementationOnce(() => ({ registered: true }))

    const api = await runAction(action, eventMock)

    expect(axiosMock.post).toHaveBeenCalledWith(secretsMock.TOKEN_ENDPOINT, {
      grant_type: 'client_credentials',
      client_id: secretsMock.HOOK_CLIENT_ID,
      client_secret: secretsMock.HOOK_CLIENT_SECRET,
      audience: secretsMock.API_AUDIENCE,
    })
  })

  it('sends register request with event data and access token from token request', async () => {
    axiosMock.post
      .mockImplementationOnce(() => ({
        data: { access_token: accessTokenMock },
      }))
      .mockImplementationOnce(() => ({ registered: true }))

    const api = await runAction(action, eventMock)

    expect(axiosMock.post).toHaveBeenCalledWith(
      `${secretsMock.USER_REGISTRATION_CALLBACK_URL}/auth/hook/register`,
      {
        ...eventMock,
      },
      {
        headers: {
          Authorization: `Bearer ${accessTokenMock}`,
        },
        timeout: 15000,
      },
    )
  })

  it('rejects request if token request fails', async () => {
    axiosMock.post.mockImplementation(() => {
      throw new Error()
    })

    const api = await runAction(action, eventMock)

    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith('Error registering user: ERR1')
  })

  it('rejects request if register request fails', async () => {
    axiosMock.post
      .mockImplementationOnce(() => ({}))
      .mockImplementationOnce(() => {
        throw new Error()
      })

    const api = await runAction(action, eventMock)

    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith('Error registering user: ERR2')
  })

  it('rejects request if register request does not return valid response', async () => {
    axiosMock.post
      .mockImplementationOnce(() => ({}))
      .mockImplementationOnce(() => ({}))

    const api = await runAction(action, eventMock)

    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith('Error registering user: ERR3')
  })

  it('rejects request if updating user app metadata fails', async () => {
    axiosMock.post
      .mockImplementationOnce(() => ({}))
      .mockImplementationOnce(() => ({ data: { registered: true } }))

    const api = await runAction(action, eventMock, {
      user: {
        setAppMetadata: jest.fn(() => {
          throw new Error()
        }),
      },
    })

    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith('Error registering user: ERR4')
  })

  it('does nothing if application is not eligible', async () => {
    const api = await runAction(action, {
      ...eventMock,
      secrets: { ...secretsMock, ADMIN_APPS: '' },
    })

    expect(axiosMock.post).not.toHaveBeenCalled()
    expect(api.user.setAppMetadata).not.toHaveBeenCalled()
    expect(api.access.deny).not.toHaveBeenCalled()
  })
})
