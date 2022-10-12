import {
  createDatabase,
  installExtensions,
  requiredEnvs,
  validateEnvironment,
} from '.'
import { Client } from 'pg'
import Environment from './environment.interface'

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  }
  return { Client: jest.fn(() => mClient) }
})

const logger = {
  log(...args: any[]) {
    return args
  },
  error(...args: any[]) {
    return args
  },
}

describe('validateEnvironment', () => {
  it('should return missing fields if one of the environment variables is not present', () => {
    const incompleteEnvironment = {
      DB_ADMIN_PASSWORD: null,
      DB_USERNAME: null,
      DB_PASSWORD: null,
      DB_HOST: null,
    }

    const expectedResults = requiredEnvs.reduce((acc, current) => {
      return incompleteEnvironment.hasOwnProperty(current)
        ? acc
        : acc.concat([current])
    }, [])

    expect(validateEnvironment(incompleteEnvironment as Environment)).toEqual(expectedResults)
  })
})

describe('createDatabase', () => {
  let client
  beforeEach(() => {
    client = new Client()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  const testEnvironment: Environment = {
    DB_ADMIN_USER: 'root',
    DB_ADMIN_PASSWORD: 'rootpassword',
    DB_HOST: 'database.com',
    DB_USERNAME: 'user',
    DB_PASSWORD: 'password',
    DB_DATABASE_NAME: 'database-name',
  }

  it('should connect to the database and check if the db exists, and not create it if it does', async () => {
    // Database exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })

    // User exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })

    const result = await createDatabase(testEnvironment, logger)

    expect(
      client.query,
    ).toHaveBeenCalledWith('SELECT 1 FROM pg_database WHERE datname=($1)', [
      testEnvironment.DB_DATABASE_NAME,
    ])

    expect(result.dbCreated).toEqual(false)
  })

  it('should create the database if it does not exist', async () => {
    // Database does not exist
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

    //Database created
    client.query.mockResolvedValueOnce('whatever')

    // User exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })

    const result = await createDatabase(testEnvironment, logger)

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'SELECT 1 FROM pg_database WHERE datname=($1)',
      [testEnvironment.DB_DATABASE_NAME],
    )
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      `CREATE DATABASE "${testEnvironment.DB_DATABASE_NAME}";`,
    )

    expect(result.dbCreated).toEqual(true)
  })

  it('should throw if database creation fails', async () => {
    // Database does not exist
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    client.query.mockRejectedValueOnce('some failure')

    await expect(createDatabase(testEnvironment, logger)).rejects.toBe('some failure')

    client.query.mockReset()
  })

  it('should check if the user exists and not create it if it does', async () => {
    // Database exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })
    // User exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })

    const result = await createDatabase(testEnvironment, logger)

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'SELECT 1 FROM pg_database WHERE datname=($1)',
      [testEnvironment.DB_DATABASE_NAME],
    )
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'SELECT 1 FROM pg_roles WHERE rolname=($1)',
      [testEnvironment.DB_USERNAME],
    )

    expect(result.userCreated).toEqual(false)
  })

  it('should create the user if it does not exist', async () => {
    // Database exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })
    // User does not exist
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

    // Create user
    client.query.mockResolvedValueOnce('whatever')

    const result = await createDatabase(testEnvironment, logger)

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'SELECT 1 FROM pg_database WHERE datname=($1)',
      [testEnvironment.DB_DATABASE_NAME],
    )
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'SELECT 1 FROM pg_roles WHERE rolname=($1)',
      [testEnvironment.DB_USERNAME],
    )
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      `CREATE USER "${testEnvironment.DB_USERNAME}" with encrypted password '${testEnvironment.DB_PASSWORD}'`,
    )

    expect(result.userCreated).toEqual(true)
  })

  it('should throw if user creation fails', async () => {
    // Database does not exist
    // Database exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })
    // User does not exist
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

    client.query.mockRejectedValueOnce('some failure')

    await expect(createDatabase(testEnvironment, logger)).rejects.toBe('some failure')
    client.query.mockReset()
  })

  it('should throw if granting privileges doesnt work', async () => {
    // Database exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })
    // User does exist
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })

    // Grant privileges to user
    client.query.mockRejectedValueOnce('some failure')

    await expect(createDatabase(testEnvironment, logger)).rejects.toBe('some failure')

    client.query.mockReset()
  })

  it('should grant privileges on the database', async () => {
    // Database exists
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })
    // User does exist
    client.query.mockResolvedValueOnce({ rows: ['1'], rowCount: 1 })

    // Grant privileges to user
    client.query.mockResolvedValueOnce('whatever')

    const result = await createDatabase(testEnvironment, logger)

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'SELECT 1 FROM pg_database WHERE datname=($1)',
      [testEnvironment.DB_DATABASE_NAME],
    )
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'SELECT 1 FROM pg_roles WHERE rolname=($1)',
      [testEnvironment.DB_USERNAME],
    )
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      `GRANT ALL PRIVILEGES ON DATABASE "${testEnvironment.DB_DATABASE_NAME}" to ${testEnvironment.DB_USERNAME}`,
    )

    expect(result.userCreated).toEqual(false)
    expect(result.accessGranted).toEqual(true)
  })
})

describe('installExtensions', () => {
  let client
  beforeEach(() => {
    client = new Client()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  const doNotinstallExtensions: Environment = {
    DB_ADMIN_USER: 'root',
    DB_ADMIN_PASSWORD: 'rootpassword',
    DB_HOST: 'database.com',
    DB_USERNAME: 'user',
    DB_PASSWORD: 'password',
    DB_DATABASE_NAME: 'database-name',
  }

  it('should not install any extensions if they are not set', async () => {
    const result = await installExtensions(doNotinstallExtensions, logger)

    expect(client.query).toBeCalledTimes(0)

    expect(result.run).toEqual(false)
  })

  const installOneExtension: Environment = {
    DB_ADMIN_USER: 'root',
    DB_ADMIN_PASSWORD: 'rootpassword',
    DB_HOST: 'database.com',
    DB_USERNAME: 'user',
    DB_PASSWORD: 'password',
    DB_DATABASE_NAME: 'database-name',
    DB_EXTENSIONS: 'extension1',
  }

  it('should install one extension if DB_EXTENSIONS has just one extension', async () => {
    const result = await installExtensions(installOneExtension, logger)

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'CREATE EXTENSION IF NOT EXISTS "extension1"',
    )
    expect(result.run).toEqual(true)
    expect(result.installedExtensionsSuccesfully).toEqual(true)
    expect(result.installedExtensions.length).toEqual(1)
  })

  const installMultipleExtensions: Environment = {
    DB_ADMIN_USER: 'root',
    DB_ADMIN_PASSWORD: 'rootpassword',
    DB_HOST: 'database.com',
    DB_USERNAME: 'user',
    DB_PASSWORD: 'password',
    DB_DATABASE_NAME: 'database-name',
    DB_EXTENSIONS: 'extension1,extension2',
  }

  it('should install all extensions', async () => {
    const result = await installExtensions(installMultipleExtensions, logger)

    expect(client.query).toHaveBeenCalledTimes(2)

    expect(client.query.mock.calls[0]).toEqual([
      'CREATE EXTENSION IF NOT EXISTS "extension1"',
    ])
    expect(client.query.mock.calls[1]).toEqual([
      'CREATE EXTENSION IF NOT EXISTS "extension2"',
    ])

    expect(result.run).toEqual(true)
    expect(result.installedExtensionsSuccesfully).toEqual(true)
    expect(result.installedExtensions.length).toEqual(2)
  })
})
