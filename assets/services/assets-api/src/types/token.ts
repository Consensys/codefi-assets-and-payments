import {
  UserExtendedForTokenExample,
  User,
  ReducedUserExample,
  ReducedUser,
} from 'src/types/user';

import { TokenState } from 'src/types/states';
import { Wallet } from './wallet';
import { UserTokenData, UserTokenDataExample } from './userEntityData';
import { DeploymentExample, Deployment } from './deployment';
import { AssetCreationFlow, AssetData } from './asset';
import { DEFAULT_HYBRID_TOKEN_STANDARD, SmartContract } from './smartContract';
import { AssetCycleInstance } from './asset/cycle';
import { InitialSupply } from './supply';
import { OrderSide } from './workflow/workflowInstances';
import { ExternalImporter } from './externalImporter';

export const DEFAULT_TOKEN_NAME = 'CodefiToken';
export const TOKEN_SYMBOL_MAX_LENGTH = 12;
export const DEFAULT_TOKEN_SYMBOL = 'CODEFI';

export const IDENTIFIER_MAX_LENGTH = 16;

export const TOKEN_STATE_MAX_LENGTH = 12;
export const ASSET_CLASS_MAX_LENGTH = 20;
export const ASSET_STATES = 'assetStates';
export const ASSET_CLASSES = 'assetClasses';
export const ASSET_CLASSES_ON_CHAIN = 'erc20CompliantAssetClasses';
export const ERC20_COMPLIANT_ASSET_STATES = 'erc20CompliantAssetStates';

export const DEFAULT_CLASS_NAME = 'classic';

export const BYPASS_KYC_CHECKS = 'bypassKycChecks';

