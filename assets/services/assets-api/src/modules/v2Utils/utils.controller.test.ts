import { UtilsController } from './utils.controller';
import { IdentityService } from './utils.service/identity';

import createMockInstance from 'jest-create-mock-instance';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { PartitionService } from '../v2Partition/partition.service';
import { TenantService } from './utils.service/tenant';
import { ApiAdminCallService } from '../v2ApiCall/api.call.service/admin';
import {
  buildFakeClientApplication,
  Region,
  TenantExample,
} from 'src/types/clientApplication';
import { ConfigExample, ConfigType } from 'src/types/config';
import { IUserContext } from 'src/types/userContext';
import { UserType } from 'src/types/user';
import { maskClientApplication, TenantType } from 'src/types/clientApplication';

import { NestJSPinoLogger } from '@consensys/observability';
import { TokenDeletionService } from '../v2Token/token.service/deleteToken';
import { LinkService } from '../v2Link/link.service';
import { KYCTemplateService } from '../v2KYCTemplate/kyc.template.service';
import { UserCreationService } from '../v2User/user.service/createUser';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';
import { UsecaseService } from '../v2Usecase/usecase.service';
import { TenantRoleMigrationService } from './utils.service/tenantRoleMigration';
import { EntityMigrationService } from './utils.service/entityMigration';
import { NestedUserFixService } from './utils.service/nestedUserFix';
import { DevNamespaceUsersFixService } from './utils.service/devNamespaceUsersFix';
import { DemoNamespaceUsersFixService } from './utils.service/demoNamespaceUsersFix';
import { UsageMetricsService } from './utils.service/usageMetrics';
import { NetworkSelectionService } from './utils.service/networkSelection';

const defaultAlias = 'acme.assets.codefi.network';

