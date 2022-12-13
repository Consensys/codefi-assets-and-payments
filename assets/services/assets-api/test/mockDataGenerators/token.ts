import { AssetCreationFlow, Currency } from 'src/types/asset';
import { AssetType } from 'src/types/asset/template';
import { SmartContract } from 'src/types/smartContract';
import { Token, keys as TokenKeys } from 'src/types/token';
import { WalletType } from 'src/types/wallet';
import { OrderType } from 'src/types/workflow/workflowInstances';
import { WalletType as EntityApiWalletType } from '@consensys/ts-types';

export const generateToken = ({
  overrideToken,
  overrideTokenData,
  overrideAssetData,
  options,
}: {
  options?: {
    includeAssetData: boolean;
  };
  overrideToken?: Partial<Token>;
  overrideTokenData?: Partial<Token[TokenKeys.DATA]>;
  overrideAssetData?: Partial<Token[TokenKeys.ASSET_DATA]>;
}): Token => {
  const baseToken = {
    id: 'fakeTokenId',
    tenantId: 'fakeTenantId',
    createdAt: new Date('2022-01-24T10:51:34.722Z'),
    updatedAt: new Date('2022-01-24T12:49:11.375Z'),
    issuerId: 'fakeIssuerId',
    name: 'AssetA',
    creatorId: 'fakeCreatorId',
    reviewerId: null,
    symbol: 'AA',
    standard: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
    defaultDeployment: '0xbc6FD3e3d40038e5Cd7e30d5B3F0932504F5E9e3',
    defaultChainId: '118174032', // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
    defaultNetworkKey: 'codefi_assets_dev_network_2',
    deployments: [],
    description: null,
    picture: null,
    bankAccount: null,
    assetClasses: ['shareclassname'],
    assetTemplateId: 'fakeAssetTemplateId',
    data: {
      assetCreationFlow: AssetCreationFlow.SINGLE_PARTY,
      kycTemplateId: 'fakeKycTemplateId',
      certificateActivated: true,
      certificateTypeAsNumber: 2,
      unregulatedERC20transfersActivated: false,
      worflowInstanceId: 368968,
      txSignerId: 'fakeTrxSignerId',
      walletUsed: {
        address: '0x458882F9798A55263AD8F0E38d223e7FDF6bc203',
        type: WalletType.VAULT,
        newType: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
        data: {},
      },
      nextStatus: 'deployed',
      transaction: {
        deployed: {
          status: 'pending',
          transactionId: 'fakeTokenTransactionId',
        },
      },
      isLedgerTx: false,
      ...(overrideTokenData || {}),
    },
    ...(overrideToken || {}),
  };

  if (!options?.includeAssetData) {
    return baseToken;
  }

  return {
    ...baseToken,
    assetData: {
      type: AssetType.CLOSED_END_FUND,
      asset: {
        name: 'AssetA',
        symbol: 'AA',
        description: 'A',
        bankInformations: {
          bankName: 'A',
          iban: 'A',
          swift: 'A',
        },
        documents: {
          docusign: {
            name: 'blank.pdf',
            key: 'fakeKey_blank.pdf',
            url: 'https://fakeDomain/asset/create/fakeTokenId',
          },
        },
      },
      class: [
        {
          name: 'ShareClassName',
          currency: Currency.USD,
          rules: {
            subscriptionType: OrderType.AMOUNT,
            minSubscriptionAmount: 1,
            maxSubscriptionAmount: 1000000,
          },
          nav: {
            value: 1,
          },
          initialSubscription: {
            startDate: '2022-01-24',
            startHour: '13:50',
            cutoffDate: '2022-01-24',
            cutoffHour: '14:01',
            settlementDate: '2022-01-24',
            settlementHour: '14:15',
          },
          key: 'shareclassname',
        },
      ],
      ...(overrideAssetData || {}),
    },
  };
};
