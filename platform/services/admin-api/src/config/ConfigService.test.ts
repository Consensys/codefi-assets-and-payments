import { ConfigStageRequest } from './types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockManagementClient,
} from './../../test/utils'
import { ManagementClientExtended } from 'src/types/Auth0ManagementClientExtended'
import { ConfigService } from './ConfigService'
import { NestJSPinoLogger } from '@consensys/observability'
import { FileSystemInstance } from '../services/instances/FileSystemInstance'
import { Auth0Service } from '../services/Auth0Service'
import { ClientService } from '../services/ClientService'
import { createMockLogger } from '../../test/utils'
import createMockInstance from 'jest-create-mock-instance'
import { ConfigureEmailProviderStage } from './stages/ConfigureEmailProviderStage'
import { ConfigureTenantSettingsStage } from './stages/ConfigureTenantSettingsStage'
import { CreateActionsStage } from './stages/CreateActionsStage'
import { CreateApisStage } from './stages/CreateApisStage'
import { CreateApplicationsStage } from './stages/CreateApplicationsStage'
import { CreateM2MClientsStage } from './stages/CreateM2MClientsStage'
import { CreateRolesStage } from './stages/CreateRolesStage'
import { CreateStackAdminStage } from './stages/CreateStackAdminStage'
import cfg from '../config'

describe('ConfigService', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let fsMock: jest.Mocked<FileSystemInstance>
  let auth0ServiceMock: jest.Mocked<Auth0Service>
  let clientServiceMock: jest.Mocked<ClientService>
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let requestMock: ConfigStageRequest
  let service: ConfigService

  let configureEmailProviderStageMock: jest.Mocked<ConfigureEmailProviderStage>
  let configureTenantSettingsStageMock: jest.Mocked<ConfigureTenantSettingsStage>
  let createActionsStageMock: jest.Mocked<CreateActionsStage>
  let createApisStageMock: jest.Mocked<CreateApisStage>
  let createApplicationsStageMock: jest.Mocked<CreateApplicationsStage>
  let createM2MClientsStageMock: jest.Mocked<CreateM2MClientsStage>
  let createRolesStageMock: jest.Mocked<CreateRolesStage>
  let createStackAdminStageMock: jest.Mocked<CreateStackAdminStage>

  beforeEach(() => {
    loggerMock = createMockLogger()
    fsMock = createMockInstance(FileSystemInstance)
    auth0ServiceMock = createMockInstance(Auth0Service)
    clientServiceMock = createMockInstance(ClientService)
    managementClientMock = createMockManagementClient()

    configureEmailProviderStageMock = createMockInstance(
      ConfigureEmailProviderStage,
    )
    configureTenantSettingsStageMock = createMockInstance(
      ConfigureTenantSettingsStage,
    )
    createActionsStageMock = createMockInstance(CreateActionsStage)
    createApisStageMock = createMockInstance(CreateApisStage)
    createApplicationsStageMock = createMockInstance(CreateApplicationsStage)
    createM2MClientsStageMock = createMockInstance(CreateM2MClientsStage)
    createRolesStageMock = createMockInstance(CreateRolesStage)
    createStackAdminStageMock = createMockInstance(CreateStackAdminStage)

    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
      fs: fsMock,
      logger: loggerMock,
      clientService: clientServiceMock,
      clientCredentials: undefined,
    })

    service = new ConfigService(
      loggerMock,
      fsMock,
      auth0ServiceMock,
      clientServiceMock,
      configureEmailProviderStageMock,
      configureTenantSettingsStageMock,
      createActionsStageMock,
      createApisStageMock,
      createApplicationsStageMock,
      createM2MClientsStageMock,
      createRolesStageMock,
      createStackAdminStageMock,
    )

    auth0ServiceMock.getManagementClient.mockResolvedValueOnce(
      managementClientMock,
    )
  })

  it('runs all stages if initial config enabled', async () => {
    cfg().initialConfig.enabled = true

    await service.performConfiguration()

    const expectedStages = [
      configureEmailProviderStageMock,
      configureTenantSettingsStageMock,
      createActionsStageMock,
      createApisStageMock,
      createApplicationsStageMock,
      createM2MClientsStageMock,
      createRolesStageMock,
      createStackAdminStageMock,
    ]

    expectedStages.forEach((stage) => {
      expect(stage.run).toHaveBeenCalledTimes(1)
      expect(stage.run).toHaveBeenCalledWith(requestMock)
    })
  })

  it('runs stack admin stage only if disabled', async () => {
    cfg().initialConfig.enabled = false

    await service.performConfiguration()

    const expectedStages = [createStackAdminStageMock]

    expectedStages.forEach((stage) => {
      expect(stage.run).toHaveBeenCalledTimes(1)
      expect(stage.run).toHaveBeenCalledWith(requestMock)
    })

    const expectedSkippedStages = [
      configureEmailProviderStageMock,
      configureTenantSettingsStageMock,
      createActionsStageMock,
      createApisStageMock,
      createApplicationsStageMock,
      createM2MClientsStageMock,
      createRolesStageMock,
    ]

    expectedSkippedStages.forEach((stage) => {
      expect(stage.run).toHaveBeenCalledTimes(0)
    })
  })
})