describe('UtilsController', () => {
  let controller: UtilsController;
  let loggerMock: NestJSPinoLogger;
  let userCreationServiceMock: UserCreationService;
  let identityServiceMock: IdentityService;
  let ethHelperServiceMock: EthHelperService;
  let apiSCCallServiceMock: ApiSCCallService;
  let apiMetadataCallServiceMock: ApiMetadataCallService;
  let walletServiceMock: WalletService;
  let configServiceMock: ConfigService;
  let partitionServiceMock: PartitionService;
  let apiAdminCallServiceMock: ApiAdminCallService;
  let tokenDeletionServiceMock: TokenDeletionService;
  let linkServiceMock: LinkService;
  let kycTemplateServiceMock: KYCTemplateService;
  let apiEntityCallServiceMock: ApiEntityCallService;
  let usecaseServiceMock: UsecaseService;
  let tenantRoleMigrationServiceMock: jest.Mocked<TenantRoleMigrationService>;
  let entityMigrationServiceMock: jest.Mocked<EntityMigrationService>;
  let nestedUserFixServiceMock: jest.Mocked<NestedUserFixService>;
  let devNamespaceUsersFixServiceMock: jest.Mocked<DevNamespaceUsersFixService>;
  let demoNamespaceUsersFixService: jest.Mocked<DemoNamespaceUsersFixService>;
  let usageMetricsServiceMock: jest.Mocked<UsageMetricsService>;
  let networkSelectionServiceMock: jest.Mocked<NetworkSelectionService>;

  let tenantServiceMock: TenantService;
  beforeEach(() => {
    identityServiceMock = createMockInstance(IdentityService);
    userCreationServiceMock = createMockInstance(UserCreationService);
    ethHelperServiceMock = createMockInstance(EthHelperService);
    apiSCCallServiceMock = createMockInstance(ApiSCCallService);
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);
    walletServiceMock = createMockInstance(WalletService);
    configServiceMock = createMockInstance(ConfigService);
    partitionServiceMock = createMockInstance(PartitionService);
    tenantServiceMock = createMockInstance(TenantService);
    apiAdminCallServiceMock = createMockInstance(ApiAdminCallService);
    linkServiceMock = createMockInstance(LinkService);
    kycTemplateServiceMock = createMockInstance(KYCTemplateService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    tenantRoleMigrationServiceMock = createMockInstance(
      TenantRoleMigrationService,
    );
    usecaseServiceMock = createMockInstance(UsecaseService);
    entityMigrationServiceMock = createMockInstance(EntityMigrationService);
    nestedUserFixServiceMock = createMockInstance(NestedUserFixService);
    devNamespaceUsersFixServiceMock = createMockInstance(
      DevNamespaceUsersFixService,
    );
    demoNamespaceUsersFixService = createMockInstance(
      DemoNamespaceUsersFixService,
    );
    usageMetricsServiceMock = createMockInstance(UsageMetricsService);
    networkSelectionServiceMock = createMockInstance(NetworkSelectionService);
    controller = new UtilsController(
      loggerMock,
      userCreationServiceMock,
      identityServiceMock,
      ethHelperServiceMock,
      apiSCCallServiceMock,
      apiMetadataCallServiceMock,
      walletServiceMock,
      configServiceMock,
      partitionServiceMock,
      tenantServiceMock,
      apiAdminCallServiceMock,
      tokenDeletionServiceMock,
      linkServiceMock,
      kycTemplateServiceMock,
      apiEntityCallServiceMock,
      usecaseServiceMock,
      tenantRoleMigrationServiceMock,
      entityMigrationServiceMock,
      nestedUserFixServiceMock,
      devNamespaceUsersFixServiceMock,
      demoNamespaceUsersFixService,
      usageMetricsServiceMock,
      networkSelectionServiceMock,
    );
  });

  it('Utils', async () => {
    await expect(controller).toBeDefined();
  });

  describe('/tenant', () => {
    describe('createTenant', () => {
      it('creates a tenant', async () => {
        const userContext: IUserContext = {
          user: {
            userType: UserType.SUPERADMIN,
          } as any,
          authToken: 'fakeJwtToken',
        };

        const tenant = {
          tenantName: 'Acme',
          email: 'test@example.com',
          password: '1234',
          firstName: 'firstname',
          lastName: 'lastName',
          defaultAlias,
          aliases: [defaultAlias],
          region: Region.EU,
          tenantType: TenantType.API,
          enableMarketplace: false,
          usecase: undefined,
        };
        const mockResponse = { foo: 'bar' };
        tenantServiceMock.createTenant = jest
          .fn()
          .mockImplementation(() => Promise.resolve(mockResponse));
        await expect(
          controller.createTenant(userContext, {
            ...tenant,
            kycTemplateId: undefined,
            sendNotification: true,
            faucetNetworksKeys: undefined,
            createM2mClientApplication: false,
            enableMarketplace: false,
            usecase: undefined,
          }),
        ).resolves.toEqual(mockResponse);
        const { tenantName, region, ...rest } = tenant;
        expect(tenantServiceMock.createTenant).toHaveBeenCalledWith(
          {
            superAdmin: userContext.user,
            name: tenantName,
            tenantRegion: region,
            ...rest,
          },
          undefined, // kycTemplateId
          true, // sendNotification
          userContext.authToken,
          undefined, // faucetNetworksKeys
          false, // createM2mClientApplication
          undefined, // forceTenantId
        );
      });
    });
    describe('retrieveTenant', () => {
      describe('by id', () => {
        it('returns a tenant', async () => {
          const tenantIdOrAlias = 'eRlC3A2cK7TuIBUJ5b6xjAFQ6VbEjXLf';
          const tenant = buildFakeClientApplication({
            clientId: tenantIdOrAlias,
            clientMetadata: {
              assets: 'true',
              tenantId: tenantIdOrAlias,
              aliases: JSON.stringify([defaultAlias]),
            },
          });
          const configs = {
            config: ConfigExample,
            configType: ConfigType.CUSTOM,
          };
          apiAdminCallServiceMock.listAllClientApplicationInAuth0 = jest.fn(
            () => Promise.resolve([tenant]),
          );
          configServiceMock.retrieveConfig = jest
            .fn()
            .mockImplementation(() => Promise.resolve(configs));
          apiEntityCallServiceMock.fetchTenant = jest
            .fn()
            .mockResolvedValueOnce(TenantExample);

          const params = { tenantIdOrAlias };
          await expect(controller.retrieveTenant(params)).resolves.toEqual({
            message: `Codefi Assets tenant with ID ${tenantIdOrAlias} retrieved successfully`,
            tenant: TenantExample,
            clientApplications: [maskClientApplication(tenant)],
            config: ConfigExample,
            configType: ConfigType.CUSTOM,
          });
          expect(configServiceMock.retrieveConfig).toHaveBeenCalledWith(
            tenant.clientId,
            undefined, // userId
          );
        });
        it('throws error when no matching', async () => {
          const tenantIdOrAlias = '123';
          const tenant = buildFakeClientApplication({
            clientId: tenantIdOrAlias,
          });

          apiAdminCallServiceMock.listAllClientApplicationInAuth0 = jest
            .fn()
            .mockImplementation(() => {
              throw new Error('boom');
            });
          const params = { tenantIdOrAlias };
          await expect(controller.retrieveTenant(params)).rejects.toEqual(
            new Error('Something went wrong while retrieving tenant: boom'),
          );
          expect(configServiceMock.retrieveConfig).not.toHaveBeenCalledWith(
            tenant.clientId,
          );
        });
      });
      describe('by alias', () => {
        it('returns a tenant', async () => {
          const alias = 'acme.assets.codefi.network';
          const tenant = buildFakeClientApplication({
            clientMetadata: {
              assets: 'true',
              aliases: JSON.stringify([alias]),
              tenantId: 'eRlC3A2cK7TuIBUJ5b6xjAFQ6VbEjXLf',
            },
          });
          const configs = {
            config: ConfigExample,
            configType: ConfigType.CUSTOM,
          };
          apiAdminCallServiceMock.listAllClientApplicationInAuth0 = jest
            .fn()
            .mockImplementation(() => Promise.resolve([tenant]));
          configServiceMock.retrieveConfig = jest
            .fn()
            .mockImplementation(() => Promise.resolve(configs));
          apiEntityCallServiceMock.fetchTenant = jest
            .fn()
            .mockResolvedValueOnce(TenantExample);

          const params = { tenantIdOrAlias: alias };
          await expect(controller.retrieveTenant(params)).resolves.toEqual({
            message: `Codefi Assets tenant with ID ${tenant.clientId} retrieved successfully`,
            tenant: TenantExample,
            clientApplications: [maskClientApplication(tenant)],
            config: ConfigExample,
            configType: ConfigType.CUSTOM,
          });

          expect(
            apiAdminCallServiceMock.listAllClientApplicationInAuth0,
          ).toHaveBeenCalled();
          expect(configServiceMock.retrieveConfig).toHaveBeenCalledWith(
            tenant.clientId,
            undefined, // userId
          );
        });
        it('throws error when no matching', async () => {
          const alias = 'acme.assets.codefi.network';
          apiAdminCallServiceMock.listAllClientApplicationInAuth0 = jest
            .fn()
            .mockImplementation(() => {
              throw new Error('boom');
            });

          const params = { tenantIdOrAlias: alias };
          await expect(controller.retrieveTenant(params)).rejects.toEqual(
            new Error('Something went wrong while retrieving tenant: boom'),
          );
          expect(
            apiAdminCallServiceMock.listAllClientApplicationInAuth0,
          ).toHaveBeenCalled();
          expect(configServiceMock.retrieveConfig).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('/migrate/tenant-roles', () => {
    const userContextMock: IUserContext = {
      user: {
        userType: UserType.SUPERADMIN,
      } as any,
      authToken: 'fakeJwtToken',
    };

    const resultMock = {
      totalCount: 1,
      skippedCount: 2,
      updatedCount: 3,
      errorCount: 4,
      errors: [],
      dryRun: false,
      start: new Date(),
      finish: new Date(),
      duration: 5,
    };

    it.each([
      ['enabled', true],
      ['disabled', false],
    ])(
      'returns result from tenant role migration service with dry run %s',
      async (title, dryRun) => {
        tenantRoleMigrationServiceMock.migrate.mockResolvedValue(resultMock);

        const result = await controller.migrateTenantRoles(
          userContextMock,
          dryRun,
        );

        expect(result).toEqual(resultMock);
        expect(tenantRoleMigrationServiceMock.migrate).toHaveBeenCalledTimes(1);
        expect(tenantRoleMigrationServiceMock.migrate).toHaveBeenCalledWith(
          dryRun,
        );
      },
    );

    it('throws if user is not superadmin', async () => {
      const userContextWithWrongType = {
        ...userContextMock,
        user: {
          userType: UserType.ADMIN,
        } as any,
      };

      await expect(
        controller.migrateTenantRoles(userContextWithWrongType, false),
      ).rejects.toThrowError(
        `can not perform an action reserved for users of type ${UserType.SUPERADMIN}`,
      );
    });

    it('throws if error thrown in service', async () => {
      const errorMock = 'TestError1';

      tenantRoleMigrationServiceMock.migrate.mockImplementation(() => {
        throw new Error(errorMock);
      });

      await expect(
        controller.migrateTenantRoles(userContextMock, false),
      ).rejects.toThrowError(
        `Something went wrong while migrating tenant roles: ${errorMock}`,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
