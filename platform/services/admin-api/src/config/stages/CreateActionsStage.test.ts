import { ConfigStageRequest } from '../types/ConfigStage'
import {
  createMockConfigStageRequest,
  createMockLogger,
  createMockManagementClient,
  mockFileArray,
  waitWithFakeTimers,
} from '../../../test/utils'
import { ManagementClientExtended } from '../../types/Auth0ManagementClientExtended'
import { CreateActionsStage } from './CreateActionsStage'
import { FileSystemInstance } from '../../services/instances/FileSystemInstance'
import createMockInstance from 'jest-create-mock-instance'
import { ConfigConstants } from '../ConfigConstants'
import {
  clientIdMock,
  clientSecretMock,
  permissionMock,
  roleMock,
} from '../../../test/mocks'
import cfg from '../../config'
import { NestJSPinoLogger } from '@consensys/observability'

describe('CreateActionsStage', () => {
  let managementClientMock: jest.Mocked<ManagementClientExtended>
  let getActionsMock: jest.Mock
  let createActionMock: jest.Mock
  let updateActionMock: jest.Mock
  let deployActionMock: jest.Mock
  let fsMock: jest.Mocked<FileSystemInstance>
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let requestMock: ConfigStageRequest
  let stage: CreateActionsStage

  const expectActionCreatedWithCodeContaining = (
    actionName: string,
    codeContent: string,
  ) => {
    const createRequest = createActionMock.mock.calls.find((call) => {
      return call[0].name === actionName
    })[0]
    expect(createRequest.code).toContain(codeContent)
  }

  const expectActionUpdatedWithCodeContaining = (
    actionName: string,
    codeContent: string,
  ) => {
    const updateRequest = updateActionMock.mock.calls.find((call) => {
      return call[1].name === actionName
    })[1]
    expect(updateRequest.code).toContain(codeContent)
  }

  beforeEach(() => {
    jest.useFakeTimers()

    managementClientMock = createMockManagementClient()
    getActionsMock = managementClientMock.actions.getAll as jest.Mock
    createActionMock = managementClientMock.actions.create as jest.Mock
    updateActionMock = managementClientMock.actions.update as jest.Mock
    deployActionMock = managementClientMock.actions.deploy as jest.Mock
    fsMock = createMockInstance(FileSystemInstance)
    loggerMock = createMockLogger()

    requestMock = createMockConfigStageRequest({
      managementClient: managementClientMock,
      fs: fsMock,
      logger: loggerMock,
      clientCredentials: {
        clientId: clientIdMock,
        clientSecret: clientSecretMock,
      },
    })

    stage = new CreateActionsStage()

    getActionsMock.mockResolvedValue({ actions: [] })
    createActionMock.mockResolvedValue({ id: 'TestActionId' })
    fsMock.instance.mockReturnValue({ readFileSync: jest.fn(() => '') })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('checks existing actions and creates, deploys, and binds new ones', async () => {
    await stage.run(requestMock)

    expect(getActionsMock).toHaveBeenCalledTimes(1)
    expect(createActionMock).toHaveBeenCalledTimes(7)
    expect(deployActionMock).toHaveBeenCalledTimes(7)
    expect(
      managementClientMock.actions.updateTriggerBindings,
    ).toHaveBeenCalledTimes(2)
  })

  it.each([
    ConfigConstants.ACTION_NAME_USER_REGISTRATION,
    ConfigConstants.ACTION_NAME_SEGMENT,
    ConfigConstants.ACTION_NAME_TENANT_CUSTOM_CLAIM,
    ConfigConstants.ACTION_NAME_REQUIRE_MFA,
    ConfigConstants.ACTION_NAME_M2M_TENANT_CUSTOM_CLAIM,
    ConfigConstants.ACTION_NAME_M2M_RATE_LIMIT,
  ])('updates %s action if it already exists', async (actionName) => {
    getActionsMock.mockResolvedValueOnce({ actions: [{ name: actionName }] })

    await stage.run(requestMock)

    expect(getActionsMock).toHaveBeenCalledTimes(1)
    expect(createActionMock).toHaveBeenCalledTimes(6)
    expect(updateActionMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['creating', false],
    ['updating', true],
  ])(
    'includes role data in Tenant ID Custom Claim action when %s',
    async (action, isUpdate) => {
      const ruleScriptMock = 'start%ROLES%end'

      fsMock.instance.mockReturnValue({
        readFileSync: jest.fn(() => ruleScriptMock),
      })

      if (isUpdate) {
        getActionsMock.mockResolvedValue({
          actions: [{ name: ConfigConstants.ACTION_NAME_TENANT_CUSTOM_CLAIM }],
        })
      }

      const permissionMock1 = permissionMock(0)
      const permissionMock2 = permissionMock(1)
      const permissionMock3 = permissionMock(2)
      const permissionMock4 = permissionMock(3)
      const permissionMock5 = permissionMock(4)
      const permissionMock6 = permissionMock(5)
      const permissionMock7 = permissionMock(6)
      const roleMock1 = roleMock(0, [permissionMock1, permissionMock2])
      const roleMock2 = roleMock(1, [permissionMock3])
      const roleMock3 = roleMock(2, [permissionMock1, permissionMock4])
      const roleMock4 = roleMock(3, [permissionMock5])
      const roleMock5 = roleMock(4, [permissionMock6])
      const roleMock6 = roleMock(5, [permissionMock7])

      const codefiRolesMock = await mockFileArray(
        '../src/config/roles/codefi.json',
        [roleMock1],
      )
      const assetsRolesMock = await mockFileArray(
        '../src/config/roles/assets.json',
        [roleMock2],
      )
      const paymentsRolesMock = await mockFileArray(
        '../src/config/roles/payments.json',
        [roleMock3, roleMock4],
      )
      const orchestratePermissionsMock = await mockFileArray(
        '../src/config/permissions/orchestrate.json',
        [permissionMock1, permissionMock3],
      )

      cfg().initialConfig.initialRoles = [roleMock5]
      cfg().initialConfig.initialAdminRoles = [roleMock6]

      try {
        await stage.run(requestMock)
      } finally {
        codefiRolesMock.reset()
        paymentsRolesMock.reset()
        assetsRolesMock.reset()
        orchestratePermissionsMock.reset()
      }

      const expectedRoleData =
        'start' +
        JSON.stringify({
          allPermissions: [
            permissionMock1.value,
            permissionMock2.value,
            permissionMock3.value,
            permissionMock4.value,
            permissionMock5.value,
            permissionMock6.value,
            permissionMock7.value,
          ],
          roles: {
            [roleMock1.name]: [0, 1],
            [roleMock2.name]: [2],
            [roleMock3.name]: [0, 3],
            [roleMock4.name]: [4],
            [roleMock5.name]: [5],
            [roleMock6.name]: [6],
          },
          orchestrate: [0, 2],
        }) +
        'end'

      if (isUpdate) {
        expectActionUpdatedWithCodeContaining(
          ConfigConstants.ACTION_NAME_TENANT_CUSTOM_CLAIM,
          expectedRoleData,
        )
      } else {
        expectActionCreatedWithCodeContaining(
          ConfigConstants.ACTION_NAME_TENANT_CUSTOM_CLAIM,
          expectedRoleData,
        )
      }
    },
  )

  it('waits once and retries action deploy if build pending', async () => {
    deployActionMock.mockImplementationOnce(() => {
      throw new Error("test must be in the 'built' state test")
    })

    await waitWithFakeTimers(stage.run(requestMock))

    expect(deployActionMock).toHaveBeenCalledTimes(8)
  })

  it('waits multiple times and retries action deploy if build pending', async () => {
    for (let i = 0; i < 4; i++) {
      deployActionMock.mockImplementationOnce(() => {
        throw new Error("test must be in the 'built' state test")
      })
    }

    await waitWithFakeTimers(stage.run(requestMock))

    expect(deployActionMock).toHaveBeenCalledTimes(11)
  })

  it('continues with error if action deploy fails 60 times as build pending', async () => {
    for (let i = 0; i < 60; i++) {
      deployActionMock.mockImplementationOnce(() => {
        throw new Error("test must be in the 'built' state test")
      })
    }

    await waitWithFakeTimers(stage.run(requestMock))

    expect(loggerMock.error).toHaveBeenCalledTimes(1)
    expect(loggerMock.error).toHaveBeenCalledWith('Failed to deploy action')
  })
})
