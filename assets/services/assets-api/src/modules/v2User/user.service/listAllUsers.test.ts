import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import createMockInstance from 'jest-create-mock-instance';
import { UserListingService } from './listAllUsers';
import { LinkService } from 'src/modules/v2Link/link.service';
import { UserRetrievalService } from './retrieveUser';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { WorkflowInstanceService } from 'src/modules/v2WorkflowInstance/workflow.instance.service';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { User, UserNature, UserType } from 'src/types/user';
import { WalletType } from 'src/types/wallet';
import { TokenState } from 'src/types/states';
import {
  generateTenantConfig,
  generateToken,
  generateEntityLink,
  generateUser,
} from 'test/mockDataGenerators';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';
import { WalletType as EntityApiWalletType } from '@codefi-assets-and-payments/ts-types';

describe('listAllUsers', () => {
  let LinkServiceMock: jest.Mocked<LinkService>;
  let UserRetrievalServiceMock: jest.Mocked<UserRetrievalService>;
  let BalanceServiceMock: jest.Mocked<BalanceService>;
  let ApiMetadataCallServiceMock: jest.Mocked<ApiMetadataCallService>;
  let ApiEntityCallServiceMock: jest.Mocked<ApiEntityCallService>;
  let ApiWorkflowWorkflowInstanceServiceMock: jest.Mocked<ApiWorkflowWorkflowInstanceService>;
  let EntityServiceMock: jest.Mocked<EntityService>;
  let WorkflowInstanceServiceMock: jest.Mocked<WorkflowInstanceService>;
  let ConfigServiceMock: jest.Mocked<ConfigService>;

  let UserListingServiceMock: UserListingService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  beforeEach(() => {
    const loggerMock = createMockInstance(NestJSPinoLogger);
    LinkServiceMock = createMockInstance(LinkService);
    UserRetrievalServiceMock = createMockInstance(UserRetrievalService);
    BalanceServiceMock = createMockInstance(BalanceService);
    ApiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);
    ApiEntityCallServiceMock = createMockInstance(ApiEntityCallService);

    ApiWorkflowWorkflowInstanceServiceMock = createMockInstance(
      ApiWorkflowWorkflowInstanceService,
    );
    EntityServiceMock = createMockInstance(EntityService);
    WorkflowInstanceServiceMock = createMockInstance(WorkflowInstanceService);
    ConfigServiceMock = createMockInstance(ConfigService);

    UserListingServiceMock = new UserListingService(
      loggerMock,
      LinkServiceMock,
      UserRetrievalServiceMock,
      BalanceServiceMock,
      ApiMetadataCallServiceMock,
      ApiEntityCallServiceMock,
      ApiWorkflowWorkflowInstanceServiceMock,
      EntityServiceMock,
      WorkflowInstanceServiceMock,
      ConfigServiceMock,
    );
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('#listAllInvestorsLinkedToToken', () => {
    it('successfully returns all investors of a given token', async () => {
      const tenantId = 'dummyTenantId';
      const overrideUser: Partial<User> = {
        id: 'fakeUserId',
        tenantId,
        superUserId: 'fakeSuperUserId',
        userNature: UserNature.LEGAL,
        userType: UserType.ISSUER,
        firstName: 'fakeFirstName',
        lastName: 'fakeLastName',
        email: 'fake_email@example.com',
        defaultWallet: '0x429a99A78323e7418Db19d27bbd81b3D86a2aF94',
        wallets: [
          {
            address: '0x6c272B2460C7a3eD8a7Fc205e70fC3A87e04eA74',
            type: WalletType.VAULT_DEPRECATED,
            newType: EntityApiWalletType.EXTERNAL_OTHER,
          },
          {
            address: '0x429a99A78323e7418Db19d27bbd81b3D86a2aF94',
            type: WalletType.VAULT,
            newType: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
            data: {},
          },
        ],
        data: {
          company: 'Acme',
          registrationLink: 'https://fakeDomain.network/investor/auth',
          userMigratedInAuthO2: true,
        },
      };

      const config = generateTenantConfig({ tenantId });
      const token = generateToken({
        options: { includeAssetData: true },
        overrideToken: { tenantId, issuerId: overrideUser.id },
      });
      const link = generateEntityLink({
        overrideEntityLink: {
          tenantId,
          userId: overrideUser.id,
          entityId: token.id,
        },
      });

      const user = generateUser({
        overrideUser: {
          ...overrideUser,
        },
      });

      const retrieveTenantConfigMock =
        ConfigServiceMock.retrieveTenantConfig.mockResolvedValueOnce(config);
      const retrieveEntityIfAuthorizedMock =
        EntityServiceMock.retrieveEntityIfAuthorized.mockResolvedValueOnce([
          ,
          ,
          token,
          config,
        ]);
      const listAllEntityLinksMock =
        LinkServiceMock.listAllEntityLinks.mockResolvedValueOnce([link]);
      const retrieveFullUserMock =
        UserRetrievalServiceMock.retrieveFullUser.mockResolvedValueOnce(user);

      const { investors } =
        await UserListingServiceMock.listAllInvestorsLinkedToToken({
          tenantId,
          callerId: 'fakeCallerId',
          user,
          tokenId: 'fakeTokenId',
          offset: 0,
          limit: 3,
        });

      expect(investors).toEqual([user]);
      expect(retrieveTenantConfigMock).toHaveBeenCalledTimes(1);
      expect(retrieveEntityIfAuthorizedMock).toHaveBeenCalledTimes(1);
      expect(listAllEntityLinksMock).toHaveBeenCalledTimes(1);
      expect(retrieveFullUserMock).toHaveBeenCalledTimes(1);
    });

    describe('withBalances', () => {
      it('returns active investors of a given token with corresponding token balances', async () => {
        const tenantId = 'dummyTenantId';
        const overrideUser: Partial<User> = {
          id: 'fakeUserId',
          tenantId,
          superUserId: 'fakeSuperUserId',
          userNature: UserNature.LEGAL,
          userType: UserType.ISSUER,
          firstName: 'fakeFirstName',
          lastName: 'fakeLastName',
          email: 'fake_email@example.com',
          defaultWallet: '0x429a99A78323e7418Db19d27bbd81b3D86a2aF94',
          wallets: [
            {
              address: '0x6c272B2460C7a3eD8a7Fc205e70fC3A87e04eA74',
              type: WalletType.VAULT_DEPRECATED,
              newType: EntityApiWalletType.EXTERNAL_OTHER,
            },
            {
              address: '0x429a99A78323e7418Db19d27bbd81b3D86a2aF94',
              type: WalletType.VAULT,
              newType: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
              data: {},
            },
          ],
          data: {
            company: 'Acme',
            registrationLink: 'https://fakeDomain.network/investor/auth',
            userMigratedInAuthO2: true,
          },
        };

        const config = generateTenantConfig({ tenantId });
        const token = generateToken({
          options: { includeAssetData: true },
          overrideToken: { tenantId, issuerId: overrideUser.id },
        });
        const link = generateEntityLink({
          overrideEntityLink: {
            tenantId,
            userId: overrideUser.id,
            entityId: token.id,
          },
        });

        const user = generateUser({
          overrideUser: {
            ...overrideUser,
            tokenRelatedData: {
              links: [link],
              tokenActions: [],
              tokenOrders: [],
              vehicles: undefined,
              balances: {
                classes: [
                  {
                    name: 'shareclassname',
                    balances: {
                      states: [
                        {
                          name: TokenState.LOCKED,
                          balance: 0,
                          spendableBalance: 0,
                        },
                        {
                          name: TokenState.RESERVED,
                          balance: 0,
                          spendableBalance: 0,
                        },
                        {
                          name: TokenState.ISSUED,
                          balance: 10,
                          spendableBalance: 10,
                        },
                        {
                          name: TokenState.COLLATERAL,
                          balance: 0,
                          spendableBalance: 0,
                        },
                      ],
                      total: 0,
                      spendableTotal: 0,
                    },
                  },
                ],
                total: 10,
                spendableTotal: 0,
              },
              onChainAllowlist: false,
              onChainBlocklist: false,
            },
          },
        });

        const retrieveTenantConfigMock =
          ConfigServiceMock.retrieveTenantConfig.mockResolvedValueOnce(config);
        const retrieveEntityIfAuthorizedMock =
          EntityServiceMock.retrieveEntityIfAuthorized.mockResolvedValueOnce([
            ,
            ,
            token,
            config,
          ]);
        const listAllEntityLinksMock =
          LinkServiceMock.listAllEntityLinks.mockResolvedValueOnce([link]);
        const retrieveFullUserMock =
          UserRetrievalServiceMock.retrieveFullUser.mockResolvedValueOnce(user);

        const { investors } =
          await UserListingServiceMock.listAllInvestorsLinkedToToken({
            tenantId,
            callerId: 'fakeCallerId',
            user,
            tokenId: 'fakeTokenId',
            offset: 0,
            limit: 3,
            withBalances: true,
          });

        expect(investors).toEqual([user]);
        expect(retrieveTenantConfigMock).toHaveBeenCalledTimes(1);
        expect(retrieveEntityIfAuthorizedMock).toHaveBeenCalledTimes(1);
        expect(listAllEntityLinksMock).toHaveBeenCalledTimes(1);
        expect(retrieveFullUserMock).toHaveBeenCalledTimes(1);
        expect(
          BalanceServiceMock.preListSuppliesForTokens,
        ).toHaveBeenCalledTimes(1);
        expect(
          BalanceServiceMock.preListBalancesForUserTokenLinks,
        ).toHaveBeenCalledTimes(1);
      });
    });
  });
});
