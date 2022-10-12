const { onExecutePostLogin: action } = require('./createTenantForInfuraUser')
const { runAction } = require('./test/utils')

describe('Action - Create Tenant For Infura User', () => {
  const mockInfuraConnectionName = 'Infura'

  const secretsMock = {
    M2M_TOKEN_ADMIN_CLIENT_ID: 'm2m-token-admin-client-id',
    M2M_TOKEN_ADMIN_CLIENT_SECRET: 'm2m-token-admin-client-secret',
    CODEFI_API_RESOURCE_SERVER_IDENTIFIER:
      'codefi-api-resource-server-identifier',
    AUTH0_TENANT_DOMAIN: 'auth0-tenant-domain',
    INFURA_CONNECTION_NAME: mockInfuraConnectionName,
  }
  const userMock = {
    user_id: 'oauth2|Infura|uuid',
  }
  const expectedUserId = userMock.user_id.replace('oauth2|Infura|', 'infura-')
  const connectionMock = {
    name: mockInfuraConnectionName,
  }
  const eventMock = {
    secrets: secretsMock,
    user: userMock,
    connection: connectionMock,
  }

  let axiosMock
  beforeAll(async () => {
    axiosMock = {
      post: jest.fn(),
      get: jest.fn(),
    }
    jest.mock('axios', () => axiosMock)
  })

  beforeEach(async () => {
    axiosMock.post.mockReset()
    axiosMock.get.mockReset()
  })

  it('does nothing if user is not authenticated with Infura', async () => {
    const api = await runAction(action, {
      ...eventMock,
      connection: {
        name: 'NotInfura',
      },
    })
    expect(api.user.setAppMetadata).toHaveBeenCalledTimes(0)
  })

  it('throws error if token request fails', async () => {
    const mockErrorMsg = 'mock error'
    axiosMock.post.mockImplementationOnce(() => {
      throw new Error(mockErrorMsg)
    })
    const api = await runAction(action, eventMock)
    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith(
      `Failed to get access token for entity API: Error: ${mockErrorMsg}`,
    )
  })

  it('throws error if tenant request fails', async () => {
    const mockErrorMsg = '{"response":{"status":400}}'
    const mockAccessToken = 'mock-access-token'
    axiosMock.post.mockImplementationOnce(() => ({
      data: {
        access_token: mockAccessToken,
      },
    }))
    axiosMock.get.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          status: 400,
        },
      })
    })
    const api = await runAction(action, eventMock)
    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith(
      `Could not check if tenant exists: ${mockErrorMsg}`,
    )
  })

  it('throws error if create tenant request fails', async () => {
    const mockErrorMsg = 'mock error'
    const mockAccessToken = 'mock-access-token'
    axiosMock.post
      .mockImplementationOnce(() => ({
        data: {
          access_token: mockAccessToken,
        },
      }))
      .mockImplementationOnce(() => {
        throw new Error(mockErrorMsg)
      })
    axiosMock.get.mockImplementationOnce(() => ({
      status: 404,
    }))
    const api = await runAction(action, eventMock)
    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith(
      `Could not create tenant: Error: ${mockErrorMsg}`,
    )
  })

  it('throws error if create tenant fails without success status code', async () => {
    const mockAccessToken = 'mock-access-token'
    axiosMock.post
      .mockImplementationOnce(() => ({
        data: {
          access_token: mockAccessToken,
        },
      }))
      .mockImplementationOnce(() => ({
        status: 500,
      }))
    axiosMock.get.mockImplementationOnce(() => ({
      status: 404,
    }))
    const api = await runAction(action, eventMock)
    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith(
      `Tenant creation failed with status 500`,
    )
  })

  it('throws error if set user metadata fails', async () => {
    const mockAccessToken = 'mock-access-token'
    const mockErrorMsg = 'mock error'
    axiosMock.post
      .mockImplementationOnce(() => ({
        data: {
          access_token: mockAccessToken,
        },
      }))
      .mockImplementationOnce(() => ({
        status: 201,
      }))
    axiosMock.get.mockImplementationOnce(() => ({
      status: 404,
    }))
    const api = await runAction(action, eventMock, {
      user: {
        setAppMetadata: jest.fn(() => {
          throw new Error(mockErrorMsg)
        }),
      },
    })
    expect(api.access.deny).toHaveBeenCalledTimes(1)
    expect(api.access.deny).toHaveBeenCalledWith(`Error registering tenantId`)
  })

  it('sets user metadata', async () => {
    const mockAccessToken = 'mock-access-token'
    axiosMock.post
      .mockImplementationOnce(() => ({
        data: {
          access_token: mockAccessToken,
        },
      }))
      .mockImplementationOnce(() => ({
        status: 201,
      }))
    axiosMock.get.mockImplementationOnce(() => ({
      status: 404,
    }))
    const api = await runAction(action, eventMock, {
      user: {
        setAppMetadata: jest.fn(),
      },
    })
    expect(axiosMock.post.mock.calls[1][1].id).toBe(expectedUserId)
    expect(api.user.setAppMetadata).toHaveBeenCalledTimes(2)
    expect(api.user.setAppMetadata).toHaveBeenCalledWith(
      'tenantId',
      expectedUserId,
    )
    expect(api.user.setAppMetadata).toHaveBeenCalledWith(expectedUserId, {
      entityId: expectedUserId,
      roles: ['Tenant Admin', 'Wallet Owner'],
    })
  })

  it('does not call to create tenant if tenant exists', async () => {
    const mockAccessToken = 'mock-access-token'

    axiosMock.post.mockImplementationOnce(() => ({
      data: {
        access_token: mockAccessToken,
      },
    }))

    axiosMock.get.mockImplementationOnce(() => ({
      status: 200,
    }))

    const api = await runAction(action, eventMock, {
      user: {
        setAppMetadata: jest.fn(),
      },
    })

    expect(axiosMock.post).toHaveBeenCalledTimes(1)
    expect(api.user.setAppMetadata).toHaveBeenCalledTimes(0)
  })
})
