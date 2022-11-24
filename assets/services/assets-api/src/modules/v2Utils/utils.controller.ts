import {
  Req,
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpCode,
  Param,
  Delete,
  Header,
  Put,
  UseFilters,
} from '@nestjs/common';
import { Request } from 'express';
import web3Utils from 'web3-utils';

import ErrorService from 'src/utils/errorService';

import {
  keys as KycTemplateKeys,
  RawKycTemplate,
} from 'src/types/kyc/template';

import { stateRules } from 'src/types/states';
import {
  CleanE2eTestUsersQueryInput,
  RetrieveIdentityOutput,
  RetrieveIdentityQueryInput,
  ListAllTokenStateOutput,
  RetrieveCertificateQueryInput,
  RetrieveCertificateOutput,
  CreateConfigBodyInput,
  CreateConfigOutput,
  WithdrawEtherBodyInput,
  WithdrawEtherOutput,
  RetrievePartitionsQueryInput,
  RetrievePartitionOutput,
  CreateHTLCOutput,
  CreateTenantBodyInput,
  CreateTenantOutput,
  MAX_TENANTS_COUNT,
  ListAllTenantsOutput,
  ListAllTenantsQueryInput,
  RetrieveTenantParamInput,
  RetrieveTenantOutput,
  DeleteTenantOutput,
  DeleteTenantParamInput,
  RetrievePostmanCredentialsParamInput,
  RetrievePostmanCredentialsOutput,
  GetConfigQueryInput,
  ClearInvalidTokenQueryInput,
  RetrieveConfigOutput,
  ClearInvalidUserWalletsQueryInput,
  DeleteTenantDataQueryInput,
  DeleteTenantDataOutput,
  DeleteTenantDataParamInput,
  ClearInvalidUserMetadataQueryInput,
  CleanAllClientGrantsQueryInput,
  CleanTestTenantsQueryInput,
  CreateM2mApplicationForTenantParamInput,
  CreateM2mApplicationForTenantOutput,
  ClearInvalidUserWalletsQueryInput2,
  CleanAllInvalidKycTemplateIdsQueryInput,
  CleanCodefiUsersQueryInput,
  CleanTenantInitialCodefiUsersParamInput,
  RetrieveHoldDataQueryInput,
  RetrieveHoldDataOutput,
} from './utils.dto';
import { IdentityService } from './utils.service/identity';

import { EthHelperService } from '../v2Eth/eth.service';
import { ApiSCCallService } from '../v2ApiCall/api.call.service/sc';
import { EthService, EthServiceType } from 'src/types/ethService';
import {
  keys as UserContextKeys,
  IUserContext,
  extractUsertypeFromContext,
} from 'src/types/userContext';
import {
  keys as UserKeys,
  UserType,
  User,
  isAdministratorUserType,
} from 'src/types/user';
import {
  DEFAULT_HYBRID_TOKEN_STANDARD,
  TokenCategory,
  ZERO_ADDRESS,
} from 'src/types/smartContract';
import { ApiMetadataCallService } from '../v2ApiCall/api.call.service/metadata';
import {
  keys as ConfigKeys,
  ConfigType,
  TENANT_FLAG,
  Config,
} from 'src/types/config';
import { TokenIdentifierEnum } from 'src/old/constants/enum';
import { keys as WalletKeys, Wallet, WalletType } from 'src/types/wallet';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';
import { ConfigService } from '../v2Config/config.service';
import { setToLowerCaseExceptFirstLetter } from 'src/utils/case';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import { newHTLC } from 'src/utils/htlc';
import { keys as HTLCKeys, HTLC } from 'src/types/htlc';
import { TenantService } from './utils.service/tenant';
import {
  keys as ClientApplicationKeys,
  ClientApplication,
  Region,
  maskClientApplication,
} from 'src/types/clientApplication';
import {
  ApiAdminCallService,
  AppType,
} from '../v2ApiCall/api.call.service/admin';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { keys as HeaderKeys } from 'src/types/headers';
import { PostmanCredentials } from 'src/types/postman';
import { TokenDeletionService } from '../v2Token/token.service/deleteToken';
import { keys as TokenKeys, Token } from 'src/types/token';
import { RawAssetTemplate } from 'src/types/asset/template';
import { keys as ClientKeys, TenantType } from 'src/types/clientApplication';

import { NestJSPinoLogger } from '@consensys/observability';
import { sleep } from 'src/utils/sleep';
import {
  extractEntityIdFromRequest,
  extractTenantIdFromRequest,
  Protected,
} from '@consensys/auth';
import { Auth0User, craftAuth0TenantId } from 'src/types/authentication';
import { AppToHttpFilter } from '@consensys/error-handler';
import {
  keys as GrantKeys,
  Grant,
  ASSETS_API_REQUIRED_SCOPES,
} from 'src/types/grant';
import { IAccount } from 'pegasys-orchestrate';
import { LinkService } from '../v2Link/link.service';
import { EntityType } from 'src/types/entity';
import { AssetCreationFlow } from 'src/types/asset';
import { craftOrchestrateTenantId } from 'src/utils/orchestrate';
import { KYCTemplateService } from '../v2KYCTemplate/kyc.template.service';
import { UserCreationService } from '../v2User/user.service/createUser';
import { Hold, formatHold } from 'src/types/hold';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';
import { ApiOperation } from '@nestjs/swagger';
import { UsecaseService } from '../v2Usecase/usecase.service';
import { TenantRoleMigrationService } from './utils.service/tenantRoleMigration';
import { EntityMigrationService } from './utils.service/entityMigration';
import { NestedUserFixService } from './utils.service/nestedUserFix';
import { DevNamespaceUsersFixService } from './utils.service/devNamespaceUsersFix';
import { DemoNamespaceUsersFixService } from './utils.service/demoNamespaceUsersFix';
import { UsageMetricsService } from './utils.service/usageMetrics';
import { NetworkSelectionService } from './utils.service/networkSelection';

