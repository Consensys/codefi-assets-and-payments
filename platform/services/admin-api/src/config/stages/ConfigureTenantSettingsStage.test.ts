import { ConfigConstants } from '../ConfigConstants'
import { ConfigStageRequest } from '../types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockManagementClient,
} from '../../../test/utils'
import { ManagementClientExtended } from '../../types/Auth0ManagementClientExtended'
import { ConfigureTenantSettingsStage } from './ConfigureTenantSettingsStage'

describe('ConfigureTenantSettingsStage', () => {
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let requestMock: ConfigStageRequest
  let stage: ConfigureTenantSettingsStage

  beforeEach(() => {
    managementClientMock = createMockManagementClient()
    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
    })
    stage = new ConfigureTenantSettingsStage()
  })

  it('updates tenant settings', async () => {
    await stage.run(requestMock)

    expect(managementClientMock.updateTenantSettings).toHaveBeenCalledTimes(1)
    expect(managementClientMock.updateTenantSettings).toHaveBeenCalledWith({
      default_directory: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
    })
  })
})
