import { ConfigConstants } from '../ConfigConstants'
import { ConfigStageRequest } from '../types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockManagementClient,
} from '../../../test/utils'
import { ManagementClientExtended } from '../../types/Auth0ManagementClientExtended'
import { CreateM2MClientsStage } from './CreateM2MClientsStage'
import { ClientService } from '../../services/ClientService'
import createMockInstance from 'jest-create-mock-instance'
import { ClientResponse } from '../../responses/ClientResponse'
import { superTenantId } from '@codefi-assets-and-payments/auth'
import { superEntityId } from '@codefi-assets-and-payments/auth/dist/utils/authUtils'

describe('CreateM2MClientStage', () => {
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let clientServiceMock: jest.Mocked<ClientService>
  let requestMock: ConfigStageRequest
  let stage: CreateM2MClientsStage

  const clientResponseMock: ClientResponse = {
    clientId: 'client_id_mock',
    clientSecret: 'client_secret_mock',
    description: 'description mock',
    name: 'name mock',
    appType: 'non_interactive',
    clientMetadata: {},
  }

  beforeEach(() => {
    managementClientMock = createMockManagementClient()
    clientServiceMock = createMockInstance(ClientService)

    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
      clientService: clientServiceMock,
    })

    stage = new CreateM2MClientsStage()

    clientServiceMock.createClient.mockImplementation(
      async () => clientResponseMock,
    )

    clientServiceMock.updateClient.mockImplementation(
      async () => clientResponseMock,
    )
  })

  it('creates clients and creates grants', async () => {
    await stage.run(requestMock)

    expect(clientServiceMock.createClient).toHaveBeenCalledTimes(2)

    expect(clientServiceMock.createClient).toHaveBeenCalledWith({
      name: ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_CODEFI,
      description: '',
      appType: 'non_interactive',
      tenantId: superTenantId,
      entityId: superEntityId,
    })

    expect(clientServiceMock.createClient).toHaveBeenCalledWith({
      name: ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_ADMIN,
      description: '',
      appType: 'non_interactive',
      tenantId: superTenantId,
      entityId: superEntityId,
    })

    expect(clientServiceMock.updateClient).toHaveBeenCalledTimes(0)

    expect(managementClientMock.createClientGrant).toHaveBeenCalledTimes(2)
    expect(managementClientMock.createClientGrant).toHaveBeenCalledWith({
      audience: ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
      client_id: clientResponseMock.clientId,
      scope:
        ConfigConstants.API_SCOPES[
          ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER
        ],
    })
    expect(managementClientMock.createClientGrant).toHaveBeenCalledWith({
      audience: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
      client_id: clientResponseMock.clientId,
      scope:
        ConfigConstants.API_SCOPES[
          ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER
        ],
    })

    expect(managementClientMock.updateClientGrant).toHaveBeenCalledTimes(0)
  })

  it('updates grants if clients already exists', async () => {
    managementClientMock.getClients.mockImplementationOnce(() => [
      {
        name: ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_CODEFI,
        client_id: clientResponseMock.clientId,
      },
      {
        name: ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_ADMIN,
        client_id: clientResponseMock.clientId,
      },
    ])

    managementClientMock.getClientGrants.mockImplementationOnce(() => [
      {
        id: 'ClientGrant2',
        audience: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
      },
    ])
    managementClientMock.getClientGrants.mockImplementationOnce(() => [])

    managementClientMock.getClientGrants.mockImplementationOnce(() => [
      {
        id: 'ClientGrant1',
        audience: ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
      },
    ])

    await stage.run(requestMock)

    expect(clientServiceMock.createClient).toHaveBeenCalledTimes(0)

    expect(clientServiceMock.updateClient).toHaveBeenCalledTimes(2)
    expect(clientServiceMock.updateClient).toHaveBeenCalledWith(
      {
        name: ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_CODEFI,
        description: '',
        appType: 'non_interactive',
        tenantId: superTenantId,
        entityId: superEntityId,
      },
      clientResponseMock.clientId,
    )
    expect(clientServiceMock.updateClient).toHaveBeenCalledWith(
      {
        name: ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_ADMIN,
        description: '',
        appType: 'non_interactive',
        tenantId: superTenantId,
        entityId: superEntityId,
      },
      clientResponseMock.clientId,
    )

    expect(managementClientMock.updateClientGrant).toHaveBeenCalledTimes(2)
    expect(managementClientMock.updateClientGrant).toHaveBeenCalledWith(
      { id: 'ClientGrant1' },
      {
        scope:
          ConfigConstants.API_SCOPES[
            ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER
          ],
      },
    )
    expect(managementClientMock.updateClientGrant).toHaveBeenCalledWith(
      { id: 'ClientGrant2' },
      {
        scope:
          ConfigConstants.API_SCOPES[
            ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER
          ],
      },
    )
  })
})