@Controller('v2/utils')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class UtilsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly userCreationService: UserCreationService,
    private readonly identityService: IdentityService,
    private readonly ethHelperService: EthHelperService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly partitionService: PartitionService,
    private readonly tenantService: TenantService,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly tokenDeletionService: TokenDeletionService,
    private readonly linkService: LinkService,
    private readonly kycTemplateService: KYCTemplateService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly usecaseService: UsecaseService,
    private readonly tenantRoleMigrationService: TenantRoleMigrationService,
    private readonly entityMigrationService: EntityMigrationService,
    private readonly nestedUserFixService: NestedUserFixService,
    private readonly devNamespaceUsersFixService: DevNamespaceUsersFixService,
    private readonly demoNamespaceUsersFixService: DemoNamespaceUsersFixService,
    private readonly usageMetricsServiceService: UsageMetricsService,
    private readonly networkSelectionService: NetworkSelectionService,
  ) {}

  @Put('fix/network/selection')
  @HttpCode(200)
  @Protected(true, [])
  async fixNetworkSelection(
    @UserContext() userContext: IUserContext,
    @Query('dryRun') dryRun: boolean,
    @Query('cleanConfigs') cleanConfigs: boolean,
    @Query('cleanTokens') cleanTokens: boolean,
  ): Promise<any> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      // The following script aims make sure every token and every config in the DB
      // have a valid 'defaultNetworkKey'.
      // Before the migration , they used to have a 'defaultChainId'.

      const {
        missingConfigs,
        configsWithValidDefaultNetworkKey,
        configsWithoutDefaultNetworkKey,
        configsWithInvalidDefaultNetworkKey,
        tokensWithValidDefaultNetworkKey,
        tokensWithoutDefaultNetworkKey,
        tokensWithInvalidDefaultNetworkKey,
        unexpectedConfigIssue,
        unexpectedTokenIssue,
      } = await this.networkSelectionService.replaceChainIdByNetworkKeyWhenRequired(
        dryRun,
        cleanConfigs,
        cleanTokens,
      );

      const response = {
        missingConfigs,
        configsWithValidDefaultNetworkKey,
        configsWithoutDefaultNetworkKey,
        configsWithInvalidDefaultNetworkKey,
        tokensWithValidDefaultNetworkKey,
        tokensWithoutDefaultNetworkKey,
        tokensWithInvalidDefaultNetworkKey,
        total0: missingConfigs.length,
        total1: configsWithValidDefaultNetworkKey.length,
        total2: configsWithoutDefaultNetworkKey.length,
        total3: configsWithInvalidDefaultNetworkKey.length,
        total4: tokensWithValidDefaultNetworkKey.length,
        total5: tokensWithoutDefaultNetworkKey.length,
        total6: tokensWithInvalidDefaultNetworkKey.length,
        unexpectedConfigIssue,
        unexpectedTokenIssue,
        message: `${
          configsWithoutDefaultNetworkKey.length +
          configsWithInvalidDefaultNetworkKey.length
        } invalid config(s) ${
          cleanConfigs ? 'updated successfully' : 'listed successfully'
        }, and ${
          tokensWithoutDefaultNetworkKey.length +
          tokensWithInvalidDefaultNetworkKey.length
        } invalid token(s) ${
          cleanTokens ? 'updated successfully' : 'listed successfully'
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fixing network selection',
        'fixNetworkSelection',
        true,
        500,
      );
    }
  }

  @Get('usage/metrics')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveUsageMetrics(
    @UserContext() userContext: IUserContext,
    @Query('singleTenantIdToRetrieve') singleTenantIdToRetrieve: string,
    @Query('fetchAuth0Users') fetchAuth0Users: boolean,
    @Query('fetchTransactions') fetchTransactions: boolean,
  ): Promise<any> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      // The purpose of this endpoint is to retrieve some usage metrics per tenant

      const stackUsageMetrics =
        await this.usageMetricsServiceService.retrieveUsageMetrics(
          fetchAuth0Users,
          fetchTransactions,
          singleTenantIdToRetrieve,
        );

      try {
        this.logger.info(
          `USAGE METRICS ${JSON.stringify(stackUsageMetrics || [])}`,
        );
      } catch (error) {}

      return stackUsageMetrics;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving usage metrics',
        'retrieveUsageMetrics',
        true,
        500,
      );
    }
  }

  @Get('usage/metrics/networks')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveNetworkUsageMetrics(
    @UserContext() userContext: IUserContext,
    @Query('networkKey') networkKey: string,
    @Query('singleTenantIdToRetrieve') singleTenantIdToRetrieve: string,
    @Query('withDetailedTokenList') withDetailedTokenList: boolean,
  ): Promise<any> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      // The purpose of this endpoint is to retrieve some usage metrics per tenant

      const stackNetworkUsageMetrics =
        await this.usageMetricsServiceService.retrieveNetworkUsageMetrics(
          networkKey,
          singleTenantIdToRetrieve,
          withDetailedTokenList,
        );

      try {
        this.logger.info(
          `NETWORK USAGE METRICS ${JSON.stringify(
            stackNetworkUsageMetrics || [],
          )}`,
        );
      } catch (error) {}

      return stackNetworkUsageMetrics;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving network usage metrics',
        'retrieveNetworkUsageMetrics',
        true,
        500,
      );
    }
  }

  @Put('fix/demo-namespace/users')
  @HttpCode(200)
  @Protected(true, [])
  async fixDemoNamespaceUsers(
    @UserContext() userContext: IUserContext,
    @Query('dryRun') dryRun: boolean,
    @Query('singleTenantIdToFix') singleTenantIdToFix: string,
    @Query('singleEntityIdToFix') singleEntityIdToFix: string,
  ): Promise<any> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      // The following script aims to add a 'subTenantId' flag in 'user.data'
      // to distinguish users from the "dev" namespace from users from the "demo"
      // namespace (in the demo cluster only).

      // DEMO cluster
      // This script is only meant for the dev cluster, where we have different
      // namespaces ("dev" and "demo") within the same cluster.
      // All namespaces share the same Entity-Api which is why we need a way to
      // distinguish entities from "dev" namespace and entities from "demo" namespace.

      // PROD cluster
      // The script won't be run in prod cluster, and even if it were, it would have
      // no impact as there's one single namespace there.

      const response =
        await this.demoNamespaceUsersFixService.fixDemoNamespaceUsers(
          dryRun,
          singleTenantIdToFix,
          singleEntityIdToFix,
        );

      return {
        updatedEntitiesLnegth: response?.updatedEntities?.length,
        updateFailEntitiesLength: response?.updateFailEntities?.length,
        alreadyMigratedEntitiesLength:
          response?.alreadyMigratedEntities?.length,
        invalidEntitiesLength: response?.invalidEntities?.length,
        updatedEntities: response?.updatedEntities,
        updateFailEntities: response?.updateFailEntities,
        alreadyMigratedEntities: response?.alreadyMigratedEntities,
        invalidEntities: response?.invalidEntities,
        message: `${response?.updatedEntities?.length} demo namespace user(s) ${
          dryRun ? 'listed successfully' : 'fixed successfully'
        } (failures: ${response?.updateFailEntities?.length})`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fixing demo namespace users',
        'fixDemoNamespaceUsers',
        true,
        500,
      );
    }
  }

  @Put('fix/dev-namespace/users')
  @HttpCode(200)
  @Protected(true, [])
  async fixDevNamespaceUsers(
    @UserContext() userContext: IUserContext,
    @Query('dryRun') dryRun: boolean,
    @Query('singleTenantIdToFix') singleTenantIdToFix: string,
    @Query('singleEntityIdToFix') singleEntityIdToFix: string,
  ): Promise<any> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      // The following script aims to add a 'subTenantId' flag in 'user.data'
      // to distinguish users from the "dev" namespace from users from the "demo"
      // namespace (in the dev cluster only).

      // DEV cluster
      // This script is only meant for the dev cluster, where we have different
      // namespaces ("dev" and "demo") within the same cluster.
      // All namespaces share the same Entity-Api which is why we need a way to
      // distinguish entities from "dev" namespace and entities from "demo" namespace.

      // PROD cluster
      // The script won't be run in prod cluster, and even if it were, it would have
      // no impact as there's one single namespace there.

      const response =
        await this.devNamespaceUsersFixService.fixDevNamespaceUsers(
          dryRun,
          singleTenantIdToFix,
          singleEntityIdToFix,
        );

      return {
        updatedEntitiesLnegth: response?.updatedEntities?.length,
        updateFailEntitiesLength: response?.updateFailEntities?.length,
        alreadyMigratedEntitiesLength:
          response?.alreadyMigratedEntities?.length,
        updatedEntities: response?.updatedEntities,
        updateFailEntities: response?.updateFailEntities,
        alreadyMigratedEntities: response?.alreadyMigratedEntities,
        message: `${response?.updatedEntities?.length} dev namespace user(s) ${
          dryRun ? 'listed successfully' : 'fixed successfully'
        } (failures: ${response?.updateFailEntities?.length})`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fixing dev namespace users',
        'fixDevNamespaceUsers',
        true,
        500,
      );
    }
  }

  @Put('fix/nested/users')
  @HttpCode(200)
  @Protected(true, [])
  async fixNestedUsers(
    @UserContext() userContext: IUserContext,
    @Query('dryRun') dryRun: boolean,
    @Query('singleTenantIdToFix') singleTenantIdToFix: string,
    @Query('singleEntityIdToFix') singleEntityIdToFix: string,
  ): Promise<any> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      // The following script aims to repair users that were updated at a time where the updateUser function was bugged,
      // and systematically copying "user.data" object inside "user.data.data" when a user was getting updated.

      const fixNestedUsers = await this.nestedUserFixService.fixNestedUsers(
        dryRun,
        singleTenantIdToFix,
        singleEntityIdToFix,
      );

      const response = {
        nestedUsersLength: fixNestedUsers.nestedUsers.length,
        nestedUsersFixFailLength: fixNestedUsers.nestedUsersFixFail.length,
        nestedUsers: fixNestedUsers.nestedUsers,
        nestedUsersFixFail: fixNestedUsers.nestedUsersFixFail,
        message: `${fixNestedUsers.nestedUsers.length} nested user(s) ${
          dryRun ? 'listed successfully' : 'fixed successfully'
        } (failures: ${fixNestedUsers.nestedUsersFixFail.length})`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fixing nested users',
        'fixNestedUsers',
        true,
        500,
      );
    }
  }

  @Put('migrate/entity-api/all')
  @HttpCode(200)
  @Protected(true, [])
  async migrateToEntityApi(
    @UserContext() userContext: IUserContext,
    @Query('dryRun') dryRun: boolean,
    @Query('migrateTenants') migrateTenants: boolean,
    @Query('migrateEntities') migrateEntities: boolean,
    @Query('singleTenantIdToMigrate') singleTenantIdToMigrate: string,
    @Query('singleEntityIdToMigrate') singleEntityIdToMigrate: string,
  ): Promise<any> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const alreadyMigratedEntities = [];
      const createdEntities = [];
      const createFailEntities = [];

      const alreadyMigratedWallets = [];
      const createdWallets = [];
      const createNotFoundWallets = [];
      const createFailWallets = [];

      const tenantResults = migrateTenants
        ? await this.entityMigrationService.migrateTenants(
            dryRun,
            singleTenantIdToMigrate,
          )
        : undefined;

      const tenants = migrateTenants
        ? tenantResults.alreadyMigratedTenants.concat(
            tenantResults.createdTenants,
          )
        : [singleTenantIdToMigrate];

      this.logger.info(
        `TENANT MIGRATION OVER FOR tenants ${JSON.stringify(tenants || [])}`,
      );

      for (const tenantId of tenants) {
        if (!tenantId) {
          continue;
        }
        const entityResults = migrateEntities
          ? await this.entityMigrationService.migrateEntities(
              tenantId,
              dryRun,
              singleEntityIdToMigrate,
            )
          : undefined;

        if (entityResults) {
          alreadyMigratedEntities.push(
            ...entityResults.alreadyMigratedEntities,
          );
          createdEntities.push(...entityResults.createdEntities);
          createFailEntities.push(...entityResults.createFailEntities);

          createdWallets.push(...entityResults.createdWallets);
          createFailWallets.push(...entityResults.createFailWallets);
        }
      }

      this.logger.info(
        {
          tenants: {
            alreadyMigratedTenantsCount:
              tenantResults?.alreadyMigratedTenants?.length,
            created: {
              successCount: tenantResults?.createdTenants?.length,
              failureCount: tenantResults?.createFailTenants?.length,
              failure: tenantResults?.createFailTenants,
            },
          },
          entities: {
            alreadyMigratedEntitiesCount: alreadyMigratedEntities.length,
            created: {
              successCount: createdEntities.length,
              failureCount: createFailEntities.length,
              failure: createFailEntities,
            },
          },
          wallets: {
            alreadyMigratedWalletsCount: alreadyMigratedWallets.length,
            created: {
              successCount: createdWallets.length,
              failureCount: createFailWallets.length,
              failure: createFailWallets,
            },
          },
        },
        '==================> MIGRATION OVER <==================',
      );

      return {
        tenants: {
          alreadyMigratedTenantsCount:
            tenantResults?.alreadyMigratedTenants?.length,
          alreadyMigratedTenants: tenantResults?.alreadyMigratedTenants,
          created: {
            successCount: tenantResults?.createdTenants?.length,
            failureCount: tenantResults?.createFailTenants?.length,
            success: tenantResults?.createdTenants,
            failure: tenantResults?.createFailTenants,
          },
        },
        entities: {
          alreadyMigratedEntitiesCount: alreadyMigratedEntities.length,
          alreadyMigratedEntities,
          created: {
            successCount: createdEntities.length,
            failureCount: createFailEntities.length,
            success: createdEntities,
            failure: createFailEntities,
          },
        },
        wallets: {
          alreadyMigratedWalletsCount: alreadyMigratedWallets.length,
          alreadyMigratedWallets,
          created: {
            successCount: createdWallets.length,
            notFoundCount: createNotFoundWallets.length,
            failureCount: createFailWallets.length,
            success: createdWallets,
            notFound: createNotFoundWallets,
            failure: createFailWallets,
          },
        },
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'migrating tenants to entity api',
        'migrateTenantsToEntityApi',
        true,
        500,
      );
    }
  }

  @Put('migrate/tenant-roles')
  @HttpCode(200)
  @Protected(true, [])
  async migrateTenantRoles(
    @UserContext() userContext: IUserContext,
    @Query('dryRun') dryRun: boolean,
  ): Promise<any> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);
      return await this.tenantRoleMigrationService.migrate(dryRun);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'migrating tenant roles',
        'migrateTenantRoles',
        true,
        500,
      );
    }
  }

  @Delete('clean/tenant')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllTestTenants(
    @UserContext() userContext: IUserContext,
    @Query() cleanTestTenantsQuery: CleanTestTenantsQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const testTenantsList: Array<{
        clientName: string;
        tenantId: string;
      }> = [];
      clientApplicationsList.forEach((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          if (
            clientApplication[ClientApplicationKeys.NAME].includes(
              'test_tenant_',
            ) ||
            clientApplication[ClientApplicationKeys.NAME].includes(
              'Ephemeral',
            ) ||
            clientApplication[ClientApplicationKeys.NAME].includes('Acme Corp ')
          ) {
            testTenantsList.push({
              clientName: clientApplication[ClientApplicationKeys.NAME],
              tenantId:
                clientApplication[ClientApplicationKeys.METADATA][
                  ClientApplicationKeys.METADATA__TENANT_ID
                ],
            });
          }
        }
      });

      if (cleanTestTenantsQuery.deleteTestTenants) {
        for (let index = 0; index < testTenantsList.length; index++) {
          const testTenant: { clientName: string; tenantId: string } =
            testTenantsList[index];
          try {
            // We delete the tenant within a try/catch here because we don't want the loop to stop in case a tenant deletion fails
            await this.tenantService.deleteTenant(testTenant.tenantId);
          } catch (error) {
            this.logger.error(
              {},
              `Tenant deletion failed for tenant with name ${testTenant.clientName} and ID: ${testTenant.tenantId})`,
            );
          }
        }
      }

      const response = {
        testTenantsList,
        total: testTenantsList.length,
        message: `${testTenantsList.length} test tenant(s) ${
          cleanTestTenantsQuery.deleteTestTenants
            ? 'deleted successfully'
            : 'listed successfully'
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning test tenants',
        'cleanAllTestTenants',
        true,
        500,
      );
    }
  }

  @Delete('clean/user/e2e')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllE2eTestUsers(
    @UserContext() userContext: IUserContext,
    @Query() cleanE2eTestUsersQuery: CleanE2eTestUsersQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const tenantIdsList: Array<string> = [];
      clientApplicationsList.forEach((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          tenantIdsList.push(
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__TENANT_ID
            ],
          );
        }
      });

      const e2eTestUsersList: Array<{
        tenantId: string;
        userId: string;
      }> = [];

      for (const tenantId of tenantIdsList) {
        // Fetch users
        const allUsers: Array<User> =
          await this.apiEntityCallService.fetchEntities(
            tenantId,
            {}, // filter
            true, // includeWallets
          );

        for (const user of allUsers) {
          if (user?.[UserKeys.DATA]?.['e2eTestUser']) {
            e2eTestUsersList.push({
              tenantId: user[UserKeys.TENANT_ID],
              userId: user[UserKeys.USER_ID],
            });
          }
        }
      }

      if (cleanE2eTestUsersQuery.deleteE2eTestUsers) {
        for (let index = 0; index < e2eTestUsersList.length; index++) {
          const e2eTestUser: { tenantId: string; userId: string } =
            e2eTestUsersList[index];
          await this.apiEntityCallService.deleteEntity(
            e2eTestUser.tenantId,
            e2eTestUser.userId,
          );
        }
      }

      const response = {
        e2eTestUsersList,
        total: e2eTestUsersList.length,
        message: `${e2eTestUsersList.length} e2e test user(s) ${
          cleanE2eTestUsersQuery.deleteE2eTestUsers
            ? 'deleted successfully'
            : 'listed successfully'
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning e2e test users',
        'cleanAllE2eTestUsers',
        true,
        500,
      );
    }
  }

  @Put('clean/tenant/:tenantId/initial/codefi/users')
  @HttpCode(200)
  @Protected(true, [])
  async cleanTenantInitialCodefiUsers(
    @UserContext() userContext: IUserContext,
    @Param() { tenantId }: CleanTenantInitialCodefiUsersParamInput,
  ): Promise<{ config: Config; codefiUsers: any; message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const config: Config = await this.configService.retrieveTenantConfig(
        tenantId,
      );

      const { codefiUsers } = await this.userCreationService.createInitialUsers(
        tenantId,
        undefined, // first user's email (optional)
        undefined, // first user's password (optional)
        undefined, // first user's first name (optional)
        undefined, // first user's last name (optional)
        undefined, // first user's company name (optional)
        config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__TENANT_TYPE] ||
          TenantType.PLATFORM_MULTI_ISSUER,
        true, // e2eTestUsers (if set to 'true', no email will be sent to tenant's users)
        undefined, // faucetNetworksKeys (optional)
        undefined, // authToken (optional - only required when faucetNetworksKeys are defined)
      );

      return {
        config,
        codefiUsers,
        message: `Initial codefi users were successfully cleaned for tenant with id ${tenantId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "cleaning tenant's initial codefi users",
        'cleanTenantInitialUsers',
        true,
        500,
      );
    }
  }

  @Delete('clean/token')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllInvalidTokens(
    @UserContext() userContext: IUserContext,
    @Query() clearInvalidTokenQuery: ClearInvalidTokenQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const tenantIdsList: Array<string> = [];
      clientApplicationsList.forEach((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          tenantIdsList.push(
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__TENANT_ID
            ],
          );
        }
      });

      const invalidTokens: Array<{ tenantId: string; tokenId: string }> = [];
      await Promise.all(
        tenantIdsList.map(async (tenantId: string) => {
          const assetTemplates: Array<RawAssetTemplate> =
            await this.apiMetadataCallService.fetchAssetTemplates(tenantId);
          const assetTemplateIds: Array<string> = assetTemplates.map(
            (assetTemplate: RawAssetTemplate) => {
              return assetTemplate.id;
            },
          );

          const tokensList =
            await this.apiMetadataCallService.retrieveTokenInDB(
              tenantId,
              TokenIdentifierEnum.all,
              undefined, // tokenKey
              false, // shallReturnSingleToken
              0, // offset
              undefined, // limit,
              false,
            );

          tokensList.tokens.map((token: Token) => {
            if (
              token &&
              token[TokenKeys.ASSET_TEMPLATE_ID] &&
              !assetTemplateIds.includes(token[TokenKeys.ASSET_TEMPLATE_ID])
            ) {
              // Token's asset template is invalid
              invalidTokens.push({
                tenantId,
                tokenId: token[TokenKeys.TOKEN_ID],
              });
            } else {
              // Token's asset template is valid
              return true;
            }
          });
        }),
      );

      if (clearInvalidTokenQuery.deleteInvalidTokens) {
        await Promise.all(
          invalidTokens.map(
            (invalidToken: { tenantId: string; tokenId: string }) => {
              this.logger.info(
                {},
                `Delete invalid token with ID: ${invalidToken.tokenId})`,
              );
              return this.tokenDeletionService.deleteToken(
                invalidToken.tenantId,
                TokenCategory.HYBRID,
                userContext[UserContextKeys.USER_ID],
                invalidToken.tokenId,
              );
            },
          ),
        );
      }

      const response = {
        invalidTokens,
        total: invalidTokens.length,
        message: `${invalidTokens.length} invalid token(s) ${
          clearInvalidTokenQuery.deleteInvalidTokens
            ? 'deleted successfully'
            : 'listed successfully'
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning invalid tokens tokens',
        'cleanAllInvalidTokens',
        true,
        500,
      );
    }
  }

  @Delete('clean/assetData')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllInvalidTokens2(
    @UserContext() userContext: IUserContext,
    @Query() clearInvalidTokenQuery: ClearInvalidTokenQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const tenantIdsList: Array<string> = [];
      clientApplicationsList.forEach((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          tenantIdsList.push(
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__TENANT_ID
            ],
          );
        }
      });

      const invalidTokens: Array<{
        tenantId: string;
        tokenId: string;
      }> = [];
      const validTokens: Array<{
        tenantId: string;
        tokenId: string;
      }> = [];
      await Promise.all(
        tenantIdsList.map(async (tenantId: string) => {
          const tokensList =
            await this.apiMetadataCallService.retrieveTokenInDB(
              tenantId,
              TokenIdentifierEnum.all,
              undefined, // tokenKey
              false, // shallReturnSingleToken
              undefined,
              undefined,
              false,
            );

          for (const token of tokensList.tokens) {
            let updatedParameters = {};

            let issuerId: string;
            // fix issuerId
            if (!token[TokenKeys.ISSUER_ID]) {
              if (token[TokenKeys.DATA]?.assetData?.issuerId) {
                issuerId = token[TokenKeys.DATA].assetData.issuerId;
              } else {
                try {
                  const issuer =
                    await this.linkService.retrieveIssuerLinkedToEntity(
                      tenantId,
                      token[TokenKeys.TOKEN_ID],
                      EntityType.ISSUER,
                    );
                  issuerId = issuer[UserKeys.USER_ID];
                } catch {
                  invalidTokens.push({
                    tenantId,
                    tokenId: token[TokenKeys.TOKEN_ID],
                  });
                }
              }

              if (issuerId) {
                updatedParameters = {
                  ...updatedParameters,
                  [TokenKeys.ISSUER_ID]: issuerId,
                };
              }
            }

            // fix creatorId
            let creatorId: string;
            if (!token[TokenKeys.ISSUER_ID]) {
              if (token[TokenKeys.DATA]?.assetData?.creatorId) {
                creatorId = token[TokenKeys.DATA].assetData.creatorId;
              } else {
                creatorId = issuerId;
              }

              if (creatorId) {
                updatedParameters = {
                  ...updatedParameters,
                  [TokenKeys.CREATOR_ID]: creatorId,
                };
              }
            }

            // fix reviewerId
            let reviewerId: string;
            if (!token[TokenKeys.REVIEWER_ID]) {
              if (token[TokenKeys.DATA]?.assetData?.reviewerId) {
                reviewerId = token[TokenKeys.DATA].assetData.reviewerId;
              }

              if (reviewerId) {
                updatedParameters = {
                  ...updatedParameters,
                  [TokenKeys.REVIEWER_ID]: reviewerId,
                };
              }
            }

            // fix assetCreationFlow
            let assetCreationFlow: AssetCreationFlow;
            if (!token[TokenKeys.DATA][TokenKeys.DATA__ASSET_CREATION_FLOW]) {
              if (token[TokenKeys.DATA]?.assetData?.assetCreationFlow) {
                assetCreationFlow =
                  token[TokenKeys.DATA].assetData.assetCreationFlow;
              } else {
                assetCreationFlow = AssetCreationFlow.SINGLE_PARTY;
              }

              if (assetCreationFlow) {
                updatedParameters = {
                  ...updatedParameters,
                  [TokenKeys.DATA]: {
                    ...token[TokenKeys.DATA],
                    [TokenKeys.DATA__ASSET_CREATION_FLOW]: assetCreationFlow,
                  },
                };
              }
            }

            if (Object.keys(updatedParameters).length > 0) {
              await this.apiMetadataCallService.updateTokenInDB(
                tenantId,
                token[TokenKeys.TOKEN_ID],
                updatedParameters,
              );
            }
          }
        }),
      );

      const response = {
        invalidTokens,
        invalidTokensTotal: invalidTokens.length,
        validTokens,
        validTokensTotal: validTokens.length,
        message: `${invalidTokens.length} invalid token(s) ${
          clearInvalidTokenQuery.deleteInvalidTokens
            ? 'deleted successfully'
            : 'listed successfully'
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning invalid tokens tokens',
        'cleanAllInvalidTokens',
        true,
        500,
      );
    }
  }

  @Put('clean/client/application')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllClientApplications(
    @UserContext() userContext: IUserContext,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      // Retrieve all client applications whose name start with Codefi Assets -
      const filteredClientApplicationsList: ClientApplication[] =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();
      await Promise.all(
        filteredClientApplicationsList.map(async (clientApplication) => {
          // Retrieve current config
          const defaultConfig: Config = (
            await this.apiMetadataCallService.fetchConfig(
              process.env.DEFAULT_CONFIG,
              undefined, // userId
            )
          )[0];

          const clientMetadata = clientApplication[ClientKeys.METADATA];
          // create config
          const configData = {
            ...defaultConfig[ConfigKeys.DATA],
            [ConfigKeys.DATA__DEFAULT_ALIAS]:
              clientMetadata[ClientKeys.METADATA__DEFAULT_ALIAS],
            [ConfigKeys.DATA__ALIASES]:
              clientMetadata[ClientKeys.METADATA__ALIASES],
            [ConfigKeys.DATA__TENANT_REGION]:
              clientMetadata[ClientKeys.METADATA__REGION] || Region.EU,
            [ConfigKeys.DATA__TENANT_TYPE]:
              clientMetadata[ClientKeys.METADATA__TENANT_TYPE] ||
              TenantType.PLATFORM_MULTI_ISSUER,
            [ConfigKeys.DATA__CREATED_AT]:
              clientMetadata[ClientKeys.METADATA__CREATED_AT],
            [ConfigKeys.DATA__TENANT_NAME]: clientApplication[ClientKeys.NAME],
            [ConfigKeys.DATA__FIRST_USER_ID]:
              clientMetadata[ClientKeys.METADATA__ADMIN_ID],
            [ConfigKeys.DATA__CODEFI_USERS_IDS]:
              clientMetadata[ClientKeys.METADATA__CODEFI_USERS_IDS],
          };

          await this.configService.createOrUpdateConfig(
            clientApplication[ClientKeys.CLIENT_ID],
            clientApplication[ClientKeys.NAME],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            configData,
            TENANT_FLAG, // userId
            undefined,
            undefined,
            {},
            [],
            [],
          );

          // update client application
          await this.apiAdminCallService.updateClientApplicationInAuth0(
            clientApplication[ClientKeys.CLIENT_ID], // Here we set the client applciation's id as tenantId
            clientApplication[ClientKeys.NAME],
            clientMetadata[ClientKeys.METADATA__DEFAULT_ALIAS],
            clientMetadata[ClientKeys.METADATA__ALIASES]
              ? JSON.parse(clientMetadata[ClientKeys.METADATA__ALIASES])
              : [],
            clientApplication[ClientKeys.APP_TYPE] as AppType,
            clientApplication[ClientKeys.GRANT_TYPES],
            clientApplication[ClientKeys.CLIENT_ID], // tenantId (by default, we use the client ID as tenantId)
            clientApplication,
          );
        }),
      );

      const response = {
        message: 'Client applications migrated successfully',
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning client applications',
        'cleanAllClientApplications',
        true,
        500,
      );
    }
  }

  @Put('clean/client/grants')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllClientGrants(
    @UserContext() userContext: IUserContext,
    @Query() cleanAllClientGrantsQuery: CleanAllClientGrantsQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const requiredAudiences = cleanAllClientGrantsQuery.requiredAudiences
        ? JSON.parse(cleanAllClientGrantsQuery.requiredAudiences)
        : [];

      const requiredScopes = ASSETS_API_REQUIRED_SCOPES; // We can eventually improve this later by allowing to define reqiredScopes as param

      // Retrieve all client applications whose name start with Codefi Assets -
      const filteredClientApplicationsList: ClientApplication[] =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const missingGrants: Array<{
        clientId: string;
        audience: string;
      }> = [];
      const deprecatedGrants: Array<Grant> = [];
      const unusedGrants: Array<Grant> = [];

      // Determine list of missing grants and deprecated grants
      await Promise.all(
        filteredClientApplicationsList.map(async (clientApplication) => {
          const existingGrants: Array<Grant> =
            await this.apiAdminCallService.retrieveGrantForClientApplication(
              clientApplication[ClientKeys.CLIENT_ID],
              undefined, // audience
            );

          requiredAudiences.map((requiredAudience: string) => {
            let grantFound = false;
            existingGrants.forEach((existingGrant) => {
              if (existingGrant[GrantKeys.AUDIENCE] === requiredAudience) {
                grantFound = true;

                const missingPermissions = [];
                requiredScopes.forEach((permission) => {
                  if (!existingGrant[GrantKeys.SCOPE].includes(permission)) {
                    missingPermissions.push(permission);
                  }
                });

                if (missingPermissions.length > 0) {
                  deprecatedGrants.push(existingGrant);
                } else {
                  // Existing grant is fine, do nothing
                }
              }
            });

            if (!grantFound) {
              missingGrants.push({
                clientId: clientApplication[ClientKeys.CLIENT_ID],
                audience: requiredAudience,
              });
            }
          });

          existingGrants.forEach((existingGrant) => {
            if (
              !requiredAudiences.includes(existingGrant[GrantKeys.AUDIENCE])
            ) {
              unusedGrants.push(existingGrant);
            }
          });
        }),
      );

      // Create all missing grants in Auth0
      if (cleanAllClientGrantsQuery.createMissingGrants) {
        await Promise.all(
          missingGrants.map(
            (missingGrant: { clientId: string; audience: string }) => {
              return this.apiAdminCallService.createGrantForClientApplication(
                missingGrant.clientId,
                missingGrant.audience,
                ASSETS_API_REQUIRED_SCOPES,
              );
            },
          ),
        );
      }

      // Delete and re-create deprecated grants in Auth0
      if (cleanAllClientGrantsQuery.recreateDeprecatedGrants) {
        await Promise.all(
          deprecatedGrants.map((deprecatedGrant: Grant) => {
            return this.apiAdminCallService.deleteGrantForClientApplication(
              deprecatedGrant[GrantKeys.ID],
            );
          }),
        );
        await Promise.all(
          deprecatedGrants.map((deprecatedGrant: Grant) => {
            return this.apiAdminCallService.createGrantForClientApplication(
              deprecatedGrant[GrantKeys.CLIENT_ID],
              deprecatedGrant[GrantKeys.AUDIENCE],
              ASSETS_API_REQUIRED_SCOPES,
            );
          }),
        );
      }

      // Delete unused grants in Auth0
      if (cleanAllClientGrantsQuery.deleteUnusedGrants) {
        await Promise.all(
          unusedGrants.map((unusedGrant: Grant) => {
            return this.apiAdminCallService.deleteGrantForClientApplication(
              unusedGrant[GrantKeys.ID],
            );
          }),
        );
      }

      const response = {
        missingGrants,
        deprecatedGrants,
        unusedGrants,
        message: 'Client grants migrated successfully',
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning client grants',
        'cleanAllClientGrants',
        true,
        500,
      );
    }
  }

  @Put('clean/user/wallet')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllInvalidUserWallets(
    @UserContext() userContext: IUserContext,
    @Query() clearInvalidUserWalletsQuery: ClearInvalidUserWalletsQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const tenantIdsList: Array<string> = [];
      clientApplicationsList.forEach((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          tenantIdsList.push(
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__TENANT_ID
            ],
          );
        }
      });

      let counter: number;
      const deprecatedWallets: Array<string> = [];

      for (const tenantId of tenantIdsList) {
        // Fetch users
        const allUsers: Array<User> =
          await this.apiEntityCallService.fetchEntities(
            tenantId,
            {}, // filter
            true, // includeWallets
          );

        for (const user of allUsers) {
          const wallets: Array<Wallet> = user[UserKeys.WALLETS];

          for (const wallet of wallets) {
            let invalidWallet: boolean;
            if (wallet[WalletKeys.WALLET_TYPE] === WalletType.VAULT) {
              try {
                const orchestrateWallet: IAccount =
                  await this.apiSCCallService.retrieveWallet(
                    wallet[WalletKeys.WALLET_ADDRESS],
                  );
                const walletAddress: string = orchestrateWallet?.address;
                if (walletAddress !== wallet[WalletKeys.WALLET_ADDRESS]) {
                  invalidWallet = true;
                }
              } catch (error) {
                invalidWallet = true;
              }
            }

            if (invalidWallet) {
              this.logger.info(
                {},
                `Invalid wallet found for user ${user[UserKeys.USER_ID]}: ${
                  wallet[WalletKeys.WALLET_ADDRESS]
                } ==> it needs to be deprecated`,
              );
            }

            if (
              invalidWallet &&
              clearInvalidUserWalletsQuery.deprecateInvalidWallets
            ) {
              // PROTECTION AGAINST RATE LIMIT ISSUES
              counter += 1;
              if (counter > 100) {
                counter = 0;
                sleep(2000);
              }

              // Deprecate invalid wallet
              await this.walletService.updateWallet(
                user[UserKeys.TENANT_ID], // Required in case 'tenantId'==='codefi'
                user[UserKeys.USER_ID],
                wallet[WalletKeys.WALLET_ADDRESS],
                {
                  assetsMigrationToEntityApi: true,
                  legacyAssetsWalletType: WalletType.VAULT_DEPRECATED, // wallet type used to flag a wallet that is supposed to be in the Vault but can't be found in the Vault anymore
                }, // newWalletData
                undefined, // setAsDefaultWallet
              );

              // Create new valid wallet and set it as default wallet
              await this.walletService.createWallet(
                user[UserKeys.TENANT_ID], // Required in case 'tenantId'==='codefi'
                user[UserKeys.USER_ID],
                undefined, //walletAddress
                WalletType.VAULT,
                undefined, // data
                true, // setAsDefault
              );

              deprecatedWallets.push(wallet[WalletKeys.WALLET_ADDRESS]);
            }
          }
        }
      }

      const response = {
        deprecatedWallets,
        total: deprecatedWallets.length,
        message: `${deprecatedWallets.length} invalid wallet(s) ${
          clearInvalidUserWalletsQuery.deprecateInvalidWallets
            ? 'deprecated successfully'
            : 'listed successfully'
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning invalid user wallets',
        'cleanAllInvalidUserWallets',
        true,
        500,
      );
    }
  }

  @Put('clean/user/wallet/public')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllInvalidUserWallets2(
    @UserContext() userContext: IUserContext,
    @Query() clearInvalidUserWalletsQuery2: ClearInvalidUserWalletsQueryInput2,
  ): Promise<{ message: string }> {
    try {
      // The purpose of this function is to retrieve list of wallets created prior Orchestrate multi-tenancy.
      // Those wallets have '_' as tenantId, which makes them accessible by everyone.
      // There's no feature in Orchestrate to update the tenantId of those wallets.
      // We'll have to update the tenantIds directly in the Hashicorp Vault, by asking the DevOps team.
      // The purpose of this function is to fetch the list of wallets that need to be updated.
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const tenantIdsList: Array<string> = [];
      clientApplicationsList.forEach((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          tenantIdsList.push(
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__TENANT_ID
            ],
          );
        }
      });

      let counter = 0;
      let counter2 = 0;
      const validWallets: Array<{
        wallet: IAccount;
      }> = [];

      const ignoredWallets: Array<{
        wallet: Wallet;
      }> = [];

      const publicWalletsToProtect: Array<{
        wallet: IAccount;
        newTenantID: string;
      }> = [];

      const userWalletsNotFound: Array<{
        user: User;
        wallet: Wallet;
      }> = [];

      const invalidWallets: Array<{
        wallet: IAccount;
        user: User;
      }> = [];

      const walletWithoutSuperUser: Array<{
        wallet: IAccount;
        user: User;
      }> = [];

      const codefiUserWallets: Array<{
        wallet: IAccount;
        user: User;
        newTenantID: string;
      }> = [];

      const unexpectedIssues1: Array<{
        wallet: Wallet;
        user: User;
      }> = [];

      const unexpectedIssues2: Array<{
        wallet: IAccount;
        user: User;
      }> = [];

      for (const tenantId of tenantIdsList) {
        // Fetch users
        const allUsers: Array<User> =
          await this.apiEntityCallService.fetchEntities(
            tenantId,
            {}, // filter
            true, // includeWallets
          );

        const MAX_WALLETS_LISTED = Number(clearInvalidUserWalletsQuery2.limit);
        if (
          counter2 >=
          Number(clearInvalidUserWalletsQuery2.offset) + MAX_WALLETS_LISTED
        ) {
          break;
        }

        for (const user of allUsers) {
          const wallets: Array<Wallet> = user[UserKeys.WALLETS];

          if (
            counter2 >=
            Number(clearInvalidUserWalletsQuery2.offset) + MAX_WALLETS_LISTED
          ) {
            break;
          }

          for (const wallet of wallets) {
            let orchestrateWallet: IAccount;

            if (
              counter2 >=
              Number(clearInvalidUserWalletsQuery2.offset) + MAX_WALLETS_LISTED
            ) {
              break;
            }

            // PROTECTION AGAINST RATE LIMIT ISSUES
            counter += 1;
            if (counter > 100) {
              counter = 0;
              sleep(2000);
            }

            // PROTECTION AGAINST TIME OUT ISSUES
            counter2 += 1;

            this.logger.info({ counter, counter2 });

            if (wallet[WalletKeys.WALLET_TYPE] === WalletType.VAULT) {
              if (counter2 > Number(clearInvalidUserWalletsQuery2.offset)) {
                try {
                  orchestrateWallet =
                    await this.apiSCCallService.retrieveWallet(
                      wallet[WalletKeys.WALLET_ADDRESS],
                    );
                } catch (error) {
                  userWalletsNotFound.push({
                    user,
                    wallet,
                  });
                  continue;
                }

                const walletAddress: string = orchestrateWallet?.address;
                if (
                  walletAddress !== wallet[WalletKeys.WALLET_ADDRESS] &&
                  web3Utils.toChecksumAddress(walletAddress) !==
                    wallet[WalletKeys.WALLET_ADDRESS]
                ) {
                  invalidWallets.push({
                    user,
                    wallet: orchestrateWallet,
                  });
                  continue;
                }

                if (
                  orchestrateWallet?.tenantID.startsWith('codefi:') ||
                  orchestrateWallet?.tenantID === '_'
                ) {
                  let walletOwner: User = user; // By default, the user ownns his own wallet
                  if (user?.[UserKeys.USER_TYPE] === UserType.VEHICLE) {
                    let superUser: User;
                    try {
                      superUser = await this.apiEntityCallService.fetchEntity(
                        tenantId,
                        user[UserKeys.SUPER_USER_ID],
                        true,
                      );
                      walletOwner = superUser; // In case the user is a vehicle, the wallet is owned by the vehicle's super user
                    } catch (error) {
                      walletWithoutSuperUser.push({
                        user,
                        wallet: orchestrateWallet,
                      });
                    }
                  }

                  const newTenantID: string = craftOrchestrateTenantId(
                    walletOwner[UserKeys.TENANT_ID],
                    walletOwner[UserKeys.USER_ID], // To be renamed entityId after integration with Entity-Api
                  );

                  if (user[UserKeys.TENANT_ID] === 'codefi') {
                    codefiUserWallets.push({
                      user,
                      wallet: orchestrateWallet,
                      newTenantID,
                    });
                  } else {
                    publicWalletsToProtect.push({
                      wallet: orchestrateWallet,
                      newTenantID,
                    });
                  }
                } else {
                  validWallets.push({ wallet: orchestrateWallet });
                }
              }
            } else {
              ignoredWallets.push({
                wallet,
              });
            }
          }
        }
      }

      if (clearInvalidUserWalletsQuery2.deprecateInvalidWallets) {
        for (const userWalletNotFound of userWalletsNotFound) {
          try {
            // Deprecate invalid wallet
            await this.walletService.updateWallet(
              userWalletNotFound.user[UserKeys.TENANT_ID], // Required in case 'tenantId'==='codefi'
              userWalletNotFound.user[UserKeys.USER_ID],
              userWalletNotFound.wallet[WalletKeys.WALLET_ADDRESS],
              {
                assetsMigrationToEntityApi: true,
                legacyAssetsWalletType: WalletType.VAULT_DEPRECATED, // wallet type used to flag a wallet that is supposed to be in the Vault but can't be found in the Vault anymore
              }, // newWalletData
              undefined, // setAsDefaultWallet
            );

            // Create new valid wallet and set it as default wallet
            await this.walletService.createWallet(
              userWalletNotFound.user[UserKeys.TENANT_ID], // Required in case 'tenantId'==='codefi'
              userWalletNotFound.user[UserKeys.USER_ID],
              undefined, //walletAddress
              WalletType.VAULT,
              undefined, // data
              true, // setAsDefault
            );
          } catch (error) {
            unexpectedIssues1.push(userWalletNotFound);
          }
        }
      }

      if (clearInvalidUserWalletsQuery2.deleteCodefiUsers) {
        for (const codefiUser of codefiUserWallets) {
          try {
            // Delete Codefi user
            await this.apiEntityCallService.deleteEntity(
              codefiUser.user[UserKeys.TENANT_ID],
              codefiUser.user[UserKeys.USER_ID],
            );
          } catch (error) {
            unexpectedIssues2.push(codefiUser);
          }
        }
      }

      const response = {
        publicWalletsToProtect,
        userWalletsNotFound,
        invalidWallets,
        walletWithoutSuperUser,
        codefiUserWallets,
        validWallets,
        ignoredWallets,
        unexpectedIssues1,
        unexpectedIssues2,
        total1: publicWalletsToProtect.length,
        total2: userWalletsNotFound.length,
        total3: invalidWallets.length,
        total4: walletWithoutSuperUser.length,
        total5: codefiUserWallets.length,
        total6: validWallets.length,
        total7: ignoredWallets.length,
        total: counter2,
        message: `${publicWalletsToProtect.length} public wallet(s) to be protected, were listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning invalid (public) user wallets',
        'cleanAllInvalidUserWallets',
        true,
        500,
      );
    }
  }

  @Put('clean/kyc/template/ids')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllInvalidKycTemplateIds(
    @UserContext() userContext: IUserContext,
    @Query()
    cleanAllInvalidKycTemplateIdsQuery: CleanAllInvalidKycTemplateIdsQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const tenantIdsList: Array<string> = [];
      clientApplicationsList.forEach((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          tenantIdsList.push(
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__TENANT_ID
            ],
          );
        }
      });

      const missingConfigs: Array<{
        tenantId: string;
      }> = [];

      const configsWithoutKycTemplateId: Array<{
        id: string;
        name: string;
        tenantId: string;
      }> = [];

      const configsWithInvalidKycTemplateId: Array<{
        id: string;
        name: string;
        tenantId: string;
      }> = [];

      const usersWithoutKycTemplateId: Array<User> = [];
      const usersWithInvalidKycTemplateId: Array<User> = [];

      const tokensWithoutKycTemplateId: Array<Token> = [];
      const tokensWithInvalidKycTemplateId: Array<Token> = [];

      const unexpectedConfigIssue: Array<Config> = [];
      const unexpectedUserIssue: Array<User> = [];
      const unexpectedTokenIssue: Array<Token> = [];

      let counter = 0;
      for (const tenantId of tenantIdsList) {
        counter++;
        this.logger.info(
          {},
          `Checking tenant with id ${tenantId} (number ${counter}/${tenantIdsList.length})`,
        );

        // First, retrieve list of valid kycTemplateIds
        const validKycTemplateIds: Array<string> = (
          await this.kycTemplateService.listAllKycTemplates(
            userContext[UserContextKeys.TENANT_ID],
            false, // includeElements
          )
        )?.map(
          (kycTemplate: RawKycTemplate) =>
            kycTemplate[KycTemplateKeys.TEMPLATE_ID],
        );

        let config: Config = await this.configService.retrieveTenantConfig(
          tenantId,
        );

        let cleanConfig: boolean;

        if (config[ConfigKeys.TENANT_ID] !== tenantId) {
          missingConfigs.push({ tenantId });

          cleanConfig = true;
        }

        const configKycTemplateId =
          config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__KYC_TEMPLATE_ID];
        if (!configKycTemplateId) {
          // Config without kycTemplateId
          configsWithoutKycTemplateId.push({
            id: config[ConfigKeys.ID],
            name: config[ConfigKeys.NAME],
            tenantId: config[ConfigKeys.TENANT_ID],
          });

          cleanConfig = true;
        } else if (!validKycTemplateIds?.includes(configKycTemplateId)) {
          // Config without kycTemplateId
          configsWithInvalidKycTemplateId.push({
            id: config[ConfigKeys.ID],
            name: config[ConfigKeys.NAME],
            tenantId: config[ConfigKeys.TENANT_ID],
          });

          cleanConfig = true;
        }

        if (cleanConfig && cleanAllInvalidKycTemplateIdsQuery.cleanConfigs) {
          try {
            const tenantKycTemplateId: string = (
              await this.kycTemplateService.retrieveDefaultCodefiKycTemplate(
                tenantId,
              )
            )?.[KycTemplateKeys.TEMPLATE_ID];

            const newConfigData = {
              ...config[ConfigKeys.DATA],
              [ConfigKeys.DATA__KYC_TEMPLATE_ID]: tenantKycTemplateId,
            };

            config = (
              await this.configService.createOrUpdateConfig(
                tenantId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                newConfigData,
                TENANT_FLAG, // userId
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
              )
            ).config;
          } catch (error) {
            unexpectedConfigIssue.push(config);
          }
        }

        const tenantDefaultKycTemplateId: string = (
          await this.kycTemplateService.retrieveTenantKycTemplate(
            tenantId,
            config,
          )
        )?.[KycTemplateKeys.TEMPLATE_ID];

        // Fetch users
        const allUsers: Array<User> =
          await this.apiEntityCallService.fetchEntities(
            tenantId,
            {}, // filter
            true, // includeWallets
          );

        for (const user of allUsers) {
          let cleanUser: boolean;

          const userKycTemplateId =
            user?.[UserKeys.DATA]?.[UserKeys.DATA__KYC_TEMPLATE_ID];

          if (isAdministratorUserType(user[UserKeys.USER_TYPE])) {
            if (!userKycTemplateId) {
              cleanUser = true;
              usersWithoutKycTemplateId.push(user);
            } else if (!validKycTemplateIds?.includes(userKycTemplateId)) {
              cleanUser = true;
              usersWithInvalidKycTemplateId.push(user);
            }
          }

          if (cleanUser && cleanAllInvalidKycTemplateIdsQuery.cleanUsers) {
            try {
              const newUserData = {
                ...(user[UserKeys.DATA] || {}),
                [UserKeys.DATA__KYC_TEMPLATE_ID]: tenantDefaultKycTemplateId,
              };

              const updates = {
                [UserKeys.DATA]: newUserData,
              };

              await this.apiEntityCallService.patchEntity(
                user[UserKeys.TENANT_ID],
                user[UserKeys.USER_ID],
                updates,
              );
            } catch (error) {
              unexpectedUserIssue.push(user);
            }
          }
        }

        // Fetch tokens
        const allTokens: Array<Token> = (
          await this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.all,
            undefined, // tokenKey
            false, // shallReturnSingleToken
            undefined, // offset
            undefined, // limit
            false, // withAssetData
          )
        ).tokens;

        for (const token of allTokens) {
          let cleanToken: boolean;

          const tokenKycTemplateId =
            token?.[UserKeys.DATA]?.[UserKeys.DATA__KYC_TEMPLATE_ID];
          if (!tokenKycTemplateId) {
            cleanToken = true;
            tokensWithoutKycTemplateId.push(token);
          } else if (!validKycTemplateIds?.includes(tokenKycTemplateId)) {
            cleanToken = true;
            tokensWithInvalidKycTemplateId.push(token);
          }

          if (cleanToken && cleanAllInvalidKycTemplateIdsQuery.cleanTokens) {
            try {
              const newTokenData = {
                ...(token[TokenKeys.DATA] || {}),
                [TokenKeys.DATA__KYC_TEMPLATE_ID]: tenantDefaultKycTemplateId,
              };

              const tokenUpdates = {
                [TokenKeys.DATA]: newTokenData,
              };

              await this.apiMetadataCallService.updateTokenInDB(
                token[TokenKeys.TENANT_ID],
                token[TokenKeys.TOKEN_ID],
                tokenUpdates,
              );
            } catch (error) {
              unexpectedTokenIssue.push(token);
            }
          }
        }
      }

      const response = {
        missingConfigs,
        configsWithoutKycTemplateId,
        configsWithInvalidKycTemplateId,
        usersWithoutKycTemplateId,
        usersWithInvalidKycTemplateId,
        tokensWithoutKycTemplateId,
        tokensWithInvalidKycTemplateId,
        total0: missingConfigs.length,
        total1: configsWithoutKycTemplateId.length,
        total2: configsWithInvalidKycTemplateId.length,
        total3: usersWithoutKycTemplateId.length,
        total4: usersWithInvalidKycTemplateId.length,
        total5: tokensWithoutKycTemplateId.length,
        total6: tokensWithInvalidKycTemplateId.length,
        unexpectedConfigIssue,
        unexpectedUserIssue,
        unexpectedTokenIssue,
        message: `${
          configsWithoutKycTemplateId.length +
          configsWithInvalidKycTemplateId.length
        } invalid config(s) ${
          cleanAllInvalidKycTemplateIdsQuery.cleanConfigs
            ? 'updated successfully'
            : 'listed successfully'
        }, ${
          usersWithoutKycTemplateId.length +
          usersWithInvalidKycTemplateId.length
        } invalid user(s) ${
          cleanAllInvalidKycTemplateIdsQuery.cleanUsers
            ? 'updated successfully'
            : 'listed successfully'
        } and ${
          tokensWithoutKycTemplateId.length +
          tokensWithInvalidKycTemplateId.length
        } invalid token(s) ${
          cleanAllInvalidKycTemplateIdsQuery.cleanTokens
            ? 'updated successfully'
            : 'listed successfully'
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning invalid KYC template IDs',
        'cleanAllInvalidKycTemplateIds',
        true,
        500,
      );
    }
  }

  @Put('clean/user/codefi')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllCodefiUsers(
    @UserContext() userContext: IUserContext,
    @Query() cleanCodefiUsersQuery: CleanCodefiUsersQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const codefiUsers: Array<User> = [];

      const codefiTenantId = 'codefi'; // deprecated tenantId (shall not be used anymore)

      // Fetch users
      const allUsers: Array<User> =
        await this.apiEntityCallService.fetchEntities(
          codefiTenantId,
          {}, // filter
          true, // includeWallets
        );

      if (cleanCodefiUsersQuery.deleteCodefiUsers) {
        for (const user of allUsers) {
          // Delete Codefi user
          await this.apiEntityCallService.deleteEntity(
            user[UserKeys.TENANT_ID],
            user[UserKeys.USER_ID],
          );
        }
      }

      const response = {
        codefiUsers: allUsers,
        total: codefiUsers.length,
        message: `${codefiUsers.length} codefi user(s) ${
          cleanCodefiUsersQuery.deleteCodefiUsers
            ? 'deleted successfully'
            : 'listed successfully'
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning codefi users',
        'cleanAllCodefiUsers',
        true,
        500,
      );
    }
  }

  @Put('clean/user/metadata')
  @HttpCode(200)
  @Protected(true, [])
  async cleanAllUsersMetadata(
    @UserContext() userContext: IUserContext,
    @Query() cleanInvalidUserMetadataQuery: ClearInvalidUserMetadataQueryInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const tenantIdsList: Array<string> = [];
      clientApplicationsList.forEach((clientApplication: ClientApplication) => {
        if (
          clientApplication &&
          clientApplication[ClientApplicationKeys.METADATA] &&
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ]
        ) {
          tenantIdsList.push(
            clientApplication[ClientApplicationKeys.METADATA][
              ClientApplicationKeys.METADATA__TENANT_ID
            ],
          );
        }
      });

      let counter = 0;
      let totalCounter = 0;
      const notFoundUserIds: Array<string> = [];
      const notUpdatedUserIds: Array<string> = [];
      const invalidUserIds: Array<string> = [];
      const updatedUserIds: Array<string> = [];

      for (const tenantId of tenantIdsList) {
        const auth0TenantId = craftAuth0TenantId(tenantId);

        // Fetch users
        const allUsers: Array<User> =
          await this.apiEntityCallService.fetchEntities(
            tenantId,
            {}, // filter
            true, // includeWallets
          );

        for (const user of allUsers) {
          if (user[UserKeys.AUTH_ID]) {
            counter += 1;
            totalCounter += 1;
            let auth0User: Auth0User;

            // PROTECTION AGAINST RATE LIMIT ISSUES
            if (counter > 100) {
              counter = 0;
              sleep(2000);
            }

            if (
              !user?.[UserKeys.DATA]?.[
                cleanInvalidUserMetadataQuery.userMigratedFlag
              ]
            ) {
              try {
                auth0User =
                  await this.apiAdminCallService.retrieveUsersInAuth0ById(
                    tenantId,
                    user[UserKeys.AUTH_ID],
                  );
              } catch (error) {
                notFoundUserIds.push(user[UserKeys.USER_ID]);
              }

              if (auth0User) {
                let userUpdatedSuccessfully = false;
                if (!auth0User?.appMetadata?.[auth0TenantId]?.entityId) {
                  try {
                    if (
                      cleanInvalidUserMetadataQuery.updateInvalidUserMetadata
                    ) {
                      await this.apiAdminCallService.updateUserInAuth0ById(
                        tenantId,
                        user[UserKeys.AUTH_ID],
                        user[UserKeys.USER_ID],
                        undefined, // tenantRoles
                      );
                    }
                    updatedUserIds.push(user[UserKeys.USER_ID]);
                    userUpdatedSuccessfully = true;
                  } catch (error) {
                    notUpdatedUserIds.push(user[UserKeys.USER_ID]);
                  }
                } else {
                  if (
                    auth0User?.appMetadata?.[auth0TenantId]?.entityId !==
                    user[UserKeys.USER_ID]
                  ) {
                    invalidUserIds.push(user[UserKeys.USER_ID]);
                  } else {
                    userUpdatedSuccessfully = true;
                  }
                }

                if (userUpdatedSuccessfully) {
                  // Once user is updated in auth0, we add a flag in its data in order in order to skip him
                  // the next time this migration script is run
                  const updatedUserData = {
                    ...(user[UserKeys.DATA] || {}),
                  };
                  const updates = {
                    data: updatedUserData,
                  };
                  await this.apiEntityCallService.patchEntity(
                    user[UserKeys.TENANT_ID],
                    user[UserKeys.USER_ID],
                    updates,
                  );
                }
              }
            }

            if (
              user?.[UserKeys.DATA]?.[
                cleanInvalidUserMetadataQuery.userMigratedFlagClean
              ]
            ) {
              const userToClean: User =
                await this.apiEntityCallService.fetchEntity(
                  user[UserKeys.TENANT_ID],
                  user[UserKeys.USER_ID],
                  true,
                );
              const userDataToClean = {
                ...(userToClean[UserKeys.DATA] || {}),
                [cleanInvalidUserMetadataQuery.userMigratedFlagClean]:
                  undefined, // erase flag used in previous migration
              };
              const updates = {
                data: userDataToClean,
              };
              await this.apiEntityCallService.patchEntity(
                userToClean[UserKeys.TENANT_ID],
                userToClean[UserKeys.USER_ID],
                updates,
              );
            }
          }
        }
      }

      const response = {
        notFoundUserIds,
        notUpdatedUserIds,
        invalidUserIds,
        updatedUserIds,
        total: totalCounter,
        message: `${updatedUserIds.length} invalid users(s) updated successfully (total: ${totalCounter})`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cleaning invalid user metadata',
        'cleanAllUsersMetadata',
        true,
        500,
      );
    }
  }

  @Post('withdraw')
  @HttpCode(202)
  @Protected(true, [])
  async withdrawAllEtherFromUserAccount(
    @UserContext() userContext: IUserContext,
    @Body() withdrawBody: WithdrawEtherBodyInput,
  ): Promise<WithdrawEtherOutput> {
    try {
      if (
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE] !==
          UserType.ADMIN &&
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE] !==
          UserType.SUPERADMIN &&
        withdrawBody.userId != userContext[UserContextKeys.USER_ID]
      ) {
        ErrorService.throwError(
          `User with Id ${
            userContext[UserContextKeys.USER_ID]
          } is an ${userContext[UserContextKeys.USER][
            UserKeys.USER_TYPE
          ].toLowerCase()}, thus cannot withdraw ethers of user with id ${
            withdrawBody.userId
          }`,
        );
      }

      if (
        !(
          withdrawBody.withdrawalAddress &&
          withdrawBody.withdrawalAddress.length === 42 &&
          withdrawBody.withdrawalAddress !== ZERO_ADDRESS
        )
      ) {
        ErrorService.throwError(
          `invalid withdrawal address retrieved: ${withdrawBody.withdrawalAddress}`,
        );
      }

      const [user, config]: [User, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(
          userContext[UserContextKeys.TENANT_ID],
          withdrawBody.userId,
          true,
        ),
        this.configService.retrieveTenantConfig(
          userContext[UserContextKeys.TENANT_ID],
        ),
      ]);

      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        user[UserKeys.DEFAULT_WALLET],
      );

      const ethService: EthService =
        await this.ethHelperService.createEthService(
          userContext[UserContextKeys.TENANT_ID],
          EthServiceType.ORCHESTRATE, // => required by 'withdrawAllEtherFromUserWallet.craftConfig'
          withdrawBody.chainId, // TO BE DEPRECATED (replaced by 'networkKey')
          withdrawBody.networkKey,
          true, // networkShallExist (an error shall be thrown if network doesn't exist)
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        ErrorService.throwError(
          "Shall never happen: network is not reachable but error shall have been thrown inside 'createEthService' function",
        );
      }

      const etherBalance: number =
        await this.apiSCCallService.fetchEtherBalance(
          userContext[UserContextKeys.CALLER_ID],
          userWallet[WalletKeys.WALLET_ADDRESS],
          ethService,
        );

      let response: ApiSCResponse;
      if (etherBalance > 0) {
        response = await this.apiSCCallService.withdrawAllEtherFromUserWallet(
          userContext[UserContextKeys.TENANT_ID],
          user, // signer
          userWallet,
          withdrawBody.withdrawalAddress,
          ethService,
          userContext[UserContextKeys.AUTH_TOKEN],
          config,
        );
      }

      return {
        transactionId:
          etherBalance > 0
            ? response[ApiSCResponseKeys.TX_IDENTIFIER]
            : undefined,
        message:
          etherBalance > 0
            ? `Withdrawal of ${etherBalance} ETH from address ${
                userWallet[WalletKeys.WALLET_ADDRESS]
              } to address ${
                withdrawBody.withdrawalAddress
              } has been sucessfully requested (transaction sent)`
            : `User has no ETH left on his wallet ${
                userWallet[WalletKeys.WALLET_ADDRESS]
              }`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'withdrawing all ETH from user account',
        'withdrawAllEtherFromUserAccount',
        true,
        500,
      );
    }
  }

  @Post('/htlc')
  @HttpCode(201)
  @Protected(true, [])
  async createHtlc(
    @UserContext() userContext: IUserContext,
  ): Promise<CreateHTLCOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const htlc: HTLC = newHTLC();

      return {
        htlc: htlc,
        message: `New HTLC with hash ${
          htlc[HTLCKeys.SECRET_HASH]
        } created successfully (the HTLC secret has not been saved by the API)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating HTLC',
        'createHtlc',
        true,
        error.status || 500,
      );
    }
  }

  @Get('/identity')
  @HttpCode(200)
  @Protected(true, [])
  // This endpoint is not protected because this was a requirement in the DEPRECATED WAY to retrieve
  // identity. As soon as the NEW WAY of retrieving identity will be adopted everywhere, we'll be
  // able to enable protection.
  async retrieveIdentity(
    @Req() request: Request,
    @Query() query: RetrieveIdentityQueryInput,
  ): Promise<RetrieveIdentityOutput> {
    try {
      const response: RetrieveIdentityOutput =
        await this.identityService.retrieveOrUpdateOrCreateIdentity(
          query.userType,
          query.firstConnectionCode,
          request,
        );

      // We don't want to return the sensible information: First connection code
      delete response.user[UserKeys.FIRST_CONNECTION_CODE];

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "retrieving user's identity",
        'retrieveIdentity',
        true,
        error.status || 500,
      );
    }
  }

  @Get('/partitions')
  @HttpCode(200)
  @Protected(true, [])
  async retrievePartitions(
    @UserContext() userContext: IUserContext,
    @Query() partitionQuery: RetrievePartitionsQueryInput,
  ): Promise<RetrievePartitionOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const partitions =
        await this.partitionService.listAllPartitionsForAssetClass(
          partitionQuery.assetClass,
        );

      return {
        partitions,
        message: `Partitions retrieved successfully for class ${partitionQuery.assetClass}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving partitions',
        'retrievePartitions',
        true,
        error.status || 500,
      );
    }
  }

  @Get('/hold/data')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveHoldData(
    @UserContext() userContext: IUserContext,
    @Query() holdDataQuery: RetrieveHoldDataQueryInput,
  ): Promise<RetrieveHoldDataOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const ethService: EthService =
        await this.ethHelperService.createEthServiceWithNetworkKey(
          userContext[UserContextKeys.TENANT_ID],
          EthServiceType.WEB3,
          holdDataQuery.networkKey,
          true, // networkShallExist (if set to 'true', an error is thrown if network doesn't exist)
        );

      const hold: Hold = await this.apiSCCallService.retrieveHoldIfExisting(
        userContext[UserContextKeys.CALLER_ID],
        ethService,
        holdDataQuery.holdId,
        holdDataQuery.tokenAddress,
        false, // check token hold value
        undefined, // value
      );

      return {
        hold: formatHold(hold),
        message: `Hold data retrieved successfully for hold with id ${holdDataQuery.holdId}, on token with address ${holdDataQuery.tokenAddress}, on network ${holdDataQuery.networkKey}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving hold data',
        'retrieveHoldData',
        true,
        error.status || 500,
      );
    }
  }

  @Get('/certificate')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveCertificate(
    @UserContext() userContext: IUserContext,
    @Query() certificateQuery: RetrieveCertificateQueryInput,
  ): Promise<RetrieveCertificateOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const tokenStandard = certificateQuery.tokenStandard
        ? certificateQuery.tokenStandard
        : DEFAULT_HYBRID_TOKEN_STANDARD;
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          userContext[UserContextKeys.TENANT_ID],
          EthServiceType.WEB3,
          certificateQuery.chainId, // TO BE DEPRECATED (replaced by 'networkKey')
          certificateQuery.networkKey,
          true, // networkShallExist (an error shall be thrown if network doesn't exist)
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        ErrorService.throwError(
          "Shall never happen: network is not reachable but error shall have been thrown inside 'createEthService' function",
        );
      }

      const nbValidityHours = 1; // Certificate will be valid for 1 hour
      const expirationTime: Date = new Date(
        new Date().getTime() + nbValidityHours * 3600 * 1000,
      );

      const certificate: string = await this.apiSCCallService.craftCertificate(
        userContext[UserContextKeys.CALLER_ID],
        tokenStandard,
        certificateQuery.senderAddress,
        certificateQuery.contractAddress,
        certificateQuery.txPayload,
        ethService,
        expirationTime,
      );

      return {
        certificate,
        message: 'Certificate retrieved successfully',
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving certificate',
        'retrieveCertificate',
        true,
        500,
      );
    }
  }

  @Get('/token/states')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveTokenStates(
    @UserContext() userContext: IUserContext,
  ): Promise<ListAllTokenStateOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      return {
        tokenStates: stateRules,
        message: 'Token states listed successfully',
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token states',
        'retrieveTokenStates',
        true,
        500,
      );
    }
  }

  @Get('/config')
  @HttpCode(200)
  @Protected(false, [])
  // This endpoint is not protected as it's called by the FE before the user is authenticated in order to know
  // what to display (colors, logo, etc.)
  async retrieveConfig(
    @Req() request: Request,
    @Query() getConfigQuery: GetConfigQueryInput,
  ): Promise<RetrieveConfigOutput> {
    try {
      // This endpoint bypasses the authentication guard because "/config" can be accessed without authentication.
      // For this reason, we need to decode the jwt token "manually" in the controller.
      let tenantId: string;
      let configUserId: string;

      if (getConfigQuery.tenantId) {
        tenantId = getConfigQuery.tenantId;
      } else if (request.headers && request.headers[HeaderKeys.AUTHORIZATION]) {
        // Since this endpoint is unprotected in AuthenticationGuard, tenantId and authId
        // are not stored stored in context yet. They need to be extracted.

        tenantId = extractTenantIdFromRequest(request);
        const userId = extractEntityIdFromRequest(request);

        if (!userId) {
          ErrorService.throwError(
            `invalid access token: access token shall include an 'entityId' inside '${process.env.AUTH_CUSTOM_NAMESPACE} custom claims'`,
          );
        }

        // Retrieve user
        const user: User = await this.apiEntityCallService.fetchEntity(
          tenantId,
          userId,
          true,
        );

        if (getConfigQuery.userConfiguration) {
          configUserId = user[UserKeys.USER_ID];
        }
      }
      const configResponse: {
        config: Config;
        configType: ConfigType;
      } = await this.configService.retrieveConfig(tenantId, configUserId);

      return {
        config: configResponse.config,
        message: `${setToLowerCaseExceptFirstLetter(
          configResponse.configType,
        )} config ${
          configResponse.config[ConfigKeys.ID]
        } retrieved successfully for tenant ${tenantId} and user ${configUserId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving config',
        'retrieveConfig',
        true,
        error.status || 500,
      );
    }
  }

  @Post('/config')
  @HttpCode(201)
  @Protected(true, [])
  async createOrUpdateConfig(
    @Req() request: Request,
    @Query() getConfigQuery: GetConfigQueryInput,
    @Body() configBody: CreateConfigBodyInput,
  ): Promise<CreateConfigOutput> {
    try {
      // Since this endpoint is unprotected in AuthenticationGuard, tenantId and authId
      // are not stored stored in context yet. They need to be extracted.

      const tenantId = extractTenantIdFromRequest(request);
      const userId = extractEntityIdFromRequest(request);

      if (!userId) {
        ErrorService.throwError(
          `invalid access token: access token shall include an 'entityId' inside '${process.env.AUTH_CUSTOM_NAMESPACE} custom claims'`,
        );
      }

      // Retrieve user
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );

      const [tenantConfigurationCanBeUpdated, tenantType] =
        await this.tenantService.checkTenantTypePermissions(user, tenantId);

      // If 'userConfiguration' is not sent to 'true', it means user is trying to update tenant config, which is forbidden by default
      if (
        !getConfigQuery.userConfiguration && // This means user is trying to update tenant config
        !tenantConfigurationCanBeUpdated // This means tenant config can not be updated
      ) {
        ErrorService.throwError(
          `user of type ${
            user[UserKeys.USER_TYPE]
          } is not allowed to update config of tenant with ID ${tenantId}, because tenant type is ${tenantType}`,
        );
      }

      const response: CreateConfigOutput =
        await this.configService.createOrUpdateConfig(
          tenantId,
          configBody.name,
          configBody.logo,
          configBody.mailLogo,
          configBody.mailColor,
          configBody.mainColor,
          configBody.mainColorLight,
          configBody.mainColorLighter,
          configBody.mainColorDark,
          configBody.mainColorDarker,
          configBody.data,
          getConfigQuery.userConfiguration
            ? user[UserKeys.USER_ID]
            : TENANT_FLAG, // userId
          configBody.language,
          configBody.region,
          configBody.preferences,
          configBody.restrictedUserTypes,
          configBody.restrictedAssetTypes,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating or updating config',
        'createOrUpdateConfig',
        true,
        500,
      );
    }
  }

  @Get('/tenant')
  @HttpCode(200)
  @Protected(true, [])
  async listAllTenants(
    @UserContext() userContext: IUserContext,
    @Query() tenantQuery: ListAllTenantsQueryInput,
  ): Promise<ListAllTenantsOutput> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const offset = Number(tenantQuery.offset || 0);
      const limit: number = Math.min(
        Number(tenantQuery.limit || MAX_TENANTS_COUNT),
        MAX_TENANTS_COUNT,
      );

      const clientApplicationsList: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();

      const slicedClientApplicationsList: Array<ClientApplication> =
        clientApplicationsList.slice(
          offset,
          Math.min(offset + limit, clientApplicationsList.length),
        );

      return {
        tenants: slicedClientApplicationsList,
        count: slicedClientApplicationsList.length,
        total: clientApplicationsList.length,
        message: `${slicedClientApplicationsList.length} Codefi Assets tenant(s) listed successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all tenants',
        'listAllTenants',
        true,
        500,
      );
    }
  }

  @Get('/tenant/:tenantIdOrAlias')
  @HttpCode(200)
  @Protected(false, [])
  // This endpoint is not protected as it's called by the FE before the user is authenticated in order to know
  // what to display (colors, logo, etc.)
  async retrieveTenant(
    @Param() { tenantIdOrAlias }: RetrieveTenantParamInput,
  ): Promise<RetrieveTenantOutput> {
    try {
      const clientApplications: Array<ClientApplication> =
        await this.apiAdminCallService.listAllClientApplicationInAuth0();
      let filteredClientApplications: Array<ClientApplication>;

      // First, we assume 'tenantIdOrAlias' is a tenantId, defined in client application's metadata
      filteredClientApplications = clientApplications.filter(
        ({ clientMetadata }) => {
          return (
            clientMetadata?.[ClientApplicationKeys.METADATA__TENANT_ID] ===
            tenantIdOrAlias
          );
        },
      );

      // Second, we assume 'tenantIdOrAlias' is an alias, and we search if there's a client application with the same alias
      if (
        !(filteredClientApplications && filteredClientApplications.length > 0)
      ) {
        filteredClientApplications = clientApplications.filter(
          ({ clientMetadata }) => {
            const aliases = clientMetadata?.aliases || '[]';
            return JSON.parse(aliases).includes(tenantIdOrAlias);
          },
        );
      }

      if (
        !(
          filteredClientApplications?.length > 0 &&
          filteredClientApplications[0] &&
          filteredClientApplications[0][ClientApplicationKeys.CLIENT_ID]
        )
      ) {
        ErrorService.throwError(
          `shall never happen: no client application was found for tenantIdOrAlias=${tenantIdOrAlias}`,
        );
      }

      const tenantId =
        filteredClientApplications[0][ClientApplicationKeys.METADATA][
          ClientApplicationKeys.METADATA__TENANT_ID
        ];

      let invalidClientApplication: ClientApplication;
      let invalidTenantId: string;
      filteredClientApplications.forEach(
        (clientApplication: ClientApplication) => {
          if (
            clientApplication?.[ClientApplicationKeys.METADATA]?.[
              ClientApplicationKeys.METADATA__TENANT_ID
            ] !== tenantId
          ) {
            invalidClientApplication = clientApplication;
            invalidTenantId =
              invalidClientApplication?.[ClientApplicationKeys.METADATA]?.[
                ClientApplicationKeys.METADATA__TENANT_ID
              ];
          }
        },
      );
      if (!tenantId) {
        ErrorService.throwError(
          "shall never happen: tenantId is not defined in client application's data",
        );
      } else if (invalidClientApplication) {
        ErrorService.throwError(
          `shall never happen: different tenantIds found for client applications' data (application ${
            filteredClientApplications[0][ClientApplicationKeys.CLIENT_ID]
          } includes ${tenantId} while applcition ${
            invalidClientApplication[ClientApplicationKeys.CLIENT_ID]
          } includes ${invalidTenantId})`,
        );
      }

      const { config, configType } = await this.configService.retrieveConfig(
        tenantId,
        undefined, // userId
      );

      const tenant = await this.apiEntityCallService.fetchTenant(tenantId);

      // We select values that can be returned
      // because not all of them shall be shown to the end user
      return {
        tenant,
        clientApplications: filteredClientApplications.map(
          (clientApplication: ClientApplication) => {
            return maskClientApplication(clientApplication);
          },
        ),
        config,
        configType,
        message: `Codefi Assets tenant with ID ${
          filteredClientApplications[0][ClientApplicationKeys.CLIENT_ID]
        } retrieved successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving tenant',
        'retrieveTenant',
        true,
        500,
      );
    }
  }

  @Post('/tenant')
  @HttpCode(201)
  @Protected(true, [])
  async createTenant(
    @UserContext() userContext: IUserContext,
    @Body()
    {
      tenantName,
      email,
      password,
      firstName,
      lastName,
      defaultAlias,
      aliases,
      region = Region.EU,
      tenantType,
      kycTemplateId,
      sendNotification,
      faucetNetworksKeys,
      createM2mClientApplication,
      enableMarketplace,
      usecase,
    }: CreateTenantBodyInput,
  ): Promise<CreateTenantOutput> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const response: CreateTenantOutput =
        await this.tenantService.createTenant(
          {
            superAdmin: userContext[UserContextKeys.USER],
            name: tenantName,
            email,
            password,
            firstName,
            lastName,
            defaultAlias,
            aliases,
            tenantRegion: Region[region],
            tenantType,
            enableMarketplace,
            usecase,
          },
          kycTemplateId,
          sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
          faucetNetworksKeys,
          createM2mClientApplication,
          undefined, // forceTenantId
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating tenant',
        'createTenant',
        true,
        500,
      );
    }
  }

  @Post('/tenant/:tenantId/client/m2m')
  @HttpCode(201)
  @Protected(true, [])
  async createM2mApplicationForTenant(
    @UserContext() userContext: IUserContext,
    @Param() tenantParam: CreateM2mApplicationForTenantParamInput,
  ): Promise<CreateM2mApplicationForTenantOutput> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const response: {
        m2mClientApplication: ClientApplication;
        newM2mClientApplication: boolean;
        message: string;
      } = await this.tenantService.createM2mApplicationForTenant(
        tenantParam.tenantId,
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating m2m application for tenant',
        'createM2mApplicationForTenant',
        true,
        500,
      );
    }
  }

  @Delete('/tenant/:tenantId')
  @HttpCode(200)
  @Protected(true, [])
  async deleteTenant(
    @UserContext() userContext: IUserContext,
    @Param() tenantParam: DeleteTenantParamInput,
  ): Promise<DeleteTenantOutput> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const response: DeleteTenantOutput =
        await this.tenantService.deleteTenant(tenantParam.tenantId);

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting tenant',
        'deleteTenant',
        true,
        500,
      );
    }
  }

  @Delete('/tenant/:tenantId/data')
  @HttpCode(200)
  async deleteTenantData(
    @UserContext() userContext: IUserContext,
    @Param() tenantParam: DeleteTenantDataParamInput,
    @Query() queryParms: DeleteTenantDataQueryInput,
  ): Promise<DeleteTenantDataOutput> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const response = await this.tenantService.deleteTenantData(
        tenantParam.tenantId,
        queryParms,
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting tenant Data',
        'deleteTenantData',
        true,
        500,
      );
    }
  }

  @Get('/tenant/:tenantId/postman-credentials')
  @HttpCode(200)
  @Header('Content-Type', 'application/json')
  @Header(
    'Content-Disposition',
    'attachment; filename="postman_credentials.json"',
  )
  @Protected(true, [])
  async getPostmanCredentials(
    @UserContext() userContext: IUserContext,
    @Param()
    { tenantId }: RetrievePostmanCredentialsParamInput,
  ): Promise<RetrievePostmanCredentialsOutput> {
    try {
      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);

      const firstUser =
        await this.apiAdminCallService.retrieveFirstUserOfClient(tenantId);

      // Check userTypes validity
      if (typeFunctionUser === UserType.SUPERADMIN) {
        // Ok SUPERADMIN can fetch everything
      } else {
        if (tenantId !== userContext[UserContextKeys.TENANT_ID]) {
          ErrorService.throwError(
            `user of type ${typeFunctionUser} is not allowed to retrieve postman credentials from another tenant (${tenantId} different from ${
              userContext[UserContextKeys.TENANT_ID]
            })`,
          );
        }

        if (
          typeFunctionUser !== UserType.ADMIN &&
          !(
            firstUser &&
            firstUser[UserKeys.USER_ID] === userContext[UserContextKeys.USER_ID]
          )
        ) {
          ErrorService.throwError(
            `user of type ${typeFunctionUser} is not allowed to retrieve postman credentials for tenant ${tenantId})`,
          );
        }
      }

      const clientApplication: ClientApplication =
        await this.apiAdminCallService.retrieveDefaultClientApplicationForTenantId(
          tenantId,
        );

      const postmanCredentials: PostmanCredentials =
        this.tenantService.getPostmanCredentials(
          clientApplication,
          firstUser?.[UserKeys.EMAIL],
        );

      return { postmanCredentials };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving postman credentials',
        'getPostmanCredentials',
        true,
        500,
      );
    }
  }

  @Get('/usecase/:usecase')
  @HttpCode(200)
  @ApiOperation({ summary: 'Fetch usecase' })
  async fetchUsecase(@Param('usecase') usecase: string, @Query() query) {
    try {
      return this.usecaseService.getUsecase(query.tenantId, usecase);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fetch usecase',
        'fetchUsecase',
        true,
        500,
      );
    }
  }
}
