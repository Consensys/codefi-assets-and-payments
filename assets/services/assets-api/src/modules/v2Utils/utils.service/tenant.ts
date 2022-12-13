import { Injectable, OnModuleInit } from '@nestjs/common';

/**
 * IDENTITY
 * The platform manages user accounts, e.g. an Ethereum wallet and any kind of metadata.
 */
import ErrorService from 'src/utils/errorService';

import { UserCreationService } from 'src/modules/v2User/user.service/createUser';
import {
  ApiAdminCallService,
  AppType,
} from 'src/modules/v2ApiCall/api.call.service/admin';
import { EmailService } from 'src/modules/v2Email/email.service';
import { keys as PostmanKeys, PostmanCredentials } from 'src/types/postman';
import {
  ClientApplication,
  keys as ClientApplicationKeys,
  Region,
  TenantType,
  AppUrl,
  getEnvNameFromAppUrl,
  isE2eTestTenant,
  extractNameFromClientApplicationName,
  craftClientApplicationName,
  craftM2mClientApplicationName,
} from 'src/types/clientApplication';
import { ConfigService } from '../../v2Config/config.service';
import { keys as ConfigKeys, TENANT_FLAG, Config } from 'src/types/config';
import { keys as NetworkKeys, Network } from 'src/types/network';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateTenantOutput,
  DeleteTenantDataOutput,
  DeleteTenantDataQueryInput,
  DeleteTenantOutput,
} from '../utils.dto';
import { ApiWorkflowUtilsService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  ApiMetadataUtilsService,
  ApiMetadataCallService,
} from 'src/modules/v2ApiCall/api.call.service/metadata';
import { ApiKycUtilsService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { NestJSPinoLogger } from '@consensys/observability';
import config from 'src/config';
import { ASSETS_API_REQUIRED_SCOPES } from 'src/types/grant';
import { keys as KycTemplateKeys } from 'src/types/kyc/template';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import { ApiEntityCallService } from '../../v2ApiCall/api.call.service/entity';
import { NetworkService } from '../../v2Network/network.service';
import { IS_DEV_DOMAIN_NAME } from 'src/utils/domain';
import { craftAuth0UserPassword } from 'src/types/authentication';

const SUPER_ENTITY_ID = '*'; // Setting a '*' as entityId in the client applications' metadata allow the client application to act on behalf of every entity

// Data related with this tenant should never be deleted. Otherwise it will impact all other tenants
const RESERVED_DEFAULT_DATA_TENANT_ID = 'codefi';

const APP_URL: string = config().appUrl;
const AUTH0_URL: string = config().auth0Url;
const AUTH_ACCEPTED_AUDIENCE: string = config().acceptedAudience;

const defaultTenantId: string = config().defaultInitializationTenantId;

const exportDocs = config().exportDocs;

export interface BaseTenant {
  superAdmin: User;
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  defaultAlias: string;
  aliases: string[];
  tenantRegion: Region;
  tenantType: TenantType;
  enableMarketplace: boolean;
  usecase: string;
}

@Injectable()
export class TenantService implements OnModuleInit {
  constructor(
    private readonly userCreationService: UserCreationService,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly apiWorkflowUtilsService: ApiWorkflowUtilsService,
    private readonly apiMetadataUtilsService: ApiMetadataUtilsService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiKycUtilsService: ApiKycUtilsService,
    private readonly logger: NestJSPinoLogger,
    private readonly kycTemplateService: KYCTemplateService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly networkService: NetworkService,
  ) {}

  async onModuleInit() {
    try {
      if (exportDocs) {
        // There is a step in the CI pipeline where Assets-API is launched, just to generate docs (API documentation)
        // In that case, we don't need to create initial users
        return;
      }

      if (defaultTenantId) {
        const defaultTenantShortName =
          config().defaultInitializationTenantShortName;

        const defaultTenantName = IS_DEV_DOMAIN_NAME
          ? defaultTenantShortName.concat(' - Dev')
          : defaultTenantShortName;

        const defaultTenantAlias: string =
          config().defaultInitializationTenantAlias;

        await this.createTenant(
          {
            superAdmin: undefined, // Optional - This field is only required to invite superAdmin per email
            name: defaultTenantName,
            email: undefined, // firstUserEmail
            password: undefined, // firstUserPassword
            firstName: undefined, // firstUserFirstName
            lastName: undefined, // firstUserLastName
            defaultAlias: defaultTenantAlias,
            aliases: [defaultTenantAlias],
            tenantRegion: Region.EU,
            tenantType: TenantType.PLATFORM_MULTI_ISSUER,
            enableMarketplace: undefined,
            usecase: undefined,
          },
          undefined, // kycTemplateId
          false, // sendNotification
          undefined, // authToken
          undefined, // faucetNetworksKeys
          false, // createM2mClientApplication
          defaultTenantId, // forceTenantId
        );
      }
    } catch (error) {
      this.logger.error(error, 'onModuleInit');
    }
  }

  getPostmanCredentials(
    clientApplication: ClientApplication,
    email: string,
    password?: string,
  ): PostmanCredentials {
    let authUrl: string = AUTH0_URL;
    if (authUrl.endsWith('/')) {
      authUrl = authUrl.slice(0, -1);
    }

    const userPassword: string = craftAuth0UserPassword(password);
    const name = extractNameFromClientApplicationName(
      clientApplication[ClientApplicationKeys.NAME],
    );

    // get environment name from app url
    const envName = getEnvNameFromAppUrl(APP_URL as AppUrl);

    const postmanCredentials: PostmanCredentials = {
      [PostmanKeys.ID]: uuidv4(),
      [PostmanKeys.NAME]: `${envName}.codefi.${name
        .toLowerCase()
        .split(' ')
        .join('.')}`,
      [PostmanKeys.VALUES]: [
        {
          key: 'CODEFI_API_ROOT',
          value: `${APP_URL}/api/assets`,
          enabled: true,
        },
        {
          key: 'CODEFI_API',
          value: '{{CODEFI_API_ROOT}}/v2',
          enabled: true,
        },
        {
          key: 'AUTH_URL',
          value: authUrl,
          enabled: true,
        },
        {
          key: 'AUTH_AUDIENCE',
          value: AUTH_ACCEPTED_AUDIENCE,
          enabled: true,
        },
        {
          key: 'AUTH_CLIENT_ID',
          value: clientApplication[ClientApplicationKeys.CLIENT_ID],
          enabled: true,
        },
        {
          key: 'AUTH_CLIENT_SECRET',
          value: clientApplication[ClientApplicationKeys.CLIENT_SECRET],
          enabled: true,
        },
        {
          key: 'AUTH_USERNAME',
          value: email,
          enabled: true,
        },
        {
          key: 'AUTH_PASSWORD',
          value: userPassword,
          enabled: true,
        },
      ],
      [PostmanKeys.POSTMAN_VARIABLE_SCOPE]: 'environment',
      [PostmanKeys.POSTMAN_EXPORTED_AT]: new Date().toISOString(),
      [PostmanKeys.POSTMAN_EXPORTED_USING]: 'Postman/7.31.1',
    };
    return postmanCredentials;
  }

  /**
   * [Create a new tenant]
   */
  async createTenant(
    {
      superAdmin,
      name,
      email,
      password,
      firstName,
      lastName,
      defaultAlias,
      enableMarketplace,
      usecase,
      tenantRegion,
      tenantType = TenantType.PLATFORM_MULTI_ISSUER,
      ...rest
    }: BaseTenant,
    kycTemplateId: string,
    sendNotification: boolean,
    authToken: string,
    faucetNetworksKeys: string[],
    createM2mClientApplication: boolean,
    forceTenantId: string, // Optional (client application id is used as tenantId when undefined)
  ): Promise<CreateTenantOutput> {
    let newClientApplication = false;
    let M2MClientApplicationToSpa = false;
    let clientApplication: ClientApplication;
    let newTenantId;

    try {
      const userPassword: string = craftAuth0UserPassword(password);

      if (!defaultAlias) {
        ErrorService.throwError(
          'missing parameter: defaultAlias is undefined',
          400,
        );
      }

      if (!userPassword) {
        ErrorService.throwError(
          'missing parameter: password is undefined',
          400,
        );
      }

      if (!Object.values(Region).includes(tenantRegion)) {
        ErrorService.throwError(
          `Invalid parameter: region "${tenantRegion}". Valid values: ${Object.values(
            Region,
          ).join(', ')}.`,
          400,
        );
      }

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();
      const clientApplicationCreationResponse: {
        clientApplication: ClientApplication;
        newClientApplication: boolean;
      } = await this.createClientApplicationIfRequired(
        craftClientApplicationName(name),
        defaultAlias,
        rest.aliases,
        clientApplicationsList,
        forceTenantId, // tenantId (can be undefined here and set later, when calling 'updateClientApplicationInAuth0')
        undefined, // entityId (shall not be specified for this client application as it will be used for "user authentication")
      );
      newClientApplication =
        clientApplicationCreationResponse.newClientApplication;
      clientApplication = clientApplicationCreationResponse.clientApplication;

      // By default, we use the id of the first client application as tenantId
      newTenantId =
        forceTenantId || clientApplication[ClientApplicationKeys.CLIENT_ID];

      const defaultNetwork: Network =
        await this.networkService.retrieveDefaultNetwork(newTenantId, true);

      // Define the KYC template that will be used by default at tenant level, and save it in config's data
      const _kycTemplateId: string = (
        await this.kycTemplateService.retrieveKycTemplateIfExistingOrRetrieveDefaultCodefiKycTemplate(
          newTenantId,
          kycTemplateId,
        )
      )?.[KycTemplateKeys.TEMPLATE_ID];

      const uniqueAliases = [...new Set([defaultAlias, ...rest.aliases])];

      const data = {
        [ConfigKeys.DATA__DEFAULT_ALIAS]: defaultAlias,
        [ConfigKeys.DATA__ALIASES]: JSON.stringify(uniqueAliases),
        [ConfigKeys.DATA__TENANT_REGION]: tenantRegion,
        [ConfigKeys.DATA__TENANT_TYPE]: tenantType,
        [ConfigKeys.DATA__ENABLE_MARKETPLACE]: enableMarketplace,
        [ConfigKeys.DATA__USECASE]: usecase,
        [ConfigKeys.DATA__CREATED_AT]: new Date(),
        [ConfigKeys.DATA__TENANT_NAME]: name,
        [ConfigKeys.DATA__KYC_TEMPLATE_ID]: _kycTemplateId,
        [ConfigKeys.DATA__DEFAULT_NETWORK_KEY]: defaultNetwork[NetworkKeys.KEY],
      };

      await this.configService.createOrUpdateConfig(
        newTenantId,
        name,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        data,
        TENANT_FLAG, // userId
        undefined,
        undefined,
        {},
        [],
        [],
      );

      // Tenant needs to be created before initial users/entities, otherwise, Entity-Api will throw an error
      const tenant = await this.apiEntityCallService.createTenantOrUpdateTenant(
        {
          id: newTenantId,
          name,
          products: { assets: true },
          defaultNetworkKey: defaultNetwork[NetworkKeys.KEY], // Not used for now (we use the 'defaultNetworkKey' stored in 'config.data' instead)
          metadata: {
            subTenantId:
              clientApplication[ClientApplicationKeys.METADATA][
                ClientApplicationKeys.METADATA__SUB_TENANT_ID
              ],
          },
        },
      );

      const { firstUser, codefiUsers, faucetIds } =
        await this.userCreationService.createInitialUsers(
          newTenantId,
          email,
          userPassword,
          firstName,
          lastName,
          name, // tenantName/companyName
          tenantType,
          isE2eTestTenant(name), // e2eTestUsers (if set to 'true', no email will be sent to tenant's users)
          faucetNetworksKeys,
          authToken,
        );

      let authUrl: string = AUTH0_URL;
      if (authUrl.endsWith('/')) {
        authUrl = authUrl.slice(0, -1);
      }

      const codefiUsersIds = {};
      for (const [key, user] of Object.entries(codefiUsers)) {
        codefiUsersIds[key] = user[UserKeys.USER_ID];
      }
      const postmanCredentials: PostmanCredentials = this.getPostmanCredentials(
        clientApplication,
        email,
        password,
      );

      const dataWithUsers = {
        ...data,
        [ConfigKeys.DATA__FIRST_USER_ID]: firstUser?.[UserKeys.USER_ID],
        [ConfigKeys.DATA__CODEFI_USERS_IDS]: JSON.stringify(codefiUsersIds),
      };

      const config: Config = (
        await this.configService.createOrUpdateConfig(
          newTenantId,
          name,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          dataWithUsers,
          TENANT_FLAG, // userId
          undefined,
          undefined,
          {},
          [],
          [],
        )
      ).config;

      const updatedGrantTypes = [
        'password',
        'authorization_code',
        'implicit',
        'refresh_token',
      ];

      // WORKAROUND turn off client_credentials and switch to SPA
      clientApplication =
        await this.apiAdminCallService.updateClientApplicationInAuth0(
          clientApplication[ClientApplicationKeys.CLIENT_ID],
          clientApplication[ClientApplicationKeys.NAME],
          defaultAlias,
          rest.aliases,
          AppType.SPA,
          updatedGrantTypes,
          newTenantId, // tenantId (by default, we use the client ID as tenantId)
          clientApplication,
        );
      M2MClientApplicationToSpa = true;

      let m2mClientApplication: ClientApplication;
      if (createM2mClientApplication) {
        const m2mClientApplicationName = craftM2mClientApplicationName(name);
        const m2mClientApplicationCreationResponse: {
          clientApplication: ClientApplication;
          newClientApplication: boolean;
        } = await this.createClientApplicationIfRequired(
          m2mClientApplicationName,
          undefined, // defaultAlias
          [], // aliases
          clientApplicationsList,
          newTenantId, // tenantId
          SUPER_ENTITY_ID, // entityId
        );
        m2mClientApplication =
          m2mClientApplicationCreationResponse.clientApplication;
      }

      // Send email to invite the admin user (for platform multi-issuer and api)
      if (sendNotification) {
        await this.emailService.invite(
          newTenantId,
          clientApplication[ClientApplicationKeys.NAME],
          firstUser[UserKeys.USER_ID],
          undefined, // email
          superAdmin,
          true,
          authToken,
        );
      }

      return {
        tenant,
        newTenant: newClientApplication,
        config,
        firstUser,
        codefiUsers,
        faucetIds,
        postmanCredentials,
        clientApplication,
        m2mClientApplication,
        message: `Codefi Assets tenant with ID ${newTenantId} and name ${name} has been successfully ${
          newClientApplication ? 'created' : 'retrieved'
        }`,
      };
    } catch (error) {
      // Delete a newly created M2M client App if something went wrong (and before successfully updating that M2M app to SpA type).
      if (
        clientApplication &&
        newClientApplication &&
        !M2MClientApplicationToSpa
      ) {
        await this.apiAdminCallService.deleteClientApplicationInAuth0(
          clientApplication[ClientApplicationKeys.CLIENT_ID],
        );
        this.logger.info(
          {},
          `Client app ${
            clientApplication[ClientApplicationKeys.CLIENT_ID]
          } deleted successfully after Tenant creation problems`,
        );
      }
      ErrorService.logAndThrowFunctionError(
        error,
        'creating tenant',
        'createTenant',
        false,
        500,
      );
    }
  }

  /**
   * [Create a m2m client application for tenant]
   */
  async createM2mApplicationForTenant(tenantId: string): Promise<{
    m2mClientApplication: ClientApplication;
    newM2mClientApplication: boolean;
    message: string;
  }> {
    try {
      const tenantConfigs: Array<Config> =
        await this.apiMetadataCallService.fetchConfig(tenantId, TENANT_FLAG);
      if (tenantConfigs && tenantConfigs.length > 1) {
        ErrorService.throwError(
          `shall never happen: more than one config was found for tenant with id ${tenantId}`,
        );
      } else if (!tenantConfigs || tenantConfigs.length < 1) {
        ErrorService.throwError(
          `shall never happen: no config was found for tenant with id ${tenantId}`,
        );
      }

      const name = tenantConfigs[0][ConfigKeys.NAME];

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();
      const m2mClientApplicationName = craftM2mClientApplicationName(name);
      const m2mClientApplicationCreationResponse: {
        clientApplication: ClientApplication;
        newClientApplication: boolean;
      } = await this.createClientApplicationIfRequired(
        m2mClientApplicationName,
        undefined, // defaultAlias
        [], // aliases
        clientApplicationsList,
        tenantId,
        SUPER_ENTITY_ID, // entityId
      );

      return {
        m2mClientApplication:
          m2mClientApplicationCreationResponse.clientApplication,
        newM2mClientApplication:
          m2mClientApplicationCreationResponse.newClientApplication,
        message: `M2M client application has been successfully ${
          m2mClientApplicationCreationResponse.newClientApplication
            ? 'created'
            : 'retrieved'
        } for tenant with id ${tenantId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating m2m client application for tenant',
        'createM2mApplicationForTenant',
        false,
        500,
      );
    }
  }

  /**
   * [Create a client application if required]
   */
  async createClientApplicationIfRequired(
    clientApplicationName: string,
    defaultAlias: string,
    aliases: Array<string>,
    clientApplicationsList: Array<ClientApplication>,
    tenantId?: string,
    entityId?: string,
  ): Promise<{
    clientApplication: ClientApplication;
    newClientApplication: boolean;
  }> {
    try {
      let clientApplication: ClientApplication =
        await this.retrieveClientApplicationByNameIfExisting(
          clientApplicationName,
          clientApplicationsList,
        );
      let newClientApplication = false;

      if (clientApplication) {
        const clientApplicationTenantId: string =
          this.extractTenantIdFromClientApplication(clientApplication);

        const clientApplicationEntityId: string =
          this.extractEntityIdFromClientApplication(clientApplication);
        if (tenantId && tenantId !== clientApplicationTenantId) {
          ErrorService.throwError(
            `shall never happen: invalid tenantId stored in '${
              clientApplication[ClientApplicationKeys.NAME]
            }' client application's metadata (current: ${clientApplicationTenantId}, expected: ${tenantId})`,
          );
        }
        if (entityId && entityId !== clientApplicationEntityId) {
          ErrorService.throwError(
            `shall never happen: invalid entityId stored in '${
              clientApplication[ClientApplicationKeys.NAME]
            }' client application's metadata (current: ${clientApplicationEntityId}, expected: ${entityId})`,
          );
        }
      } else {
        // No client application with the same name exists, create a new client application

        // Before creating new client application, check aliases (rest.aliases) is not already used by another client application
        this.checkTenantAliases(aliases, clientApplicationsList);

        // WORKAROUND create a temporary "NotInteractive" client application, it can be turned into a SPA at a later stage
        clientApplication =
          await this.apiAdminCallService.createClientApplicationInAuth0(
            clientApplicationName,
            defaultAlias,
            aliases,
            AppType.NotInteractive,
            tenantId, // optional
            entityId, // optional
          );

        await this.apiAdminCallService.createGrantForClientApplication(
          clientApplication[ClientApplicationKeys.CLIENT_ID],
          config().acceptedAudience,
          ASSETS_API_REQUIRED_SCOPES,
        );

        newClientApplication = true;
      }

      return {
        clientApplication,
        newClientApplication,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating client application if required',
        'createClientApplicationIfRequired',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a client application by name if existing]
   */
  async retrieveClientApplicationByNameIfExisting(
    clientApplicationName: string,
    clientApplicationsList: Array<ClientApplication>,
  ): Promise<ClientApplication> {
    try {
      let clientApplication: ClientApplication;

      const filteredClientApplicationsList: Array<ClientApplication> =
        clientApplicationsList.filter((clientApp: ClientApplication) => {
          return (
            clientApp[ClientApplicationKeys.NAME] === clientApplicationName
          );
        });
      if (filteredClientApplicationsList.length > 0) {
        // Client application with this name already exists
        clientApplication = filteredClientApplicationsList[0];
      }

      return clientApplication;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving client application by name if existing',
        'retrieveClientApplicationByNameIfExisting',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of client applications by tenantId]
   */
  async listAllClientApplicationsByTenantIdIfExisting(
    tenantId: string,
  ): Promise<Array<ClientApplication>> {
    try {
      // List all client applications
      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();
      // Filter tenant's client applications, which have "tenantId" as flag in their metadata
      const tenantClientApplicationsList: Array<ClientApplication> =
        clientApplicationsList.filter(({ clientMetadata }) => {
          return (
            clientMetadata?.[ClientApplicationKeys.METADATA__TENANT_ID] ===
            tenantId
          );
        });

      return tenantClientApplicationsList;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all client applications by tenantId',
        'listAllClientApplicationsByTenantIdIfExisting',
        false,
        500,
      );
    }
  }

  private preventDeleteDefaultCodefiTenantData(tenantId) {
    if (tenantId === RESERVED_DEFAULT_DATA_TENANT_ID) {
      throw new Error('Cannot delete data from default tenant Id');
    }
  }

  /**
   * [Delete tenant]
   */
  async deleteTenant(tenantId: string): Promise<DeleteTenantOutput> {
    try {
      this.preventDeleteDefaultCodefiTenantData(tenantId);

      const tenantClientApplicationsList: Array<ClientApplication> =
        await this.listAllClientApplicationsByTenantIdIfExisting(tenantId);

      // Delete all tenant's client appications in Auth0
      await Promise.all(
        tenantClientApplicationsList.map(
          (clientApplication: ClientApplication) => {
            return this.apiAdminCallService.deleteClientApplicationInAuth0(
              clientApplication[ClientApplicationKeys.CLIENT_ID],
            );
          },
        ),
      );

      // Delete all data in the services' databases
      await Promise.all([
        this.apiWorkflowUtilsService.deleteTenant(tenantId), // Delete all data in Workflow-APi's DB
        this.apiMetadataUtilsService.deleteTenant(tenantId), // Delete all data in Metadata-APi's DB
        this.apiKycUtilsService.deleteTenant(tenantId), // Delete all data in KYC-APi's DB
        this.apiEntityCallService.deleteTenant(tenantId), // Delete tenant in Entity-api
      ]);

      return {
        message: `Codefi Assets tenant with ID ${tenantId} has been successfully deleted`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting tenant',
        'deleteTenant',
        false,
        500,
      );
    }
  }

  /**
   * [Check for a tenant type and then for permissions based on a single or multi issuer setup]
   */
  async checkTenantTypePermissions(
    user,
    tenantId,
  ): Promise<[boolean, TenantType]> {
    const tenantConfigs: Array<Config> =
      await this.apiMetadataCallService.fetchConfig(tenantId, TENANT_FLAG);

    let operationAllowed = false;
    let tenantType: TenantType;

    if (
      tenantConfigs &&
      tenantConfigs.length > 0 &&
      tenantConfigs[0] &&
      tenantConfigs[0][ConfigKeys.DATA] &&
      tenantConfigs[0][ConfigKeys.DATA][ConfigKeys.DATA__TENANT_TYPE]
    ) {
      tenantType =
        tenantConfigs[0][ConfigKeys.DATA][ConfigKeys.DATA__TENANT_TYPE];

      if (tenantType === TenantType.PLATFORM_SINGLE_ISSUER) {
        if (
          user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
          user[UserKeys.USER_TYPE] === UserType.ADMIN ||
          user[UserKeys.USER_TYPE] === UserType.ISSUER
        ) {
          operationAllowed = true;
        }
      } else {
        if (
          user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
          user[UserKeys.USER_TYPE] === UserType.ADMIN
        ) {
          operationAllowed = true;
        }
      }
    } else {
      // NO CONFIG WAS FOUND FOR THIS TENANT
      // This shall never happen but occured on Carbon project
      // In this case, we authorize config creation
      if (
        user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
        user[UserKeys.USER_TYPE] === UserType.ADMIN
      ) {
        operationAllowed = true;
      }
    }

    return [operationAllowed, tenantType];
  }

  /**
   * [Check if the tenant aliases are already used by another client appplication]
   */
  checkTenantAliases(
    aliasesToCheck: Array<string>,
    clientApplicationsList: Array<ClientApplication>,
  ): boolean {
    try {
      const existingAliases = clientApplicationsList.reduce(
        (memo, clientApplication: ClientApplication) => {
          const aliases =
            clientApplication?.[ClientApplicationKeys.METADATA]?.[
              ClientApplicationKeys.METADATA__ALIASES
            ] || '[]';

          let results;
          try {
            // We add a try/catch here because in case an invalid alias that can't be parsed is created in Auth0, we don't want the feature to be broken.
            results = JSON.parse(aliases).filter((alias) =>
              aliasesToCheck.includes(alias),
            );
          } catch (error) {
            results = [];
          }

          return results?.length
            ? memo.concat({
                aliases: results,
                name: clientApplication?.[ClientApplicationKeys.NAME],
              })
            : memo;
        },
        [],
      );

      if (existingAliases.length > 0) {
        ErrorService.throwError(
          `invalid aliase(s): '${existingAliases[0].aliases?.join(
            ', ',
          )}'. Those are already taken by '${
            existingAliases[0].name
          }' client application.`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking tenant aliases',
        'checkTenantAliases',
        false,
        500,
      );
    }
  }

  /**
   * [Extract tenantId from client appplication's metadata]
   */
  extractTenantIdFromClientApplication(
    clientApplication: ClientApplication,
  ): string {
    return clientApplication?.[ClientApplicationKeys.METADATA]?.[
      ClientApplicationKeys.METADATA__TENANT_ID
    ];
  }

  /**
   * [Extract entityId from client appplication's metadata]
   */
  extractEntityIdFromClientApplication(
    clientApplication: ClientApplication,
  ): string {
    return clientApplication?.[ClientApplicationKeys.METADATA]?.[
      ClientApplicationKeys.METADATA__ENTITY_ID
    ];
  }

  /**
   * [Delete tenant Data]
   */
  async deleteTenantData(
    tenantId: string,
    tenantDataDeleteQueryParms: DeleteTenantDataQueryInput,
  ): Promise<DeleteTenantDataOutput> {
    try {
      this.preventDeleteDefaultCodefiTenantData(tenantId);
      const tenantConfig: Config =
        await this.configService.retrieveTenantConfig(tenantId);

      const tenantFirstUser =
        await this.apiAdminCallService.retrieveFirstUserOfClient(tenantId);

      //TODO this requires to research and fix nestJS level to make boolean parameters to come as boolean correctly 2021-Sep-16
      // Convert boolean parameters coming as string to boolean
      for (const property in tenantDataDeleteQueryParms) {
        if (tenantDataDeleteQueryParms[property] === 'true') {
          tenantDataDeleteQueryParms[property] = true;
        } else if (tenantDataDeleteQueryParms[property] === 'false') {
          tenantDataDeleteQueryParms[property] = false;
        }
      }

      const promises = [];
      if (tenantDataDeleteQueryParms.deleteTenantKYCTemplateData) {
        promises.push(this.apiKycUtilsService.deleteTenant(tenantId));
      }

      if (tenantDataDeleteQueryParms.deleteTenantWorkflowData) {
        promises.push(this.apiWorkflowUtilsService.deleteTenant(tenantId));
      }

      if (tenantDataDeleteQueryParms.deleteTenantMetaData) {
        promises.push(
          this.apiMetadataUtilsService.deleteTenant(
            tenantId,
            tenantDataDeleteQueryParms.doNotDeleteTenantConfigs,
            tenantDataDeleteQueryParms.doNotDeleteTenantUsers,
            tenantDataDeleteQueryParms.doNotDeleteTenantAssetTemplates,
            tenantDataDeleteQueryParms.doNotDeleteTenantAssetElements,
          ),
        );
      }

      if (promises.length <= 0) {
        ErrorService.logAndThrowFunctionError(
          'No parameter passed for tenant Data Cleanup, set one ore more of query parameters deleteTenantKYCTemplateData, deleteTenantWorkflowData or  deleteTenantMetaData',
          'No data cleanup done',
          'deleteTenantData',
          false,
          500,
        );
      }

      await Promise.all(promises);

      //Add back the Initial Users if Users are deleted as part of tenant Data Cleanup
      if (
        tenantDataDeleteQueryParms.deleteTenantMetaData &&
        !tenantDataDeleteQueryParms.doNotDeleteTenantUsers
      ) {
        const { firstUser, codefiUsers } =
          await this.userCreationService.createInitialUsers(
            tenantId,
            tenantFirstUser?.email, // firstUserEmail (caution: tenant first user can be undefined)
            undefined, // firstUserPassword
            tenantFirstUser?.firstName, // firstUserFirstName (caution: tenant first user can be undefined)
            tenantFirstUser?.lastName, // firstUserLastName (caution: tenant first user can be undefined)
            tenantConfig[ConfigKeys.DATA][ConfigKeys.DATA__TENANT_NAME] ||
              tenantConfig[ConfigKeys.NAME], //firstUserCompanyName
            tenantConfig[ConfigKeys.DATA][ConfigKeys.DATA__TENANT_TYPE], //tenantType
            false, // e2eTestUsers (if set to 'true', no email will be sent to tenant's users)
          );

        const codefiUsersIds = {};
        for (const [key, user] of Object.entries(codefiUsers)) {
          codefiUsersIds[key] = user[UserKeys.USER_ID];
        }

        const dataWithUsers = {
          ...tenantConfig.data,
          [ConfigKeys.DATA__FIRST_USER_ID]: firstUser[UserKeys.USER_ID],
          [ConfigKeys.DATA__CODEFI_USERS_IDS]: JSON.stringify(codefiUsersIds),
        };

        // update config with newly created Tenant UserIds
        await this.configService.createOrUpdateConfig(
          tenantId,
          tenantConfig.name,
          tenantConfig.logo,
          tenantConfig.mailLogo,
          tenantConfig.mailColor,
          tenantConfig.mainColor,
          tenantConfig.mainColorLight,
          tenantConfig.mainColorLighter,
          tenantConfig.mainColorDark,
          tenantConfig.mainColorDarker,
          dataWithUsers, //data
          TENANT_FLAG, // userId userContext[UserKeys.USER_ID] ?? Confirm
          tenantConfig.language,
          tenantConfig.region,
          tenantConfig.preferences,
          tenantConfig.restrictedUserTypes,
          tenantConfig.restrictedAssetTypes,
        );
      }
      return {
        message: `Codefi Assets data of tenant  with ID ${tenantId} has been successfully deleted`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting tenant Data',
        'deleteTenantData',
        false,
        500,
      );
    }
  }

  /**
   * [List all tenantIds and client applications in Auth0]
   */
  async listAllTenantIdsAndClientApplicationsInAuth0(): Promise<{
    tenantIds: Array<string>;
    clientApplicationsList: Array<ClientApplication>;
    clientApplicationsObject: {
      [tenantId: string]: ClientApplication;
    };
  }> {
    try {
      // Fetch assets client applications with a tenantId
      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();
      const clientApplicationsObject: {
        [tenantId: string]: ClientApplication;
      } = {};

      const tenantIds: Array<string> = [];
      clientApplicationsList.map((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          const tenantId =
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__TENANT_ID
            ];
          if (!tenantIds.includes(tenantId)) {
            tenantIds.push(tenantId);
          }

          if (!clientApplicationsObject[tenantId]) {
            clientApplicationsObject[tenantId] = clientApplication;
          } else if (
            clientApplicationsObject[tenantId]?.[
              ClientApplicationKeys.NAME
            ]?.includes('M2M')
          ) {
            clientApplicationsObject[tenantId] = clientApplication;
          }
        }
      });
      return {
        tenantIds,
        clientApplicationsList,
        clientApplicationsObject,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all tenantIds',
        'listAllTenantIds',
        false,
        500,
      );
    }
  }
}
