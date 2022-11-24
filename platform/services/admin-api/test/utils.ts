import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { FileSystemInstance } from '../src/services/instances/FileSystemInstance'
import { ManagementClientExtended } from '../src/types/Auth0ManagementClientExtended'
import { ConfigStageRequest } from '../src/config/types/ConfigStage'
import { ClientService } from '../src/services/ClientService'
import { ClientCredentials } from '../src/config/types/ClientCredentials'

export const deepClone = (data: any) => JSON.parse(JSON.stringify(data))

export const mockFileArray = async (file: string, data: any[]) => {
  const fileData: any[] = (await import(file)).default
  const originalData: any[] = deepClone(fileData)

  fileData.length = 0
  fileData.push(...data)

  return {
    reset: () => {
      fileData.length = 0
      fileData.push(...originalData)
    },
  }
}

// Based on:
// https://stackoverflow.com/questions/66391541/jest-advancetimersbytime-doesnt-work-when-i-try-to-test-my-retry-util-function
// https://github.com/facebook/jest/issues/2157#issuecomment-279171856
const tick = () => new Promise((res) => setImmediate(res))
export const advanceTimersByTime = async (time: number) =>
  jest.advanceTimersByTime(time) && (await tick())
export const runOnlyPendingTimers = async () =>
  jest.runOnlyPendingTimers() && (await tick())
export const runAllTimers = async () => jest.runAllTimers() && (await tick())

export const waitWithFakeTimers = async <T>(
  promise: Promise<T>,
): Promise<T> => {
  let resolved = false

  promise
    .then(() => {
      resolved = true
    })
    .catch(() => {
      resolved = true
    })

  while (!resolved) {
    await runOnlyPendingTimers()
  }

  return promise
}

export const createMockLogger = (isChild = false, loggerMockOverride?: any) => {
  const loggerMock = loggerMockOverride || createMockInstance(NestJSPinoLogger)
  const childMethod = jest.fn(() => createMockLogger(true, loggerMock))

  if (isChild) {
    return { ...loggerMock, child: childMethod }
  }

  Object.defineProperty(loggerMock, 'logger', {
    get: jest.fn(() => ({
      child: childMethod,
    })),
  })

  return loggerMock
}

export const createMockManagementClient =
  (): jest.Mocked<ManagementClientExtended> =>
    ({
      getEmailProvider: jest.fn(),
      configureEmailProvider: jest.fn(),
      updateTenantSettings: jest.fn(),
      getResourceServers: jest.fn(),
      createResourceServer: jest.fn(),
      updateResourceServer: jest.fn(),
      getRoles: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      getUsersByEmail: jest.fn(),
      assignRolestoUser: jest.fn(),
      createClientGrant: jest.fn(),
      updateClientGrant: jest.fn(),
      getClients: jest.fn(),
      getClientGrants: jest.fn(),
      getPermissionsInRole: jest.fn(),
      createRole: jest.fn(),
      addPermissionsInRole: jest.fn(),
      removePermissionsFromRole: jest.fn(),
      getConnections: jest.fn(),
      createConnection: jest.fn(),
      updateConnection: jest.fn(),
      actions: {
        getAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deploy: jest.fn(),
        updateTriggerBindings: jest.fn(),
      },
    } as unknown as jest.Mocked<ManagementClientExtended>)

export const createMockConfigStageRequest = ({
  managementClient = createMockManagementClient(),
  clientService = createMockInstance(ClientService),
  fs = createMockInstance(FileSystemInstance),
  logger = createMockLogger(),
  clientCredentials = undefined,
}: {
  managementClient?: ManagementClientExtended
  clientService?: ClientService
  fs?: FileSystemInstance
  logger?: NestJSPinoLogger
  clientCredentials?: ClientCredentials
} = {}): ConfigStageRequest =>
  ({
    managementClient,
    clientService,
    fs,
    logger,
    clientCredentials,
  } as unknown as ConfigStageRequest)
