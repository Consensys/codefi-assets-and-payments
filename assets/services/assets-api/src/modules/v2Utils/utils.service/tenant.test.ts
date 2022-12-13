import createMockInstance from 'jest-create-mock-instance';

import {
  ApiAdminCallService,
  AppType,
} from 'src/modules/v2ApiCall/api.call.service/admin';

import { UserCreationService } from 'src/modules/v2User/user.service/createUser';
import {
  buildFakeClientApplication,
  ClientApplicationExample,
  keys as ClientKeys,
  Region,
  TenantExample,
  tenantNameExample,
  TenantType,
} from 'src/types/clientApplication';
import { ASSETS_API_REQUIRED_SCOPES, GrantExample } from 'src/types/grant';
import {
  keys as PostmanKeys,
  PostmanCredentialsExample,
} from 'src/types/postman';
import {
  keys as UserKeys,
  UserExample,
  UserNature,
  UserType,
} from 'src/types/user';
import { TenantService } from './tenant';
import { EmailService } from 'src/modules/v2Email/email.service';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { ApiWorkflowUtilsService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  ApiMetadataUtilsService,
  ApiMetadataCallService,
} from 'src/modules/v2ApiCall/api.call.service/metadata';
import { ApiKycUtilsService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { NestJSPinoLogger } from '@consensys/observability';
import config from 'src/config';
import { ConfigExample } from 'src/types/config';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import { ApiEntityCallService } from '../../v2ApiCall/api.call.service/entity';
import { NetworkService } from '../../v2Network/network.service';
import { keys as NetworkKeys } from 'src/types/network';

const mockEmail = UserExample[UserKeys.EMAIL];
const mockPassword = process.env.DEFAULT_PASSWORD;
const mockFirstName = UserExample[UserKeys.FIRST_NAME];
const mockLastName = UserExample[UserKeys.LAST_NAME];

const mockClientId = ClientApplicationExample[ClientKeys.CLIENT_ID];
const mockTenantId = mockClientId;

const mockConfig = ConfigExample;

const clientApplicationNameExample = `Codefi Assets - ${tenantNameExample}`;

const differentTenantNameExample = `Different ${tenantNameExample}`;
const differentClientApplicationNameExample = `Codefi Assets - ${differentTenantNameExample}`;

const differentPostmanCredentials = {
  ...PostmanCredentialsExample,
  [PostmanKeys.NAME]: `dev-eu.codefi.${differentTenantNameExample
    .toLowerCase()
    .split(' ')
    .join('.')}`,
};

const superAdminUserExample = {
  ...UserExample,
  [UserKeys.USER_TYPE]: UserType.SUPERADMIN,
};

const fakeJwtToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const adminUserExample = {
  ...UserExample,
  [UserKeys.USER_TYPE]: UserType.ADMIN,
  [UserKeys.USER_NATURE]: UserNature.LEGAL,
  [UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]:
    process.env.DEFAULT_DOCUSIGN_ID,
};
const initialUsersExample = {
  firstUser: adminUserExample,
  codefiUsers: { [UserType.ADMIN]: adminUserExample },
};

describe('TenantService', () => {
  let service: TenantService;
  let userCreationServiceMock: UserCreationService;
  let apiAdminCallServiceMock: ApiAdminCallService;
  let emailServiceMock: EmailService;
  let configServiceMock: ConfigService;
  let apiWorkflowUtilsServiceMock: ApiWorkflowUtilsService;
  let apiMetadataUtilsServiceMock: ApiMetadataUtilsService;
  let apiMetadataCallService: ApiMetadataCallService;
  let apiKycUtilsServiceMock: ApiKycUtilsService;
  let pinoLoggereMock: NestJSPinoLogger;
  let kycTemplateServiceMock: KYCTemplateService;
  let apiEntityCallServiceMock: ApiEntityCallService;
  let networkServiceMock: NetworkService;

  beforeEach(() => {
    userCreationServiceMock = createMockInstance(UserCreationService);
    apiAdminCallServiceMock = createMockInstance(ApiAdminCallService);
    emailServiceMock = createMockInstance(EmailService);
    configServiceMock = createMockInstance(ConfigService);
    apiWorkflowUtilsServiceMock = createMockInstance(ApiWorkflowUtilsService);
    apiMetadataUtilsServiceMock = createMockInstance(ApiMetadataUtilsService);
    apiMetadataCallService = createMockInstance(ApiMetadataCallService);
    apiKycUtilsServiceMock = createMockInstance(ApiKycUtilsService);
    pinoLoggereMock = createMockInstance(NestJSPinoLogger);
    kycTemplateServiceMock = createMockInstance(KYCTemplateService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    networkServiceMock = createMockInstance(NetworkService);

    service = new TenantService(
      userCreationServiceMock,
      apiAdminCallServiceMock,
      emailServiceMock,
      configServiceMock,
      apiWorkflowUtilsServiceMock,
      apiMetadataUtilsServiceMock,
      apiMetadataCallService,
      apiKycUtilsServiceMock,
      pinoLoggereMock,
      kycTemplateServiceMock,
      apiEntityCallServiceMock,
      networkServiceMock,
    );

    const defaultAlias = 'different-acme.assets.codefi.network';

    apiEntityCallServiceMock.createTenantOrUpdateTenant = jest
      .fn()
      .mockResolvedValueOnce(TenantExample);

    apiAdminCallServiceMock.listAllClientApplicationInAuth0 = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve([
          buildFakeClientApplication({
            name: differentClientApplicationNameExample,
            clientMetadata: {
              assets: 'true',
              tenantId: mockTenantId,
              aliases: JSON.stringify([defaultAlias]),
              subTenantId:
                ClientApplicationExample[ClientKeys.METADATA][
                  ClientKeys.METADATA__SUB_TENANT_ID
                ],
            },
          }),
        ]),
      );

    configServiceMock.createOrUpdateConfig = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockConfig));
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTenant', () => {
    beforeEach(() => {
      const mockClientApplication = buildFakeClientApplication({
        name: clientApplicationNameExample,
        clientMetadata: {
          aliases: '["acme.assets.codefi.network"]',
          assets: 'true',
          tenantId: mockTenantId,
          subTenantId:
            ClientApplicationExample[ClientKeys.METADATA][
              ClientKeys.METADATA__SUB_TENANT_ID
            ],
        },
      });
      apiAdminCallServiceMock.createClientApplicationInAuth0 = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockClientApplication));

      apiAdminCallServiceMock.updateClientApplicationInAuth0 = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockClientApplication));

      apiAdminCallServiceMock.createGrantForClientApplication = jest
        .fn()
        .mockImplementation(() => Promise.resolve(GrantExample));

      userCreationServiceMock.createInitialUsers = jest
        .fn()
        .mockImplementation(() => Promise.resolve(initialUsersExample));
    });

    it('creates client application + postman credentials', async () => {
      const defaultAlias = 'acme.assets.codefi.network';
      const aliases = [defaultAlias, 'acme.payments.codefi.network'];
      const region = Region.EU;
      const tenantType = TenantType.API;

      const defaultNetwork = {
        [NetworkKeys.KEY]: 'defaultNetworkKey',
      };
      networkServiceMock.retrieveDefaultNetwork = jest
        .fn()
        .mockResolvedValueOnce(defaultNetwork);

      apiEntityCallServiceMock.createTenant = jest
        .fn()
        .mockResolvedValueOnce(TenantExample);

      const tenantCreationResponse = await service.createTenant(
        {
          superAdmin: superAdminUserExample,
          name: tenantNameExample,
          email: mockEmail,
          password: mockPassword,
          firstName: mockFirstName,
          lastName: mockLastName,
          defaultAlias,
          aliases,
          tenantRegion: region,
          tenantType,
          enableMarketplace: false,
          usecase: undefined,
        },
        undefined, // kycTemplateId
        true, // sendNotification
        fakeJwtToken,
        undefined, // faucetNetworksKeys
        false, // createM2mClientApplication
        undefined, // forceTenantId
      );
      expect(tenantCreationResponse.tenant).toEqual(TenantExample);
      expect(tenantCreationResponse.newTenant).toEqual(true);
      expect(tenantCreationResponse.firstUser).toEqual(adminUserExample);

      const postmanCredentialsResponse = {
        ...tenantCreationResponse.postmanCredentials,
        [PostmanKeys.ID]: PostmanCredentialsExample[PostmanKeys.ID],
        [PostmanKeys.POSTMAN_EXPORTED_AT]:
          PostmanCredentialsExample[PostmanKeys.POSTMAN_EXPORTED_AT],
      };
      expect(postmanCredentialsResponse).toEqual(PostmanCredentialsExample);

      expect(tenantCreationResponse.message).toEqual(
        `Codefi Assets tenant with ID ${
          ClientApplicationExample[ClientKeys.CLIENT_ID]
        } and name ${tenantNameExample} has been successfully created`,
      );

      expect(
        apiAdminCallServiceMock.createClientApplicationInAuth0,
      ).toHaveBeenCalledTimes(1);
      expect(
        apiAdminCallServiceMock.createClientApplicationInAuth0,
      ).toHaveBeenCalledWith(
        clientApplicationNameExample,
        defaultAlias,
        aliases,
        AppType.NotInteractive,
        undefined, // tenantId
        undefined, // entityId
      );

      expect(
        apiAdminCallServiceMock.createGrantForClientApplication,
      ).toHaveBeenCalledTimes(1);
      expect(
        apiAdminCallServiceMock.createGrantForClientApplication,
      ).toHaveBeenCalledWith(
        ClientApplicationExample[ClientKeys.CLIENT_ID],
        config().acceptedAudience,
        ASSETS_API_REQUIRED_SCOPES,
      );

      expect(userCreationServiceMock.createInitialUsers).toHaveBeenCalledTimes(
        1,
      );
      expect(userCreationServiceMock.createInitialUsers).toHaveBeenCalledWith(
        ClientApplicationExample[ClientKeys.CLIENT_ID],
        mockEmail,
        mockPassword,
        mockFirstName,
        mockLastName,
        tenantNameExample,
        tenantType,
        false, // e2eTestUsers
        undefined, // no faucet networks array specified
        fakeJwtToken,
      );
      expect(networkServiceMock.retrieveDefaultNetwork).toHaveBeenCalledTimes(
        1,
      );
      expect(networkServiceMock.retrieveDefaultNetwork).toHaveBeenCalledWith(
        ClientApplicationExample[ClientKeys.CLIENT_ID],
        true,
      );
      expect(
        apiEntityCallServiceMock.createTenantOrUpdateTenant,
      ).toHaveBeenCalledTimes(1);
      expect(
        apiEntityCallServiceMock.createTenantOrUpdateTenant,
      ).toHaveBeenCalledWith({
        id: ClientApplicationExample[ClientKeys.CLIENT_ID],
        name: tenantNameExample,
        products: { assets: true },
        defaultNetworkKey: defaultNetwork[NetworkKeys.KEY],
        metadata: {
          subTenantId:
            ClientApplicationExample[ClientKeys.METADATA][
              ClientKeys.METADATA__SUB_TENANT_ID
            ],
        },
      });
    });

    it('creates client application + postman credentials with legacy client without aliases', async () => {
      // legacy client applications without aliases or region
      apiAdminCallServiceMock.listAllClientApplicationInAuth0 = jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve([
            buildFakeClientApplication({
              name: 'Foo ltd',
              clientMetadata: {
                useClientIdAsTenantId: 'true',
              } as any,
            }),
            buildFakeClientApplication({
              name: 'Bar ltd',
              clientMetadata: {
                useClientIdAsTenantId: 'true',
              } as any,
            }),
          ]),
        );

      const defaultNetwork = {
        [NetworkKeys.KEY]: 'defaultNetworkKey',
      };
      networkServiceMock.retrieveDefaultNetwork = jest
        .fn()
        .mockResolvedValueOnce(defaultNetwork);

      apiEntityCallServiceMock.createTenant = jest
        .fn()
        .mockResolvedValueOnce(TenantExample);

      const defaultAlias = 'acme.assets.codefi.network';
      const aliases = [defaultAlias];
      const region = Region.EU;
      const tenantType = TenantType.API;
      const tenantCreationResponse = await service.createTenant(
        {
          superAdmin: superAdminUserExample,
          name: tenantNameExample,
          email: mockEmail,
          password: mockPassword,
          firstName: mockFirstName,
          lastName: mockLastName,
          defaultAlias,
          aliases: aliases,
          tenantRegion: region,
          tenantType,
          enableMarketplace: false,
          usecase: undefined,
        },
        undefined, // kycTemplateId
        true, // sendNotification
        fakeJwtToken,
        undefined, // faucetNetworksKeys
        false, // createM2mClientApplication
        undefined, // forceTenantId
      );
      expect(tenantCreationResponse.tenant).toEqual(TenantExample);
      expect(tenantCreationResponse.newTenant).toEqual(true);
      expect(tenantCreationResponse.firstUser).toEqual(adminUserExample);

      const postmanCredentialsResponse = {
        ...tenantCreationResponse.postmanCredentials,
        [PostmanKeys.ID]: PostmanCredentialsExample[PostmanKeys.ID],
        [PostmanKeys.POSTMAN_EXPORTED_AT]:
          PostmanCredentialsExample[PostmanKeys.POSTMAN_EXPORTED_AT],
      };
      expect(postmanCredentialsResponse).toEqual(PostmanCredentialsExample);

      expect(tenantCreationResponse.message).toEqual(
        `Codefi Assets tenant with ID ${
          ClientApplicationExample[ClientKeys.CLIENT_ID]
        } and name ${tenantNameExample} has been successfully created`,
      );

      expect(
        apiAdminCallServiceMock.createClientApplicationInAuth0,
      ).toHaveBeenCalledTimes(1);
      expect(
        apiAdminCallServiceMock.createClientApplicationInAuth0,
      ).toHaveBeenCalledWith(
        clientApplicationNameExample,
        defaultAlias,
        aliases,
        AppType.NotInteractive,
        undefined, // tenantId
        undefined, // entityId
      );

      expect(
        apiAdminCallServiceMock.createGrantForClientApplication,
      ).toHaveBeenCalledTimes(1);
      expect(
        apiAdminCallServiceMock.createGrantForClientApplication,
      ).toHaveBeenCalledWith(
        ClientApplicationExample[ClientKeys.CLIENT_ID],
        config().acceptedAudience,
        ASSETS_API_REQUIRED_SCOPES,
      );

      expect(userCreationServiceMock.createInitialUsers).toHaveBeenCalledTimes(
        1,
      );
      expect(userCreationServiceMock.createInitialUsers).toHaveBeenCalledWith(
        ClientApplicationExample[ClientKeys.CLIENT_ID],
        mockEmail,
        mockPassword,
        mockFirstName,
        mockLastName,
        tenantNameExample,
        tenantType,
        false, // e2eTestUsers
        undefined, // no faucet networks array specified
        fakeJwtToken,
      );
      expect(networkServiceMock.retrieveDefaultNetwork).toHaveBeenCalledTimes(
        1,
      );
      expect(networkServiceMock.retrieveDefaultNetwork).toHaveBeenCalledWith(
        ClientApplicationExample[ClientKeys.CLIENT_ID],
        true,
      );
      expect(
        apiEntityCallServiceMock.createTenantOrUpdateTenant,
      ).toHaveBeenCalledTimes(1);
      expect(
        apiEntityCallServiceMock.createTenantOrUpdateTenant,
      ).toHaveBeenCalledWith({
        id: ClientApplicationExample[ClientKeys.CLIENT_ID],
        name: tenantNameExample,
        products: { assets: true },
        defaultNetworkKey: defaultNetwork[NetworkKeys.KEY],
        metadata: {
          subTenantId:
            ClientApplicationExample[ClientKeys.METADATA][
              ClientKeys.METADATA__SUB_TENANT_ID
            ],
        },
      });
    });

    it('rejects a client application if any of the aliases already exists', async () => {
      const defaultAlias = 'acme.assets.codefi.network';
      const aliases = [
        'acme.assets.codefi.network',
        'acme.payments.codefi.network',
      ];
      const region = Region.EU;
      const tenantType = TenantType.API;
      apiAdminCallServiceMock.listAllClientApplicationInAuth0 = jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve([
            buildFakeClientApplication({
              name: 'Foo ltd',
              clientMetadata: {
                aliases:
                  '["acme.assets.codefi.network","acme.staking.codefi.network"]',
                assets: 'true',
                tenantId: mockTenantId,
              },
            }),
            buildFakeClientApplication({
              name: 'Bar ltd',
              clientMetadata: {
                aliases: '["acme.payments.codefi.network"]',
                assets: 'true',
                tenantId: mockTenantId,
              },
            }),
          ]),
        );

      await expect(
        service.createTenant(
          {
            superAdmin: superAdminUserExample,
            name: tenantNameExample,
            email: mockEmail,
            password: mockPassword,
            firstName: mockFirstName,
            lastName: mockLastName,
            defaultAlias,
            aliases: aliases,
            tenantRegion: region,
            tenantType,
            enableMarketplace: false,
            usecase: undefined,
          },
          undefined, // kycTemplateId
          true, // sendNotification
          fakeJwtToken,
          [], // faucetNetworksKeys
          false, // createM2mClientApplication
          undefined, // forceTenantId
        ),
      ).rejects.toEqual(
        new Error(
          "createTenant --> createClientApplicationIfRequired --> checkTenantAliases --> invalid aliase(s): 'acme.assets.codefi.network'. Those are already taken by 'Foo ltd' client application.",
        ),
      );
    });

    it('returns retrieved client application + postman credentials', async () => {
      const defaultAlias = 'different-acme.assets.codefi.network';
      apiAdminCallServiceMock.updateClientApplicationInAuth0 = jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve(
            buildFakeClientApplication({
              name: differentClientApplicationNameExample,
              clientMetadata: {
                aliases: '["different-acme.assets.codefi.network"]',
                assets: 'true',
                tenantId: mockTenantId,
                subTenantId:
                  ClientApplicationExample[ClientKeys.METADATA][
                    ClientKeys.METADATA__SUB_TENANT_ID
                  ],
              },
            }),
          ),
        );

      const defaultNetwork = {
        [NetworkKeys.KEY]: 'defaultNetworkKey',
      };
      networkServiceMock.retrieveDefaultNetwork = jest
        .fn()
        .mockResolvedValueOnce(defaultNetwork);
      apiEntityCallServiceMock.createTenant = jest
        .fn()
        .mockResolvedValueOnce(TenantExample);

      const aliases = ['different-acme.assets.codefi.network'];
      const region = Region.EU;
      const tenantType = TenantType.API;

      const tenantCreationResponse = await service.createTenant(
        {
          superAdmin: superAdminUserExample,
          name: differentTenantNameExample,
          email: mockEmail,
          password: mockPassword,
          firstName: mockFirstName,
          lastName: mockLastName,
          defaultAlias,
          aliases,
          tenantRegion: region,
          tenantType,
          enableMarketplace: false,
          usecase: undefined,
        },
        undefined, // kycTemplateId
        true, // sendNotification
        fakeJwtToken,
        [], // faucetNetworksKeys
        false, // createM2mClientApplication
        undefined, // forceTenantId
      );
      expect(tenantCreationResponse.tenant).toEqual(TenantExample);
      expect(tenantCreationResponse.newTenant).toEqual(false);
      expect(tenantCreationResponse.firstUser).toEqual(adminUserExample);

      const postmanCredentialsResponse = {
        ...tenantCreationResponse.postmanCredentials,
        [PostmanKeys.ID]: PostmanCredentialsExample[PostmanKeys.ID],
        [PostmanKeys.POSTMAN_EXPORTED_AT]:
          PostmanCredentialsExample[PostmanKeys.POSTMAN_EXPORTED_AT],
      };
      expect(postmanCredentialsResponse).toEqual(differentPostmanCredentials);

      expect(tenantCreationResponse.message).toEqual(
        `Codefi Assets tenant with ID ${
          ClientApplicationExample[ClientKeys.CLIENT_ID]
        } and name ${differentTenantNameExample} has been successfully retrieved`,
      );

      expect(
        apiAdminCallServiceMock.createClientApplicationInAuth0,
      ).toHaveBeenCalledTimes(0);

      expect(
        apiAdminCallServiceMock.createGrantForClientApplication,
      ).toHaveBeenCalledTimes(0);

      expect(userCreationServiceMock.createInitialUsers).toHaveBeenCalledTimes(
        1,
      );
      expect(userCreationServiceMock.createInitialUsers).toHaveBeenCalledWith(
        ClientApplicationExample[ClientKeys.CLIENT_ID],
        mockEmail,
        mockPassword,
        mockFirstName,
        mockLastName,
        differentTenantNameExample,
        tenantType,
        false, // e2eTestUsers
        [], // no faucet networks array specified
        fakeJwtToken,
      );
      expect(networkServiceMock.retrieveDefaultNetwork).toHaveBeenCalledTimes(
        1,
      );
      expect(networkServiceMock.retrieveDefaultNetwork).toHaveBeenCalledWith(
        ClientApplicationExample[ClientKeys.CLIENT_ID],
        true,
      );
      expect(
        apiEntityCallServiceMock.createTenantOrUpdateTenant,
      ).toHaveBeenCalledTimes(1);
      expect(
        apiEntityCallServiceMock.createTenantOrUpdateTenant,
      ).toHaveBeenCalledWith({
        id: ClientApplicationExample[ClientKeys.CLIENT_ID],
        name: differentTenantNameExample,
        products: { assets: true },
        defaultNetworkKey: defaultNetwork[NetworkKeys.KEY],
        metadata: {
          subTenantId:
            ClientApplicationExample[ClientKeys.METADATA][
              ClientKeys.METADATA__SUB_TENANT_ID
            ],
        },
      });
    });
  });

  describe('deleteTenant', () => {
    beforeEach(() => {
      apiAdminCallServiceMock.deleteClientApplicationInAuth0 = jest
        .fn()
        .mockImplementation(() => Promise.resolve(''));

      apiWorkflowUtilsServiceMock.deleteTenant = jest
        .fn()
        .mockImplementation(() => Promise.resolve(''));

      apiMetadataUtilsServiceMock.deleteTenant = jest
        .fn()
        .mockImplementation(() => Promise.resolve(''));

      apiKycUtilsServiceMock.deleteTenant = jest
        .fn()
        .mockImplementation(() => Promise.resolve(''));
    });

    it('returns deletion message', async () => {
      const tenantCreationResponse = await service.deleteTenant(mockTenantId);
      expect(tenantCreationResponse.message).toEqual(
        `Codefi Assets tenant with ID ${mockTenantId} has been successfully deleted`,
      );

      expect(
        apiAdminCallServiceMock.deleteClientApplicationInAuth0,
      ).toHaveBeenCalledTimes(1);
      expect(apiWorkflowUtilsServiceMock.deleteTenant).toHaveBeenCalledTimes(1);
      expect(apiMetadataUtilsServiceMock.deleteTenant).toHaveBeenCalledTimes(1);
      expect(apiKycUtilsServiceMock.deleteTenant).toHaveBeenCalledTimes(1);
      expect(
        apiAdminCallServiceMock.deleteClientApplicationInAuth0,
      ).toHaveBeenCalledWith(mockTenantId);
      expect(apiWorkflowUtilsServiceMock.deleteTenant).toHaveBeenCalledWith(
        mockTenantId,
      );
      expect(apiMetadataUtilsServiceMock.deleteTenant).toHaveBeenCalledWith(
        mockTenantId,
      );
      expect(apiKycUtilsServiceMock.deleteTenant).toHaveBeenCalledWith(
        mockTenantId,
      );
    });
  });
});
