import { Client } from 'pg'
import Environment from './environment.interface'
import CreateDatabaseResult from './createdatabaseresult.interface'
import InstallExtensionsResult from './installextensionsresult.interface'
import Logger from './logger.interface'

export const requiredEnvs: string[] = [
  'DB_ADMIN_USER', // the admin user, used to create the database
  'DB_ADMIN_PASSWORD',
  'DB_USERNAME', // the application user that will be granted access and subsequently used to access the DB
  'DB_PASSWORD',
  'DB_DATABASE_NAME', // the database to be created
  'DB_HOST',
] // DB_PORT is not required, but allowed

/* Returns a list of missing environment variables */
export function validateEnvironment(env: Environment): string[] {
  const missing = []

  for (const variable of requiredEnvs) {
    if (!env.hasOwnProperty(variable)) {
      missing.push(variable)
    }
  }
  return missing
}

export async function createDatabase(
  env: Environment,
  logger: Logger,
): Promise<CreateDatabaseResult> {
  const client = new Client({
    user: env.DB_ADMIN_USER,
    password: env.DB_ADMIN_PASSWORD,
    port: parseInt(env.DB_PORT) || 5432,
    host: env.DB_HOST,
  })

  await client.connect()

  const result: CreateDatabaseResult = {
    dbCreated: null,
    userCreated: null,
    accessGranted: null,
  }

  // Check if the database exists
  // We could just use CREATE DATABASE IF NOT EXISTS here but this allows us to meaningfully log what's happening

  const dbExistsQuery = 'SELECT 1 FROM pg_database WHERE datname=($1)'
  const dbExistsRes = await client.query(dbExistsQuery, [env.DB_DATABASE_NAME])

  if (dbExistsRes.rowCount) {
    logger.log(`Database ${env.DB_DATABASE_NAME} exists`)
    result.dbCreated = false
  } else {
    logger.log(`Database ${env.DB_DATABASE_NAME} does not exist; creating...`)
    const createDbQuery = `CREATE DATABASE "${env.DB_DATABASE_NAME}";` // Can't seem to parameterise this query, but the risk of injection is low
    try {
      await client.query(createDbQuery)
      result.dbCreated = true
    } catch (e) {
      logger.error(`Error creating database ${env.DB_DATABASE_NAME}`)
      throw e
    }
  }

  // If we haven't encountered an error, continue by checking if the user exists

  const userExistsQuery = 'SELECT 1 FROM pg_roles WHERE rolname=($1)'
  const userExistsRes = await client.query(userExistsQuery, [env.DB_USERNAME])

  if (userExistsRes.rowCount) {
    logger.log(`User ${env.DB_USERNAME} exists`)
    result.userCreated = false
  } else {
    logger.log(`User ${env.DB_USERNAME} does not exist; creating...`)

    const createUserQuery = `CREATE USER "${env.DB_USERNAME}" with encrypted password '${env.DB_PASSWORD}'` //Also cannot be parameterised
    try {
      await client.query(createUserQuery)
      result.userCreated = true
    } catch (e) {
      logger.error(`Error creating user ${env.DB_USERNAME}`)
      throw e
    }
  }

  // Continue by granting full access to that user for that database

  // This action is idempotent, so we don't need to check whether the access exists already

  const grantPrivilegesQuery = `GRANT ALL PRIVILEGES ON DATABASE "${env.DB_DATABASE_NAME}" to ${env.DB_USERNAME}`

  try {
    await client.query(grantPrivilegesQuery)
    result.accessGranted = true
  } catch (e) {
    logger.error(
      `Error granting privileges to ${env.DB_USERNAME} on ${env.DB_DATABASE_NAME}`,
    )
    throw e
  }

  await client.end()
  return result
}

export async function installExtensions(
  env: Environment,
  logger: Logger,
): Promise<InstallExtensionsResult> {
  const client = new Client({
    user: env.DB_ADMIN_USER,
    password: env.DB_ADMIN_PASSWORD,
    database: env.DB_DATABASE_NAME,
    port: parseInt(env.DB_PORT) || 5432,
    host: env.DB_HOST,
  })

  const result: InstallExtensionsResult = {
    installedExtensions: [],
    installedExtensionsSuccesfully: false,
    run: false,
  }

  if (!env.DB_EXTENSIONS) {
    logger.log('No extensions configured. Nothing to do')
    return result
  } else {
    //check if string has , if it does split, otherwise assume it's just one
    const extensions = []

    if (env.DB_EXTENSIONS.indexOf(',') >= 0) {
      extensions.push(...env.DB_EXTENSIONS.split(','))
    } else {
      extensions.push(env.DB_EXTENSIONS)
    }

    await client.connect()
    result.run = true
    for (const extension of extensions) {
      logger.log(`Installing extension "${extension}" `)
      const installExtensionsQuery = `CREATE EXTENSION IF NOT EXISTS "${extension}"`

      try {
        await client.query(installExtensionsQuery)
        result.installedExtensions.push(extension)
        result.installedExtensionsSuccesfully = true
      } catch (e) {
        logger.error(
          `Error granting privileges to ${env.DB_USERNAME} on ${env.DB_DATABASE_NAME}`,
        )
        throw e
      }
    }

    await client.end()
    return result
  }
}
