import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiMetadataCallService } from './metadata';
import createMockInstance from 'jest-create-mock-instance';
import { ApiCallHelperService } from '.';
import {
  DvpType,
  OrderSide,
  OrderType,
  WorkflowInstance,
  WorkflowInstanceMetadata,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { EntityType } from 'src/types/entity';
import { WalletType } from 'src/types/wallet';
import { User, UserNature, UserType, keys as UserKeys } from 'src/types/user';
import { SmartContract } from 'src/types/smartContract';
import { Token, keys as TokenKeys } from 'src/types/token';
import axios from 'axios';
import { ApiEntityCallService } from './entity';
import { generateToken, generateUser } from 'test/mockDataGenerators';
import { WalletType as EntityApiWalletType } from '@codefi-assets-and-payments/ts-types';

const axiosClientGetMock = jest.fn();

jest.mock('axios', () => {
  return {
    create: jest.fn(() => {
      return { get: axiosClientGetMock };
    }),
  };
});

axios as jest.Mocked<typeof axios>;

describe('ApiMetadataCallService', function () {
  type CommonUser = Pick<
    User,
    | UserKeys.USER_ID
    | UserKeys.FIRST_NAME
    | UserKeys.LAST_NAME
    | UserKeys.USER_TYPE
    | UserKeys.EMAIL
    | UserKeys.DEFAULT_WALLET
  >;

  const assetTemplateId = 'fakeAssetTemplateId';
  const kycTemplateId = 'fakeKycTemplateId';
  const commonTenantId = 'fakeTenantId';

  const commonInvestorProps: CommonUser & Partial<User> = {
    id: 'fakeInvestorId',
    firstName: 'Mr. Investor',
    lastName: 'Vitalik',
    email: 'investor@codefi.net',
    userType: UserType.INVESTOR,
    defaultWallet: '0x3D05d31EDf286D93ae78DdC6E0Ee0163f3aA8206',
    data: { clientName: 'fakeClientName' },
    wallets: [
      {
        address: '0x3D05d31EDf286D93ae78DdC6E0Ee0163f3aA8206',
        type: WalletType.VAULT,
        newType: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        data: {},
      },
    ],
  };
  const commonIssuerProps: CommonUser & Partial<User> = {
    id: 'fakeIssuerId',
    firstName: 'Mr. Issuer',
    lastName: 'Satoshi',
    email: 'issuer@codefi.net',
    userType: UserType.ISSUER,
    defaultWallet: '0x458882F9798A55263AD8F0E38d223e7FDF6bc203',
    wallets: [
      {
        address: '0x5555DBf8e17aDaeFAca27AfCe972B0F15257D3ff',
        type: WalletType.VAULT_DEPRECATED,
        newType: EntityApiWalletType.EXTERNAL_OTHER,
      },
      {
        address: '0x458882F9798A55263AD8F0E38d223e7FDF6bc203',
        type: WalletType.VAULT,
        newType: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        data: {},
      },
    ],
    company: 'LL Corp',
  };
  const commonTokenProps: Pick<Token, TokenKeys.TOKEN_ID> = {
    id: 'fakeTokenId',
  };

  const generateWorkflowInstanceMetadata = (
    overrideMetadata?: WorkflowInstanceMetadata,
  ): WorkflowInstanceMetadata => {
    return {
      user: {
        id: commonInvestorProps.id,
        firstName: commonInvestorProps.firstName,
        lastName: commonInvestorProps.lastName,
        userType: commonInvestorProps.userType,
        entityName: commonInvestorProps.data.clientName,
        defaultWallet: commonInvestorProps.defaultWallet,
        wallets: commonInvestorProps.wallets,
      },
      issuer: {
        id: commonIssuerProps.id,
        firstName: commonIssuerProps.firstName,
        lastName: commonIssuerProps.lastName,
        company: commonIssuerProps.company,
        entityName: undefined,
        defaultWallet: commonIssuerProps.defaultWallet,
        wallets: commonIssuerProps.wallets,
      },
      token: {
        id: commonTokenProps.id,
        name: 'AssetA',
        symbol: 'AA',
        currency: 'USD',
        automateRetirement: false,
        automateHoldCreation: false,
        automateSettlement: false,
        assetTemplateId,
        assetType: undefined,
      },
      ...(overrideMetadata || {}),
    };
  };

  const generateWorkflowInstance = ({
    inputWorkflow,
    withDefaultMetadata,
    overrideMetadata,
  }: {
    inputWorkflow?: Partial<WorkflowInstance>;
    withDefaultMetadata: boolean;
    overrideMetadata?: WorkflowInstanceMetadata;
  }): WorkflowInstance => {
    const defaultMintWorkdflowInstance = {
      id: 22222,
      tenantId: commonTenantId,
      brokerId: null,
      idempotencyKey: '3D5Srl0H-zrL8X7Qv-bICqK4zq-zH3ue2Rc',
      name: 'mint',
      workflowType: WorkflowType.ACTION,
      objectId: null,
      state: '__notStarted__',
      role: 'ISSUER',
      workflowTemplateId: 135,
      userId: commonInvestorProps.id,
      recipientId: null,
      entityId: commonTokenProps.id,
      entityType: EntityType.TOKEN,
      wallet: commonIssuerProps.defaultWallet,
      date: new Date('2022-02-02T15:05:32.643Z'),
      assetClassKey: 'shareclassname',
      quantity: 4,
      price: 4,
      documentId: null,
      paymentId: 'fakePaymentId',
      offerId: null,
      orderSide: null,
      data: {
        txSignerId: commonIssuerProps.id,
        walletUsed: {
          address: commonIssuerProps.defaultWallet,
          type: WalletType.VAULT,
          newType: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
          data: {},
        },
        nextStatus: 'executed',
        transaction: {
          executed: {
            status: 'pending',
            transactionId: 'fakeTransactionId',
          },
        },
        isLedgerTx: false,
        stateUpdatedTimestamps: { '1643814332644': '__notStarted__' },
      },
      createdAt: new Date('2022-02-02T15:05:32.837Z'),
      updatedAt: new Date('2022-02-02T15:05:32.837Z'),
    };

    if (!withDefaultMetadata) {
      return { ...defaultMintWorkdflowInstance, ...inputWorkflow };
    }

    return {
      ...defaultMintWorkdflowInstance,
      metadata: generateWorkflowInstanceMetadata(overrideMetadata),
      ...inputWorkflow,
    };
  };

  const loggerMock = createMockInstance(NestJSPinoLogger);
  const apiCallHelperServiceMock = createMockInstance(ApiCallHelperService);
  const apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);

  const ApiMetadataCallServiceMock = new ApiMetadataCallService(
    loggerMock,
    apiCallHelperServiceMock,
    apiEntityCallServiceMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('addMetadataToWorkflowInstances', function () {
    it('Returns an array of WorkflowInstances enriched with relevant metadata', async function () {
      const fakeToken = generateToken({
        overrideToken: {
          ...commonTokenProps,
          tenantId: commonTenantId,
          issuerId: commonIssuerProps.id,
          creatorId: commonIssuerProps.id,
          assetTemplateId,
        },
        overrideTokenData: {
          txSignerId: commonIssuerProps.id,
          kycTemplateId,
        },
      });
      const investor = generateUser({
        overrideUser: {
          ...commonInvestorProps,
          tenantId: commonTenantId,
        },
        overrideUserData: {
          ...commonInvestorProps.data,
          userType: commonInvestorProps.userType,
        },
      });
      const issuer = generateUser({
        overrideUser: {
          ...commonIssuerProps,
          createdAt: new Date('2020-05-29T14:17:21.570Z'),
          updatedAt: new Date('2022-01-31T11:00:56.117Z'),
          userNature: UserNature.LEGAL,
          docuSignId: 'fakeDocumentSignId',
          data: {
            registrationLink: 'https://fakeregistrationlink.yolo',
            kycTemplateId,
            company: commonIssuerProps.company,
            loanAgreementsSigned: [
              '558c9834-70b3-423e-93cf-d41be94b6032',
              '2007a85c-3683-4bf3-89fe-6d749f32c78f',
            ],
          },
        },
      });

      const mintWorkflow = generateWorkflowInstance({
        inputWorkflow: {
          userId: investor.id,
          entityId: fakeToken.id,
          entityType: EntityType.TOKEN,
        },
        withDefaultMetadata: false,
      });

      const createTradeOrderWorkflow = generateWorkflowInstance({
        inputWorkflow: {
          userId: investor.id,
          id: 1111,
          idempotencyKey: 'U044jDMT-sUxDyFS3-lvgOSTz1-9tbfIyaI',
          name: 'createTradeOrder',
          state: 'submitted',
          role: 'INVESTOR',
          workflowType: WorkflowType.ORDER,
          workflowTemplateId: 139,
          wallet: commonInvestorProps.defaultWallet,
          date: new Date('2022-01-26T10:56:33.801Z'),
          quantity: 596,
          price: 1192,
          paymentId: 'anotherPaymentId',
          orderSide: OrderSide.SELL,
          entityId: fakeToken.id,
          entityType: EntityType.TOKEN,
          data: {
            type: OrderType.QUANTITY,
            dvp: {
              type: DvpType.NON_ATOMIC,
              dvpAddress: '0x17A895eA623E42E76a7ea52cfAC23057596D8823',
              recipient: { email: commonInvestorProps.email, id: null },
              delivery: {
                tokenAddress: fakeToken.defaultDeployment,
                tokenStandard: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
              },
            },
            stateUpdatedTimestamps: { '1643194593802': 'submitted' },
          },
          createdAt: new Date('2022-01-26T10:56:33.817Z'),
          updatedAt: new Date('2022-01-26T10:56:33.817Z'),
        },
        withDefaultMetadata: false,
      });

      axiosClientGetMock.mockResolvedValueOnce({
        status: 200,
        data: [fakeToken],
      });
      apiEntityCallServiceMock.fetchEntitiesBatch.mockResolvedValueOnce([
        issuer,
        investor,
      ]);

      const withAssetMetadata = false;

      const enrichedWorkflowInstances =
        await ApiMetadataCallServiceMock.addMetadataToWorkflowInstances(
          commonTenantId,
          [mintWorkflow, createTradeOrderWorkflow],
          withAssetMetadata,
        );

      expect(enrichedWorkflowInstances).toEqual([
        generateWorkflowInstance({
          inputWorkflow: mintWorkflow,
          withDefaultMetadata: true,
        }),
        generateWorkflowInstance({
          inputWorkflow: createTradeOrderWorkflow,
          withDefaultMetadata: true,
        }),
      ]);

      expect(axiosClientGetMock).toHaveBeenCalledTimes(1);
    });
  });
});
