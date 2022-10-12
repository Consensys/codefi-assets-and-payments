// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')

const mockAccessToken = 'ACCESS_TOKEN'
const mockResponseResult = {
  statusCode: 200,
  body: JSON.stringify({
    result: {
      user: {
        id: '12345',
        email: 'john.doe@gmail.com',
      },
    },
  }),
}

const mockedRequestCallbackFn = jest.fn((options, cb) =>
  cb(null, mockResponseResult),
)
jest.mock('request', () => mockedRequestCallbackFn, { virtual: true })

describe('FetchUserProfile script', () => {
  const getScriptFn = async (name, dir = 'src/config/scripts') => {
    const rawScript = (
      await fs.promises.readFile(`${dir}/${name}.js`)
    ).toString()
    eval(`var scriptFn = ${rawScript}`)
    return scriptFn
  }

  let scriptFn
  let callback
  beforeAll(async () => {
    jest.clearAllMocks()
    scriptFn = await getScriptFn('fetchUserProfile')
    callback = jest.fn()
  })
  it('execute callback with profile', () => {
    const expectedProfile = {
      user_id: '12345',
      given_name: 'Infura',
      family_name: 'Infura',
      email: 'john.doe@gmail.com',
    }
    scriptFn(mockAccessToken, {}, callback)

    expect(callback).toHaveBeenCalledWith(null, expectedProfile)
  })

  it('execute callback with error', () => {
    const mockErrorMsg = 'Mock error'
    mockedRequestCallbackFn.mockImplementationOnce((options, cb) =>
      cb(mockErrorMsg),
    )
    scriptFn(mockAccessToken, {}, callback)

    expect(callback).toHaveBeenCalledWith(
      new Error(`Error response from Infura API. ${mockErrorMsg}`),
    )
  })

  it('execute callback with error if status is not 200', () => {
    mockedRequestCallbackFn.mockImplementationOnce((options, cb) =>
      cb(null, {
        ...mockResponseResult,
        statusCode: 400,
      }),
    )
    scriptFn(mockAccessToken, {}, callback)

    expect(callback).toHaveBeenCalledWith(
      new Error('Response status code is 400 from Infura API'),
    )
  })

  it('execute callback with error if body is undefined', () => {
    mockedRequestCallbackFn.mockImplementationOnce((options, cb) =>
      cb(null, {
        ...mockResponseResult,
        body: undefined,
      }),
    )
    scriptFn(mockAccessToken, {}, callback)

    expect(callback).toHaveBeenCalledWith(
      new Error(
        `Missing 'body' field in response from Infura API (%INFURA_USER_API_URL%).`,
      ),
    )
  })

  it('execute callback with error if body cannot be parsed', () => {
    mockedRequestCallbackFn.mockImplementationOnce((options, cb) =>
      cb(null, {
        ...mockResponseResult,
        body: '////',
      }),
    )
    scriptFn(mockAccessToken, {}, callback)

    expect(callback).toHaveBeenCalledWith(
      new Error(
        `Invalid 'body' field in response from Infura API (%INFURA_USER_API_URL%), it can't be parsed as a JSON.`,
      ),
    )
  })

  it('execute callback with error if result is undefined', () => {
    mockedRequestCallbackFn.mockImplementationOnce((options, cb) =>
      cb(null, {
        ...mockResponseResult,
        body: JSON.stringify({
          result: undefined,
        }),
      }),
    )
    scriptFn(mockAccessToken, {}, callback)

    expect(callback).toHaveBeenCalledWith(
      new Error(
        `Missing 'result' field in response body from Infura API (%INFURA_USER_API_URL%).`,
      ),
    )
  })

  it('execute callback with error if result.user is undefined', () => {
    mockedRequestCallbackFn.mockImplementationOnce((options, cb) =>
      cb(null, {
        ...mockResponseResult,
        body: JSON.stringify({
          result: {},
        }),
      }),
    )
    scriptFn(mockAccessToken, {}, callback)

    expect(callback).toHaveBeenCalledWith(
      new Error(
        `Missing 'user' field in response body result from Infura API (%INFURA_USER_API_URL%).`,
      ),
    )
  })
})
