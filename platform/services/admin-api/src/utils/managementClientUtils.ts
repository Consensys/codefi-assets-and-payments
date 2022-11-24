import { Client, Connection, PagingOptions, ResourceServer } from 'auth0'
import { NestJSPinoLogger } from '@consensys/observability'
import cfg from '../config'
import { ManagementClientExtended } from '../types/Auth0ManagementClientExtended'
import { getAllResultPaginated } from './paginationUtils'

export const getAllApis = async (
  managementClient: ManagementClientExtended,
  logger?: NestJSPinoLogger,
): Promise<ResourceServer[]> => {
  return await getAll(
    managementClient,
    managementClient.getResourceServers,
    logger,
    'all apis',
  )
}

export const getAllClients = async (
  managementClient: ManagementClientExtended,
  logger?: NestJSPinoLogger,
): Promise<Client[]> => {
  return await getAll(
    managementClient,
    managementClient.getClients,
    logger,
    'all clients',
  )
}

export const getClientGrants = async (
  clientId: string,
  managementClient: ManagementClientExtended,
  logger?: NestJSPinoLogger,
): Promise<Client[]> => {
  return await getAll(
    managementClient,
    managementClient.getClientGrants,
    logger.logger.child({ clientId }),
    'all client grants',
    { client_id: clientId },
  )
}

export const getAllConnections = async (
  managementClient: ManagementClientExtended,
  logger?: NestJSPinoLogger,
): Promise<Connection[]> => {
  return await getAll(
    managementClient,
    managementClient.getConnections,
    logger,
    'all connections',
  )
}

export const getAll = async <T>(
  managementClient: ManagementClientExtended,
  clientMethod: (params: PagingOptions) => Promise<T[]>,
  logger?: any,
  message?: string,
  data?: any,
): Promise<T[]> => {
  if (logger) logger.info(`Retrieving ${message}`)

  const allItems = await getAllResultPaginated(
    async (skip: number, limit: number) => {
      return (await clientMethod.bind(managementClient)({
        per_page: limit,
        page: skip,
        ...(data || {}),
      })) as T[]
    },
    cfg().defaults.skip,
    cfg().defaults.limit,
  )

  if (logger)
    logger.info({ itemCount: allItems.length }, `Retrieved ${message}`)

  return allItems
}

export const createConnection = async (
  managementClient: ManagementClientExtended,
  logger: NestJSPinoLogger,
  existingConnections: Connection[],
  params: any,
): Promise<Connection> => {
  const loggerInstance = logger.logger.child({ connectionName: params.name })
  const existingConnection = existingConnections.find(
    (connection) => connection.name === params.name,
  )

  if (existingConnection) {
    loggerInstance.info(`Connection already exists`)
    return existingConnection
  }

  loggerInstance.info(`Creating connection`)
  try {
    const result = await managementClient.createConnection(
      params,
      // params.options are not docummented. According to auth0, an internal ticket was created
      // to amend documentation:
      // https://community.auth0.com/t/disable-signups-via-management-api/38761/2
      // There are some undocummented resources, e.g.:
      // https://www.terraform.io/docs/providers/auth0/r/connection.html
    )
    loggerInstance.info(`Created connection`)
    return result
  } catch (error) {
    loggerInstance.error({ error }, `Failed to create connection`)
  }
}
