import { ConfigConstants } from '../ConfigConstants'
import { ConfigStageRequest } from '../types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockManagementClient,
} from '../../../test/utils'
import { ManagementClientExtended } from 'src/types/Auth0ManagementClientExtended'
import { ConfigureTenantSettingsStage } from './ConfigureTenantSettingsStage'
import { CreateApplicationsStage } from './CreateApplicationsStage'
import cfg from '../../config'
import { ClientService } from '../../services/ClientService'
import createMockInstance from 'jest-create-mock-instance'
import { ClientResponse } from '../../responses/ClientResponse'
import { FileSystemInstance } from '../../services/instances/FileSystemInstance'

const mockedFileDetail = 'FILE_DETAIL'
const mockInfuraConnectionId = 'INFURA_CONNECTION_ID'

describe('CreateApplicationsStage', () => {
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let clientServiceMock: jest.Mocked<ClientService>
  let fsMock: jest.Mocked<FileSystemInstance>
  let requestMock: ConfigStageRequest
  let stage: ConfigureTenantSettingsStage

  const clientResponseMock: ClientResponse = {
    clientId: 'client_id_mock',
    clientSecret: 'client_secret_mock',
    description: 'description mock',
    name: 'name mock',
    appType: 'non_interactive',
    clientMetadata: {},
  }

  const emailInviteClientMock = [
    { name: ConfigConstants.EMAIL_INVITE_ONLY_APPLICATION_NAME },
  ]

  const emailInviteConnectionMock = [
    { name: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME },
  ]

  beforeEach(() => {
    managementClientMock = createMockManagementClient()
    clientServiceMock = createMockInstance(ClientService)
    fsMock = createMockInstance(FileSystemInstance)

    fsMock.instance.mockReturnValue({
      readFileSync: jest.fn(() => mockedFileDetail),
    })

    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
      clientService: clientServiceMock,
      fs: fsMock,
    })

    stage = new CreateApplicationsStage()

    cfg().initialConfig.emailInviteApplication = 'true'

    managementClientMock.getClients.mockImplementation(() => [])
    managementClientMock.getConnections.mockImplementationOnce(() => [
      {
        name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        enabled_clients: [],
      },
    ])
    managementClientMock.getResourceServers.mockImplementationOnce(() => [
      { name: ConfigConstants.AUTH0_MANAGEMENT_API_NAME },
    ])
    clientServiceMock.createClient.mockImplementation(
      async () => clientResponseMock,
    )
    managementClientMock.createConnection.mockImplementation(async () => ({
      id: mockInfuraConnectionId,
    }))
  })

  it('creates applications and connection', async () => {
    cfg().actions.isMaster = false

    await stage.run(requestMock)

    expect(managementClientMock.updateTenantSettings).toHaveBeenCalledTimes(6)
    expect(clientServiceMock.createClient).toHaveBeenCalledTimes(3)
    expect(managementClientMock.createClientGrant).toHaveBeenCalledTimes(2)
    expect(managementClientMock.createConnection).toHaveBeenCalledTimes(2)
  })

  it('does not create email invite application if it exists', async () => {
    managementClientMock.getClients.mockImplementationOnce(
      () => emailInviteClientMock,
    )

    await stage.run(requestMock)

    expect(managementClientMock.updateTenantSettings).toHaveBeenCalledTimes(4)
    expect(clientServiceMock.createClient).toHaveBeenCalledTimes(2)
    expect(managementClientMock.createClientGrant).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createConnection).toHaveBeenCalledTimes(2)
  })

  it('does not create email invite connection if it exists', async () => {
    managementClientMock.getConnections.mockImplementationOnce(
      () => emailInviteConnectionMock,
    )

    await stage.run(requestMock)

    expect(managementClientMock.updateTenantSettings).toHaveBeenCalledTimes(6)
    expect(clientServiceMock.createClient).toHaveBeenCalledTimes(3)
    expect(managementClientMock.createClientGrant).toHaveBeenCalledTimes(2)
    // Checks createConnection only called for Infura connection
    expect(managementClientMock.createConnection).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          scripts: expect.objectContaining({
            fetchUserProfile: `// Script created by ${
              cfg().core.appName
            } \n ${mockedFileDetail}`,
          }),
        }),
      }),
    )
  })

  it('throws if management api does not exist', async () => {
    managementClientMock.getResourceServers.mockReset()
    managementClientMock.getResourceServers.mockImplementationOnce(() => [
      { identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER },
      { identifier: ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER },
    ])

    await expect(stage.run(requestMock)).rejects.toThrowError(
      'Auth0 Management API not found',
    )
  })

  it('updates default connection with additional enabled clients', async () => {
    const existingEnabledClientsMock = ['mockClient1', 'mockClient2']
    const connectionIdMock = 'testConnection1'

    managementClientMock.getConnections.mockReset()
    managementClientMock.getConnections.mockImplementationOnce(() => [
      {
        id: connectionIdMock,
        name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        enabled_clients: existingEnabledClientsMock,
      },
    ])

    await stage.run(requestMock)

    expect(managementClientMock.updateConnection).toHaveBeenCalledTimes(1)
    expect(managementClientMock.updateConnection).toHaveBeenCalledWith(
      { id: connectionIdMock },
      {
        enabled_clients: [
          ...existingEnabledClientsMock,
          clientResponseMock.clientId,
          cfg().auth0.clientId,
        ],
      },
    )
  })

  it('skips update of default connection if enabled clients already correct', async () => {
    const existingEnabledClientsMock = [
      'mockClient1',
      'mockClient2',
      clientResponseMock.clientId,
      cfg().auth0.clientId,
    ]
    const connectionIdMock = 'testConnection1'

    managementClientMock.getConnections.mockReset()
    managementClientMock.getConnections.mockImplementationOnce(() => [
      {
        id: connectionIdMock,
        name: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
        enabled_clients: existingEnabledClientsMock,
      },
    ])

    await stage.run(requestMock)

    expect(managementClientMock.updateConnection).toHaveBeenCalledTimes(0)
  })
})
