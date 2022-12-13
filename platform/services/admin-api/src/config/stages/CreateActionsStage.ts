import { ConfigStageRequest, IConfigStage } from '../types/ConfigStage'
import {
  ActionDependency,
  ActionResponse,
  ActionSecret,
  ActionSupportedTrigger,
  ManagementClientExtended,
} from '../../types/Auth0ManagementClientExtended'
import { ConfigConstants } from '../ConfigConstants'
import cfg from '../../config'
import { NestJSPinoLogger } from '@consensys/observability'
import { sleep } from '../../utils/sleep'
import codefiScopes from '../permissions/codefi.json'
import orchestrateScopes from '../permissions/orchestrate.json'
import assetsScopes from '../permissions/assets.json'
import paymentsScopes from '../permissions/payments.json'
import codefiRoles from '../roles/codefi.json'
import assetsRoles from '../roles/assets.json'
import paymentsRoles from '../roles/payments.json'
import { joinNestedLists } from '../../utils/utils'
import { FileSystemInstance } from '../../services/instances/FileSystemInstance'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CreateActionsStage implements IConfigStage {
  private managementClient: ManagementClientExtended
  private logger: NestJSPinoLogger
  private fs: FileSystemInstance

  async run(request: ConfigStageRequest) {
    const { managementClient, logger, clientCredentials, fs } = request

    this.managementClient = managementClient
    this.logger = logger
    this.fs = fs

    this.logger.info('Retrieving Auth0 actions')

    const existingActions = (await this.managementClient.actions.getAll())
      .actions

    this.logger.info(
      { existingActionCount: existingActions.length },
      'Retrieved Auth0 actions',
    )

    // User Registration
    await this.createAction(
      existingActions,
      ConfigConstants.ACTION_NAME_USER_REGISTRATION,
      ConfigConstants.ACTION_CODE_USER_REGISTRATION,
      ConfigConstants.TRIGGER_POST_LOGIN,
      [
        { name: 'ADMIN_APPS', value: cfg().actions.adminAppsEligibleToRules },
        { name: 'TOKEN_ENDPOINT', value: cfg().actions.tokenEndpoint },
        { name: 'HOOK_CLIENT_ID', value: clientCredentials.clientId },
        { name: 'HOOK_CLIENT_SECRET', value: clientCredentials.clientSecret },
        {
          name: 'API_AUDIENCE',
          value: ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
        },
        {
          name: 'USER_REGISTRATION_CALLBACK_URL',
          value: this.craftCallbackUrl(),
        },
      ],
      ConfigConstants.ACTION_DEPENDENCIES_USER_REGISTRATION,
    )

    // Log To Segment
    await this.createAction(
      existingActions,
      ConfigConstants.ACTION_NAME_SEGMENT,
      ConfigConstants.ACTION_CODE_SEGMENT,
      ConfigConstants.TRIGGER_POST_LOGIN,
      [
        { name: 'ADMIN_APPS', value: cfg().actions.adminAppsEligibleToRules },
        { name: 'SEGMENT_KEY', value: cfg().actions.segmentKey },
      ],
      ConfigConstants.ACTION_DEPENDENCIES_SEGMENT,
    )

    // Tenant ID Custom Claim
    await this.createAction(
      existingActions,
      ConfigConstants.ACTION_NAME_TENANT_CUSTOM_CLAIM,
      ConfigConstants.ACTION_CODE_TENANT_CUSTOM_CLAIM,
      ConfigConstants.TRIGGER_POST_LOGIN,
      [
        {
          name: 'CUSTOM_NAMESPACE',
          value: cfg().actions.jwtCustomNamespace,
        },
        {
          name: 'CUSTOM_ORCHESTRATE_NAMESPACE',
          value: cfg().actions.jwtCustomOrchestrateNamespace,
        },
      ],
      ConfigConstants.ACTION_DEPENDENCIES_TENANT_CUSTOM_CLAIM,
      { '%ROLES%': JSON.stringify(this.generateRoleDataForActions()) },
    )

    // Require MFA
    await this.createAction(
      existingActions,
      ConfigConstants.ACTION_NAME_REQUIRE_MFA,
      ConfigConstants.ACTION_CODE_REQUIRE_MFA,
      ConfigConstants.TRIGGER_POST_LOGIN,
      ConfigConstants.ACTION_DEPENDENCIES_REQUIRE_MFA,
    )

    // Create Tenant For Infura User Action
    await this.createAction(
      existingActions,
      ConfigConstants.ACTION_NAME_CREATE_TENANT_FOR_INFURA_USER,
      ConfigConstants.ACTION_CODE_CREATE_TENANT_FOR_INFURA_USER,
      ConfigConstants.TRIGGER_POST_LOGIN,
      [
        {
          name: 'M2M_TOKEN_ADMIN_CLIENT_ID',
          value: clientCredentials.clientId,
        },
        {
          name: 'M2M_TOKEN_ADMIN_CLIENT_SECRET',
          value: clientCredentials.clientSecret,
        },
        {
          name: 'CODEFI_API_RESOURCE_SERVER_IDENTIFIER',
          value: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
        },
        {
          name: 'AUTH0_TENANT_DOMAIN',
          value: cfg().auth0.tenantDomain,
        },
        {
          name: 'ENTITY_API_URL',
          value: cfg().actions.entityApiUrl,
        },
        {
          name: 'INFURA_CONNECTION_NAME',
          value: ConfigConstants.INFURA_CONNECTION_NAME,
        },
      ],
      ConfigConstants.ACTION_DEPENDENCIES_CREATE_TENANT_FOR_INFURA_USER,
    )

    const m2mPermissionData = this.generateRoleDataForActions({
      includeAllPermissions: true,
    })

    const finalM2MPermissionData = {
      allPermissions: m2mPermissionData.allPermissions,
      orchestrate: m2mPermissionData.orchestrate,
    }

    // M2M Tenant ID Custom Claim
    await this.createAction(
      existingActions,
      ConfigConstants.ACTION_NAME_M2M_TENANT_CUSTOM_CLAIM,
      ConfigConstants.ACTION_CODE_M2M_TENANT_CUSTOM_CLAIM,
      ConfigConstants.TRIGGER_CREDENTIALS_EXCHANGE,
      [
        { name: 'CUSTOM_NAMESPACE', value: cfg().actions.jwtCustomNamespace },
        {
          name: 'CUSTOM_ORCHESTRATE_NAMESPACE',
          value: cfg().actions.jwtCustomOrchestrateNamespace,
        },
        {
          name: 'MULTI_TENANT_CLIENT_NAME',
          value: ConfigConstants.MACHINE_TO_MACHINE_CLIENT_NAME_CODEFI,
        },
      ],
      ConfigConstants.ACTION_DEPENDENCIES_M2M_TENANT_CUSTOM_CLAIM,
      { '%PERMISSIONS%': JSON.stringify(finalM2MPermissionData) },
    )

    // M2M Rate Limit
    await this.createAction(
      existingActions,
      ConfigConstants.ACTION_NAME_M2M_RATE_LIMIT,
      ConfigConstants.ACTION_CODE_M2M_RATE_LIMIT,
      ConfigConstants.TRIGGER_CREDENTIALS_EXCHANGE,
      [
        {
          name: 'DISABLE_RATE_LIMIT_TENANTS',
          value: cfg().actions.disableRateLimitTenants,
        },
        { name: 'REDIS_HOST', value: cfg().actions.m2mRateLimitRedisHost },
        { name: 'REDIS_PASS', value: cfg().actions.m2mRateLimitRedisPass },
        {
          name: 'RATE_LIMIT_MAX_ATTEMPTS',
          value: cfg().actions.m2mRateLimitMaxAttempts,
        },
        {
          name: 'RATE_LIMIT_PERIOD_IN_SECONDS',
          value: cfg().actions.m2mRateLimitAttemptPeriodInSeconds,
        },
      ],
      ConfigConstants.ACTION_DEPENDENCIES_M2M_RATE_LIMIT,
    )

    await this.updateActionBindings(ConfigConstants.TRIGGER_POST_LOGIN, [
      ConfigConstants.ACTION_NAME_USER_REGISTRATION,
      ConfigConstants.ACTION_NAME_SEGMENT,
      ConfigConstants.ACTION_NAME_CREATE_TENANT_FOR_INFURA_USER,
      ConfigConstants.ACTION_NAME_TENANT_CUSTOM_CLAIM,
      ConfigConstants.ACTION_NAME_REQUIRE_MFA,
    ])

    await this.updateActionBindings(
      ConfigConstants.TRIGGER_CREDENTIALS_EXCHANGE,
      [
        ConfigConstants.ACTION_NAME_M2M_TENANT_CUSTOM_CLAIM,
        ConfigConstants.ACTION_NAME_M2M_RATE_LIMIT,
      ],
    )
  }

  private async updateActionBindings(
    trigger: { id: string },
    actions: string[],
  ) {
    await this.managementClient.actions.updateTriggerBindings(
      {
        trigger_id: trigger.id,
      },
      {
        bindings: actions.map((action) => ({
          ref: {
            type: 'action_name',
            value: action,
          },
          display_name: action,
        })),
      },
    )

    this.logger.info({ triggerId: trigger.id }, 'Updated action bindings')
  }

  private async createAction(
    existingActions: ActionResponse[],
    name: string,
    codePath: string,
    trigger: ActionSupportedTrigger,
    secrets: ActionSecret[] = [],
    dependencies: ActionDependency[] = [],
    variables: { [placeholder: string]: string } = {},
    attempt = 1,
  ) {
    const logger = this.logger.logger.child({
      actionName: name,
      createAttempt: attempt,
    })

    if (attempt > 3) {
      logger.error('Failed to deploy action')
      return
    }

    const code = Object.keys(variables).reduce((output, placeholder) => {
      return output.replace(placeholder, variables[placeholder])
    }, await this.getActionCode(codePath))

    let existingAction = existingActions.find((action) => action.name === name)

    if (!existingAction) {
      logger.info('Creating action')

      existingAction = await this.managementClient.actions.create({
        name,
        supported_triggers: [trigger],
        code,
        dependencies,
        runtime: 'node16',
        secrets,
      })

      logger.info('Created action')
    } else {
      logger.info('Updating existing action')

      await this.managementClient.actions.update(
        { id: existingAction.id },
        {
          name,
          code,
          dependencies,
          runtime: 'node16',
          secrets,
        },
      )

      logger.info('Updated existing action')
    }

    const deploySuccessful = await this.deployAction(existingAction)

    if (!deploySuccessful) {
      return await this.createAction(
        existingActions,
        name,
        codePath,
        trigger,
        secrets,
        dependencies,
        variables,
        attempt + 1,
      )
    }
  }

  private async deployAction(action: ActionResponse, attempt = 1) {
    const logger = this.logger.logger.child({
      actionName: action.name,
      deployAttempt: attempt,
    })

    if (attempt > 20) {
      logger.warn(`Failed to deploy action, attempting to re-create`)
      return false
    }

    try {
      await this.managementClient.actions.deploy({ id: action.id })
      logger.info('Deployed action')
      return true
    } catch (error) {
      if (
        error.message &&
        error.message.includes("must be in the 'built' state")
      ) {
        logger.info(`Waiting for action to build before deploying`)
        await sleep(3000)
        return await this.deployAction(action, attempt + 1)
      }
    }
  }

  private generateRoleDataForActions({
    includeAllPermissions = false,
  }: {
    includeAllPermissions?: boolean
  } = {}) {
    const rawRoles: any[] = joinNestedLists(
      [
        codefiRoles,
        assetsRoles,
        paymentsRoles,
        cfg().initialConfig.initialRoles,
        cfg().initialConfig.initialAdminRoles,
      ],
      (role) => role.name,
    )

    const allPermissions = includeAllPermissions
      ? this.getUniquePermissionNames([
          codefiScopes,
          orchestrateScopes,
          assetsScopes,
          paymentsScopes,
        ])
      : this.getUniquePermissionNames(rawRoles.map((role) => role.permissions))

    const roles = rawRoles.reduce((output, role) => {
      output[role.name] = role.permissions.map((permission) =>
        allPermissions.indexOf(permission.value),
      )
      return output
    }, {})

    const orchestrate = this.getUniquePermissionNames([orchestrateScopes])
      .filter((permission) => allPermissions.includes(permission))
      .map((permission) => allPermissions.indexOf(permission))

    return { allPermissions, roles, orchestrate }
  }

  private getUniquePermissionNames(
    permissionLists: { value: string }[][],
  ): string[] {
    return [
      ...new Set(
        [].concat(
          ...permissionLists.map((permissionList) =>
            permissionList.map((permission) => permission.value),
          ),
        ),
      ),
    ]
  }

  private craftCallbackUrl(): string {
    const callbackUrl = cfg().actions.isMaster
      ? cfg().actions.urlEnvironment
      : cfg().actions.urlEnvironment + cfg().actions.urlVersion

    this.logger.info({ callbackUrl }, 'Set callback URL')

    return callbackUrl
  }

  private async getActionCode(filePath: string): Promise<string> {
    const code = await this.fs
      .instance()
      .readFileSync(`${__dirname}/../actions/${filePath}`)
      .toString()

    return `// Action created by ${cfg().core.appName} \n ${code}`
  }
}
