import { ConfigStageRequest, IConfigStage } from '../types/ConfigStage'
import { ConfigConstants } from '../ConfigConstants'
import cfg from '../../config'
import { NestJSPinoLogger } from '@consensys/observability'
import { ManagementClientExtended } from '../../types/Auth0ManagementClientExtended'
import {
  getAllApis,
  getAllClients,
  getAllConnections,
  createConnection,
} from '../../utils/managementClientUtils'
import { FileSystemInstance } from '../../services/instances/FileSystemInstance'
import { ConfigurationException, ErrorName } from '@consensys/error-handler'
import { ClientService } from '../../services/ClientService'
import { Client } from 'auth0'
import { Injectable } from '@nestjs/common'
import {
  arraysEqualIgnoringOrder,
  removePrimitiveDuplicates,
} from '../../utils/utils'

const APPLICATION_DESCRIPTION =
  'A client used only for DB connection with disabled sign ups'

@Injectable()
export class CreateApplicationsStage implements IConfigStage {
  private managementClient: ManagementClientExtended
  private clientService: ClientService
  private logger: NestJSPinoLogger
  private fs: FileSystemInstance

  async run(request: ConfigStageRequest) {
    const { managementClient, clientService, logger, fs } = request

    this.managementClient = managementClient
    this.clientService = clientService
    this.logger = logger
    this.fs = fs

    if (!cfg().initialConfig.emailInviteApplication) {
      this.logger.info('Skipping creation of email invite only application')
      return
    }

    const existingApis = await getAllApis(managementClient, this.logger)

    const managementApi = existingApis.find(
      (api) => api.name === ConfigConstants.AUTH0_MANAGEMENT_API_NAME,
    )

    if (!managementApi) {
      const error = new ConfigurationException(
        ErrorName.ConfigurationException,
        `Auth0 Management API not found`,
        { managementApi },
      )

      this.logger.error({ error }, 'Cannot find management API')
      throw error
    }

    const existingApplications = await getAllClients(
      managementClient,
      this.logger,
    )

    const emailApplicationClientId = await this.createApplication(
      ConfigConstants.EMAIL_INVITE_ONLY_APPLICATION_NAME,
      APPLICATION_DESCRIPTION,
      managementApi.identifier,
      ConfigConstants.EMAIL_INVITE_ONLY_APPLICATION_GRANT_SCOPES,
      existingApplications,
      'regular_web',
    )

    const userApplicationClientId = await this.createApplication(
      ConfigConstants.CREATE_USERS_APPLICATION_NAME,
      APPLICATION_DESCRIPTION,
      managementApi.identifier,
      ConfigConstants.EMAIL_INVITE_ONLY_APPLICATION_GRANT_SCOPES,
      existingApplications,
      'regular_web',
    )

    const infuraAPIHubSPAClientId = await this.createApplication(
      ConfigConstants.INFURA_API_HUB_CLIENT_NAME,
      'A client used only for Infura API Hub',
      undefined,
      undefined,
      existingApplications,
      'spa',
      [ConfigConstants.CODEFI_WILDCARD_URL],
      [ConfigConstants.CODEFI_WILDCARD_URL],
      [ConfigConstants.CODEFI_WILDCARD_URL],
      [ConfigConstants.CODEFI_WILDCARD_URL],
    )

    const existingConnections = await getAllConnections(managementClient)

    await createConnection(
      this.managementClient,
      this.logger,
      existingConnections,
      {
        name: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
        strategy: 'auth0',
        enabled_clients: [emailApplicationClientId, cfg().auth0.clientId],
        options: {
          disable_signup: true,
        },
      },
    )

    // Infura Connection
    const fetchUserProfileCode = (
      await this.getScriptCode('fetchUserProfile.js')
    ).replace('%INFURA_USER_API_URL%', cfg().infura.userApiUrl)

    await createConnection(
      this.managementClient,
      this.logger,
      existingConnections,
      {
        name: ConfigConstants.INFURA_CONNECTION_NAME,
        strategy: 'oauth2',
        enabled_clients: [infuraAPIHubSPAClientId],
        options: {
          scope: ConfigConstants.INFURA_CONNECTION_SCOPE,
          icon_url: ConfigConstants.INFURA_CONNECTION_ICON_URL,
          tokenURL: ConfigConstants.INFURA_CONNECTION_TOKEN_URL,
          authorizationURL: ConfigConstants.INFURA_CONNECTION_AUTH_URL,
          client_id: cfg().infura.clientId,
          client_secret: cfg().infura.clientSecret,
          scripts: {
            fetchUserProfile: fetchUserProfileCode,
          },
        },
      },
    )

    const defaultConnection = existingConnections.find(
      (connection) =>
        connection.name === ConfigConstants.CREATE_USERS_CONNECTION_NAME,
    )

    const newDefaultConnectionClients = removePrimitiveDuplicates([
      ...defaultConnection.enabled_clients,
      userApplicationClientId,
      cfg().auth0.clientId,
    ])

    if (
      !arraysEqualIgnoringOrder(
        defaultConnection.enabled_clients,
        newDefaultConnectionClients,
      )
    ) {
      this.logger.info(
        { enabledClients: newDefaultConnectionClients },
        'Updating enabled clients for default connection',
      )

      await this.managementClient.updateConnection(
        { id: defaultConnection.id },
        { enabled_clients: newDefaultConnectionClients },
      )
    } else {
      this.logger.info('Skipping update of default connection enabled clients')
    }
  }

  private async createApplication(
    name: string,
    description: string,
    audience: string,
    permissions: string[],
    existingApplications: Client[],
    appType: string,
    callbacks: string[] = [],
    allowedLogoutUrls: string[] = [],
    webOrigins: string[] = [],
    allowedOrigins: string[] = [],
  ): Promise<string> {
    const logger = this.logger.logger.child({ applicationName: name })

    const existingApplication = existingApplications.find(
      (application) => application.name === name,
    )

    if (existingApplication) {
      logger.info('Application already exists')
      return existingApplication.client_id
    }

    logger.info('Creating application')

    await this.enableApplicationConnections(false)

    const newApplication = await this.clientService.createClient({
      name,
      description,
      appType,
      callbacks,
      allowedLogoutUrls,
      webOrigins,
      allowedOrigins,
    })

    logger.info({ clientId: newApplication.clientId }, 'Created application')

    await this.enableApplicationConnections(true)

    if (appType === 'regular_web') {
      logger.info('Granting permissions to application')
      await this.managementClient.createClientGrant({
        audience,
        client_id: newApplication.clientId,
        scope: permissions,
      })
    }

    return newApplication.clientId
  }

  private async enableApplicationConnections(enable: boolean) {
    this.logger.info(
      `${
        enable ? 'Enabling' : 'Disabling'
      } "Enable Application Connections" flag in tenant settings`,
    )

    await this.managementClient.updateTenantSettings({
      flags: {
        enable_client_connections: enable,
      },
    })
  }

  private async getScriptCode(filePath: string): Promise<string> {
    const code = await this.fs
      .instance()
      .readFileSync(`${__dirname}/../scripts/${filePath}`)
      .toString()

    return `// Script created by ${cfg().core.appName} \n ${code}`
  }
}
