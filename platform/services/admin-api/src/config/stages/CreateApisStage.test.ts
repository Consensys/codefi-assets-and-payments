import { ConfigConstants } from '../ConfigConstants'
import { ConfigStageRequest } from '../types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockManagementClient,
} from '../../../test/utils'
import { ManagementClientExtended } from 'src/types/Auth0ManagementClientExtended'
import { CreateApisStage } from './CreateApisStage'
import { initialCodefiApiScopes } from '../../../test/mocks'

describe('CreateApisStage', () => {
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let requestMock: ConfigStageRequest
  let stage: CreateApisStage

  beforeEach(() => {
    managementClientMock = createMockManagementClient()
    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
    })
    stage = new CreateApisStage()
  })

  it('creates admin api', async () => {
    managementClientMock.getResourceServers.mockImplementationOnce(() => [
      { name: ConfigConstants.AUTH0_MANAGEMENT_API_NAME },
      { identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER },
    ])

    await stage.run(requestMock)

    expect(managementClientMock.getResourceServers).toHaveBeenCalledTimes(2)
    expect(managementClientMock.createResourceServer).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createResourceServer).toHaveBeenCalledWith({
      identifier: ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
      name: ConfigConstants.ADMIN_API_RESOURCE_SERVER_NAME,
      signing_alg: 'RS256',
      scopes: ConfigConstants.ADMIN_API_SCOPES,
      enforce_policies: true,
      token_dialect: 'access_token_authz',
    })
  })

  it('creates codefi api', async () => {
    managementClientMock.getResourceServers.mockImplementationOnce(() => [
      { name: ConfigConstants.AUTH0_MANAGEMENT_API_NAME },
      { identifier: ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER },
    ])

    await stage.run(requestMock)

    expect(managementClientMock.getResourceServers).toHaveBeenCalledTimes(2)
    expect(managementClientMock.createResourceServer).toHaveBeenCalledTimes(1)
    expect(managementClientMock.createResourceServer).toHaveBeenCalledWith({
      identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
      name: ConfigConstants.CODEFI_API_RESOURCE_SERVER_NAME,
      signing_alg: 'RS256',
      scopes: initialCodefiApiScopes,
      enforce_policies: true,
      token_dialect: 'access_token_authz',
    })
  })

  it('does nothing if all apis already exist', async () => {
    managementClientMock.getResourceServers.mockImplementationOnce(() => [
      { name: ConfigConstants.AUTH0_MANAGEMENT_API_NAME },
      { identifier: ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER },
      { identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER },
    ])

    await stage.run(requestMock)

    expect(managementClientMock.getResourceServers).toHaveBeenCalledTimes(2)
    expect(managementClientMock.createResourceServer).toHaveBeenCalledTimes(0)
  })
})
