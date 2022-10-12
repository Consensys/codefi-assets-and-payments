import { ConfigConstants } from '../ConfigConstants'
import cfg from '../../config'
import { ConfigureEmailProviderStage } from './ConfigureEmailProviderStage'
import { ConfigStageRequest } from '../types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockManagementClient,
} from '../../../test/utils'
import { ManagementClientExtended } from 'src/types/Auth0ManagementClientExtended'
import { mockErrorMessage } from '../../../test/mocks'

describe('ConfigureEmailProviderStage', () => {
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let requestMock: ConfigStageRequest
  let stage: ConfigureEmailProviderStage

  beforeEach(() => {
    managementClientMock = createMockManagementClient()
    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
    })
    stage = new ConfigureEmailProviderStage()
  })

  it('does nothing if provider exists', async () => {
    await stage.run(requestMock)
    expect(
      requestMock.managementClient.configureEmailProvider,
    ).toHaveBeenCalledTimes(0)
  })

  it('configures provider if none exists ', async () => {
    managementClientMock.getEmailProvider.mockImplementationOnce(() => {
      throw {
        statusCode: 404,
      }
    })

    await stage.run(requestMock)

    expect(managementClientMock.configureEmailProvider).toHaveBeenCalledTimes(1)
    expect(managementClientMock.configureEmailProvider).toHaveBeenCalledWith({
      name: ConfigConstants.EMAIL_PROVIDER_NAME,
      credentials: {
        api_key: cfg().initialConfig.emailProviderApiKey,
      },
    })
  })

  it('throws if retrieving provider fails with status other than 404', async () => {
    managementClientMock.getEmailProvider.mockImplementationOnce(() => {
      throw new Error(mockErrorMessage)
    })

    await expect(stage.run(requestMock)).rejects.toThrowError(mockErrorMessage)

    expect(managementClientMock.configureEmailProvider).toHaveBeenCalledTimes(0)
  })
})