export enum keys {
  TOKEN_ID = 'id',
  TENANT_ID = 'tenantId',
  NAME = 'name',
  SYMBOL = 'symbol',
  DEFAULT_DEPLOYMENT = 'defaultDeployment',
  STANDARD = 'standard',
  PICTURE = 'picture',
  DESCRIPTION = 'description',
  BANK_ACCOUNT = 'bankAccount',
  DEFAULT_CHAIN_ID = 'defaultChainId', // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
  DEFAULT_NETWORK_KEY = 'defaultNetworkKey',
  DEPLOYMENTS = 'deployments',
  DATA = 'data',
  DATA__ASSET_CREATION_FLOW = 'assetCreationFlow',
  CREATOR_ID = 'creatorId',
  REVIEWER_ID = 'reviewerId',
  DATA__KYC_TEMPLATE_ID = 'kycTemplateId',
  DATA_DEPRECATED_CHAIN_ID = 'deprecatedChainId',
  DATA__BYPASS_KYC_CHECKS = 'bypassKycChecks',
  DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL = 'bypassSecondaryTradeIssuerApproval',
  DATA__AUTOMATE_HOLD_CREATION = 'automateHoldCreation',
  DATA__AUTOMATE_SETTLEMENT = 'automateSettlement',
  DATA__AUTOMATE_RETIREMENT = 'automateRetirement',
  DATA__AUTOMATE_FORCE_BURN = 'automateForceBurn',
  DATA__CERTIFICATE_ACTIVATED = 'certificateActivated', // DEPRECATED (replaced by certificateTypeAsNumber)
  DATA__CERTIFICATE_TYPE_AS_NUMBER = 'certificateTypeAsNumber',
  DATA__UNREGULATED_ERC20_TRANSFERS_ACTIVATED = 'unregulatedERC20transfersActivated',
  DATA__CUSTOM_EXTENSION_ADDRESS = 'customExtensionAddress',
  DATA__INITIAL_OWNER_ADDRESS = 'initialOwnerAddress',
  DATA__GLOBAL_NAV = 'globalNav',
  ASSET_DATA = 'assetData',
  DATA__WORKFLOW_INSTANCE_ID = 'worflowInstanceId',
  DATA__WORKFLOW_INSTANCE_STATE = 'worflowInstanceState',
  DATA__INITIAL_SUPPLIES = 'initialSupplies',
  DATA__ASSET_DATA_DEPRECATED = 'assetDataDeprecated',
  DATA__REFERENCE_DATA_SCHEMA_ID = 'withReferenceData',
  DATA__REFERENCE_DATA_OPTIONS_TYPE = 'referenceDataOptionsType',
  DATA__EXTERNAL_IMPORTER = 'externalImporter',
  DATA__TX_SIGNER_ID = 'txSignerId',
  DATA__WALLET_USED = 'walletUsed',
  DATA__NEXT_STATUS = 'nextStatus',
  DATA__TRANSACTION = 'transaction',
  DATA__TRANSACTION__STATUS = 'status',
  DATA__TRANSACTION__ID = 'transactionId',
  DATA__IS_LEDGER_TX = 'isLedgerTx',
  EXTENSION_ADDRESS = 'extensionAddress',
  ASSET_CLASSES = 'assetClasses',
  TOKEN_STATES = 'tokenStates',
  TOTAL_SUPPLY = 'totalSupply',
  ASSET_CLASSES_ON_CHAIN = 'assetClassesOnChain',
  ASSET_CLASSES_ON_CHAIN_NAME = 'name',
  ASSET_CLASSES_ON_CHAIN_TOTAL_SUPPLY = 'totalSupply',
  ASSET_CLASSES_ON_CHAIN_PERCENTAGE = 'percentage',
  ASSET_CLASSES_ON_CHAIN_STATES = 'states',
  ASSET_CLASSES_ON_CHAIN_STATES_NAME = 'name',
  ASSET_CLASSES_ON_CHAIN_STATES_TOTAL_SUPPLY = 'totalSupply',
  ASSET_CLASSES_ON_CHAIN_STATES_ERC20_COMPLIANT = 'erc20Compliant',
  ASSET_CLASSES_ON_CHAIN_STATES_PARTITION = 'partition',
  CYCLES = 'cycles',
  ISSUER = 'issuer',
  OWNER = 'owner',
  INVESTORS = 'investors',
  NOTARIES = 'notaries',
  USER_RELATED_DATA = 'userRelatedData',
  ASSET_TEMPLATE_ID = 'assetTemplateId',
  ISSUER_ID = 'issuerId',
  OWNER_ADDRESS = 'address',
  OWNER_OWNERSHIP_TRANSFERRED = 'ownershipTransferred',
  AUM = 'aum',
  REFERENCE_DATA = 'referenceData',
  REFERENCE_DATA_OPTIONS = 'referenceDataOptions',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum TokenUnit {
  token = 'token',
  tonne = 'tonne',
}

export interface AssetStateOnChainData {
  [keys.ASSET_CLASSES_ON_CHAIN_STATES_NAME]: TokenState;
  [keys.ASSET_CLASSES_ON_CHAIN_STATES_TOTAL_SUPPLY]: number;
  [keys.ASSET_CLASSES_ON_CHAIN_STATES_ERC20_COMPLIANT]: boolean;
  [keys.ASSET_CLASSES_ON_CHAIN_STATES_PARTITION]: string;
}

export const AssetStateOnChainDataExample: AssetStateOnChainData = {
  [keys.ASSET_CLASSES_ON_CHAIN_STATES_NAME]: TokenState.ISSUED,
  [keys.ASSET_CLASSES_ON_CHAIN_STATES_TOTAL_SUPPLY]: 100000,
  [keys.ASSET_CLASSES_ON_CHAIN_STATES_ERC20_COMPLIANT]: true,
  [keys.ASSET_CLASSES_ON_CHAIN_STATES_PARTITION]:
    '0x697373756564000000000000636c617373610000000000000000000000000000',
};

export interface AssetClassOnChainData {
  [keys.ASSET_CLASSES_ON_CHAIN_NAME]: string;
  [keys.ASSET_CLASSES_ON_CHAIN_TOTAL_SUPPLY]: number;
  [keys.ASSET_CLASSES_ON_CHAIN_PERCENTAGE]: number;
  [keys.ASSET_CLASSES_ON_CHAIN_STATES]: Array<AssetStateOnChainData>;
}

export const AssetClassOnChainDataExample: AssetClassOnChainData = {
  [keys.ASSET_CLASSES_ON_CHAIN_NAME]: 'a',
  [keys.ASSET_CLASSES_ON_CHAIN_TOTAL_SUPPLY]: 1034000,
  [keys.ASSET_CLASSES_ON_CHAIN_PERCENTAGE]: 0.24,
  [keys.ASSET_CLASSES_ON_CHAIN_STATES]: [AssetStateOnChainDataExample],
};

export interface ContractDeployed {
  deployed: boolean;
  address: string;
}
export interface Token {
  [keys.TOKEN_ID]: string;
  [keys.TENANT_ID]: string;
  [keys.NAME]: string;
  [keys.CREATED_AT]?: Date;
  [keys.UPDATED_AT]?: Date;
  [keys.SYMBOL]: string;
  [keys.DEFAULT_DEPLOYMENT]: string | null;
  [keys.STANDARD]: SmartContract;
  [keys.PICTURE]?: string;
  [keys.DESCRIPTION]?: string;
  [keys.BANK_ACCOUNT]?: object;
  [keys.DEFAULT_CHAIN_ID]: string;
  [keys.DEPLOYMENTS]: Array<Deployment>;
  [keys.ASSET_TEMPLATE_ID]: string;
  [keys.ISSUER_ID]: string;
  [keys.CREATOR_ID]?: string;
  [keys.REVIEWER_ID]?: string;
  [keys.ASSET_DATA]?: AssetData;
  [keys.DATA]: {
    [keys.DATA__ASSET_CREATION_FLOW]?: AssetCreationFlow;
    // start deprecated
    assetData?: {
      assetCreationFlow: AssetCreationFlow;
      issuerId: string;
      creatorId: string;
      reviewerId: string;
    };
    // end deprecated
    [keys.DATA__KYC_TEMPLATE_ID]: string;
    [keys.DATA__BYPASS_KYC_CHECKS]?: boolean;
    [keys.DATA_DEPRECATED_CHAIN_ID]?: boolean;
    [keys.DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL]?: boolean;
    [keys.DATA__AUTOMATE_HOLD_CREATION]?: boolean;
    [keys.DATA__AUTOMATE_SETTLEMENT]?: boolean;
    [keys.DATA__AUTOMATE_RETIREMENT]?: boolean;
    [keys.DATA__AUTOMATE_FORCE_BURN]?: Array<OrderSide>;
    [keys.DATA__CERTIFICATE_ACTIVATED]?: boolean; // DEPRECATED (replaced by certificateType)
    [keys.DATA__CERTIFICATE_TYPE_AS_NUMBER]?: number;
    [keys.DATA__UNREGULATED_ERC20_TRANSFERS_ACTIVATED]?: boolean;
    [keys.DATA__CUSTOM_EXTENSION_ADDRESS]?: string;
    [keys.DATA__INITIAL_OWNER_ADDRESS]?: string;
    [keys.DATA__GLOBAL_NAV]?: number;
    [keys.DATA__WORKFLOW_INSTANCE_ID]?: number;
    [keys.DATA__WORKFLOW_INSTANCE_STATE]?: string;
    [keys.DATA__INITIAL_SUPPLIES]?: Array<InitialSupply>;
    [keys.DATA__ASSET_DATA_DEPRECATED]?: any;
    [keys.DATA__REFERENCE_DATA_SCHEMA_ID]?: string;
    [keys.DATA__REFERENCE_DATA_OPTIONS_TYPE]?: string;
    [keys.DATA__EXTERNAL_IMPORTER]?: ExternalImporter;
    [keys.DATA__TX_SIGNER_ID]?: string;
    [keys.DATA__WALLET_USED]?: Wallet;
    [keys.DATA__NEXT_STATUS]?: string;
    [keys.DATA__TRANSACTION]?: {
      [key: string]: {
        [keys.DATA__TRANSACTION__ID]: string;
        [keys.DATA__TRANSACTION__STATUS]: string;
      };
    };
    [keys.DATA__IS_LEDGER_TX]?: boolean;
  };
  [keys.EXTENSION_ADDRESS]?: string;
  [keys.ASSET_CLASSES]?: Array<string>;
  [keys.TOKEN_STATES]?: Array<TokenState>;
  [keys.TOTAL_SUPPLY]?: number;
  [keys.ASSET_CLASSES_ON_CHAIN]?: Array<AssetClassOnChainData>;
  [keys.CYCLES]?: Array<AssetCycleInstance>;
  [keys.ISSUER]?: ReducedUser;
  [keys.OWNER]?: {
    [keys.OWNER_ADDRESS]?: string;
    [keys.OWNER_OWNERSHIP_TRANSFERRED]?: boolean;
  };
  [keys.INVESTORS]?: Array<User>;
  [keys.NOTARIES]?: Array<User>;
  [keys.USER_RELATED_DATA]?: UserTokenData;
  [keys.REFERENCE_DATA]?: any;
  [keys.REFERENCE_DATA_OPTIONS]?: any;
}

export const TokenExample: Token = {
  [keys.TOKEN_ID]: '423baf7e-66fc-4e40-a5d6-4b7384bd665d',
  [keys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.NAME]: 'TokenName',
  [keys.SYMBOL]: 'TokenSymbol',
  [keys.DEFAULT_DEPLOYMENT]: '0xb76b40231c176cd6435f83153796d1af18b4c9a7',
  [keys.STANDARD]: DEFAULT_HYBRID_TOKEN_STANDARD,
  [keys.PICTURE]: 'assetImage.png',
  [keys.DESCRIPTION]: 'Shares of a real estate fund',
  [keys.ASSET_TEMPLATE_ID]: '423baf7e-66fc-4e40-a5d6-4b7384bd856d',
  [keys.BANK_ACCOUNT]: {
    bank: 'BNP Paribas',
    IBAN: 'FR7630001007941234567890185',
    account: '12345678901',
  },
  [keys.ISSUER_ID]: '423baf7e-66fc-4e40-a5d6-4b7384bd856d',
  [keys.ASSET_TEMPLATE_ID]: '423baf7e-66fc-4e40-a5d6-4b7384bd856d',

  [keys.DEFAULT_CHAIN_ID]: '466442583',
  [keys.DEPLOYMENTS]: [DeploymentExample],
  [keys.DATA]: {
    [keys.DATA__KYC_TEMPLATE_ID]: '53e059ee-45f0-4335-8c5a-ac2df21b9df3',
    [keys.DATA__BYPASS_KYC_CHECKS]: false,
    [keys.DATA__WORKFLOW_INSTANCE_ID]: 1662,
    [keys.DATA__WORKFLOW_INSTANCE_STATE]: 'deployed',
  },
  [keys.ASSET_CLASSES]: ['classA', 'classB', 'classI'],
  [keys.TOKEN_STATES]: [
    TokenState.LOCKED,
    TokenState.RESERVED,
    TokenState.ISSUED,
    TokenState.COLLATERAL,
  ],
  [keys.TOTAL_SUPPLY]: 1400500,
  [keys.ASSET_CLASSES_ON_CHAIN]: [AssetClassOnChainDataExample],
};

export const TokenExtendedExample: Token = {
  ...TokenExample,
  [keys.ISSUER]: ReducedUserExample,
  [keys.INVESTORS]: [UserExtendedForTokenExample],
  [keys.NOTARIES]: [],
  [keys.USER_RELATED_DATA]: UserTokenDataExample,
};

export const TokenInputDataExample: any = {
  [keys.DATA__KYC_TEMPLATE_ID]: '53e059ee-45f0-4335-8c5a-ac2df21b9df3',
  [keys.DATA__BYPASS_KYC_CHECKS]: false,
  exampleKey: 'exampleValue',
};

export const AssetExample: Token = TokenExample;

export type Aum = {
  t: Date;
  quantity: number;
  price: number;
};
