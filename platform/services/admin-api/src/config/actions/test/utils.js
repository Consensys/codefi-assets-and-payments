const runAction = async (action, event, api) => {
  const mockApi = {
    accessToken: {
      setCustomClaim: jest.fn(),
    },
    idToken: {
      setCustomClaim: jest.fn(),
    },
    multifactor: {
      enable: jest.fn(),
    },
    access: {
      deny: jest.fn(),
    },
    user: {
      setAppMetadata: jest.fn(),
      setUserMetadata: jest.fn(),
    },
    ...api,
  }

  const originalLog = console.log
  console.log = jest.fn()

  await action(event, mockApi)

  console.log = originalLog

  return mockApi
}

module.exports = { runAction }
