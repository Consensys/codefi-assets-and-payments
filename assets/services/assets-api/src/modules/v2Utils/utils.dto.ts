import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  ValidateNested,
  Max,
  Min,
  IsArray,
  IsString,
} from 'class-validator';

import {
  UserType,
  User,
  UserExample,
  keys as UserKeys,
  tenantIdExample,
} from 'src/types/user';
import { stateRules } from 'src/types/states';
import { keys as TokenKeys, TokenExample } from 'src/types/token';
import { keys as NetworkKeys, NetworkExample } from 'src/types/network';
import {
  keys as ConfigKeys,
  ConfigExample,
  Config,
  ConfigType,
  RegionalFormats,
} from 'src/types/config';
import { keys as WalletKeys, WalletExample } from 'src/types/wallet';
import { keys as TxKeys, TransactionExample } from 'src/types/transaction';
import { SmartContract } from 'src/types/smartContract';
import { keys as HTLCKeys, HTLC, HTLCExample } from 'src/types/htlc';
import {
  keys as ClientKeys,
  ClientApplicationExample,
  ClientApplication,
  TenantType,
  TenantExample,
} from 'src/types/clientApplication';
import {
  PostmanCredentials,
  PostmanCredentialsExample,
} from 'src/types/postman';
import { Type } from 'class-transformer';
import { AssetType } from 'src/types/asset/template';
import { Hold, HoldExample, formatHold } from 'src/types/hold';
import { TenantResponse } from '@codefi-assets-and-payments/ts-types';

export const MAX_TENANTS_COUNT = 50;

export class CleanTestTenantsQueryInput {
  @ApiProperty({
    description: "Set to 'true' if test tenants shall be deleted",
    example: false,
  })
  deleteTestTenants: boolean;
}

export class CleanE2eTestUsersQueryInput {
  @ApiProperty({
    description: "Set to 'true' if e2e test users shall be deleted",
    example: false,
  })
  deleteE2eTestUsers: boolean;
}

export class CleanTenantInitialCodefiUsersParamInput {
  @ApiProperty({
    description: 'ID of tenant, where initial users shall be cleaned',
    example: tenantIdExample,
  })
  tenantId: string;
}

export class ClearInvalidTokenQueryInput {
  @ApiProperty({
    description: "Set to 'true' if invalid tokens shall be deleted",
    example: false,
  })
  deleteInvalidTokens: boolean;
}

export class ClearInvalidUserWalletsQueryInput {
  @ApiProperty({
    description: "Set to 'true' if invalid wallets shall be deprecated",
    example: false,
  })
  deprecateInvalidWallets: boolean;
}

export class CleanAllInvalidKycTemplateIdsQueryInput {
  @ApiProperty({
    description: "Set to 'true' if invalid configs shall be fixed",
    example: false,
  })
  cleanConfigs: boolean;

  @ApiProperty({
    description: "Set to 'true' if invalid users shall be fixed",
    example: false,
  })
  cleanUsers: boolean;

  @ApiProperty({
    description: "Set to 'true' if invalid tokens shall be fixed",
    example: false,
  })
  cleanTokens: boolean;
}

export class ClearInvalidUserWalletsQueryInput2 {
  @ApiProperty({
    description: "Set to 'true' if invalid wallets shall be deprecated",
    example: false,
  })
  deprecateInvalidWallets: boolean;

  @ApiProperty({
    description: "Set to 'true' if public users shall be deleted",
    example: false,
  })
  deleteCodefiUsers: boolean;

  @ApiProperty({
    description: 'Number of invalid wallets to skip',
    example: 200,
  })
  offset: number;

  @ApiProperty({
    description: 'Max number of invalid wallets to return',
    example: 200,
  })
  limit: number;
}

export class CleanAllClientGrantsQueryInput {
  @ApiProperty({
    description:
      'Stringified array of audiences, grants shall be created for, for the client application',
    example: JSON.stringify([
      'https://codefi.eu.auth0.com/api/v2/',
      'https://api.codefi.network',
    ]),
  })
  requiredAudiences: string;

  @ApiProperty({
    description:
      "Set to 'true' if missing grants shall be created in Auth0 (identity provider)",
    example: false,
  })
  createMissingGrants: boolean;

  @ApiProperty({
    description:
      "Set to 'true' if deprecated grants shall be deleted and re-created in Auth0 (identity provider)",
    example: false,
  })
  recreateDeprecatedGrants: boolean;

  @ApiProperty({
    description:
      "Set to 'true' if unused grants shall be deleted in Auth0 (identity provider)",
    example: false,
  })
  deleteUnusedGrants: boolean;
}

export class CleanCodefiUsersQueryInput {
  @ApiProperty({
    description: "Set to 'true' if codefi users shall be deleted",
    example: false,
  })
  deleteCodefiUsers: boolean;
}

export class ClearInvalidUserMetadataQueryInput {
  @ApiProperty({
    description:
      "Set to 'true' if invalid users shall be updated in Auth0 (identity provider)",
    example: false,
  })
  updateInvalidUserMetadata: boolean;

  @ApiProperty({
    description:
      "Flag to add in user's metadata to indicate, he's been migrated",
    example: 'userMigratedInAuthO',
  })
  @IsOptional()
  userMigratedFlag: string;

  @ApiProperty({
    description: "Flag to clean from user's metadata",
    example: 'userMigratedInAuthO',
  })
  @IsOptional()
  userMigratedFlagClean: string;
}

export class WithdrawEtherBodyInput {
  @ApiProperty({
    description: 'Id of user, ETH shall be withdrawn from',
    example: UserExample[UserKeys.USER_ID],
  })
  userId: string;

  @ApiProperty({
    description: 'Address, where ETH shall be sent to',
    example: WalletExample[WalletKeys.WALLET_ADDRESS],
  })
  withdrawalAddress: string;

  @ApiProperty({
    description: 'ID of the chain/network where the ETH shall be withdrawn',
    example: NetworkExample[NetworkKeys.CHAIN_ID],
  })
  @IsOptional()
  chainId: string; // TO BE DEPRECATED (replaced by 'networkKey')

  @ApiProperty({
    description: 'Key of the chain/network where the ETH shall be withdrawn',
    example: NetworkExample[NetworkKeys.KEY],
  })
  @IsOptional()
  networkKey: string;
}

export class WithdrawEtherOutput {
  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Withdrawal of 5 ETH from address ${
      WalletExample[WalletKeys.WALLET_ADDRESS]
    } to address ${
      WalletExample[WalletKeys.WALLET_ADDRESS]
    } has been sucessfully requested (transaction sent)`,
  })
  message: string;
}

export class RetrieveIdentityQueryInput {
  @ApiProperty({
    description: 'Must be a valid user type: ISSUER | INVESTOR',
    example: UserType.INVESTOR,
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description:
      'Identifier to retrieve user at first connection (when his authId - ID provided by auth0 identity provider - is not set yet)',
    example: UserExample[UserKeys.FIRST_CONNECTION_CODE],
  })
  @IsOptional()
  firstConnectionCode: string;
}
export class RetrieveIdentityOutput {
  @ApiProperty({
    description: "Retrieved user (or created one if user didn't exist)",
    example: UserExample,
  })
  @ValidateNested()
  user: User;

  @ApiProperty({
    description:
      "'true' if a new user has been created, 'false' if user already existed and has been retrieved",
    example: true,
  })
  newUser: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'User 3611ab62-94a9-4782-890f-221a64518c83 successfully created',
  })
  message: string;
}

export class RetrievePartitionsQueryInput {
  @ApiProperty({
    description: 'Asset class of token, partitions shall be returned for',
    example: 'classa',
  })
  assetClass: string;
}
export class RetrievePartitionOutput {
  @ApiProperty({
    description: 'Retrieved partition for a given asset class',
    example: {
      locked:
        '0x6c6f636b65640000000000006100000000000000000000000000000000000000',
      reserved:
        '0x7265736572766564000000006100000000000000000000000000000000000000',
      issued:
        '0x6973737565640000000000006100000000000000000000000000000000000000',
      collateral:
        '0x636f6c6c61746572616c00006100000000000000000000000000000000000000',
    },
  })
  @ValidateNested()
  partitions: any;

  @ApiProperty({
    description: 'Response message',
    example: 'Partitions retrieved successfully for class A',
  })
  message: string;
}

export class RetrieveHoldDataQueryInput {
  @ApiProperty({
    description:
      'ID of hold, which data that shall be retrieved from the chain',
    example:
      '0xef877ea3051510dccdc059df5ead85f8fa5b92d7b295ff341279cd5d14abac13',
  })
  holdId: string;

  @ApiProperty({
    description: 'Address of token, where the hold has been created',
    example: TokenExample[TokenKeys.DEFAULT_DEPLOYMENT],
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'Network, where the token is deployed',
    example: NetworkExample[NetworkKeys.KEY],
  })
  networkKey: string;
}
export class RetrieveHoldDataOutput {
  @ApiProperty({
    description: 'Hold data retrieved from the chain',
    example: formatHold(HoldExample),
  })
  @ValidateNested()
  hold: Hold;

  @ApiProperty({
    description: 'Response message',
    example: `Hold data retrieved successfully for hold with id 0xef877ea3051510dccdc059df5ead85f8fa5b92d7b295ff341279cd5d14abac13, on token with address ${
      TokenExample[TokenKeys.DEFAULT_DEPLOYMENT]
    }, on network ${NetworkExample[NetworkKeys.KEY]}`,
  })
  message: string;
}

export class CreateHTLCOutput {
  @ApiProperty({
    description: 'Created HTLC (secret + secret hash)',
    example: HTLCExample,
  })
  @ValidateNested()
  htlc: HTLC;

  @ApiProperty({
    description: 'Response message',
    example: `New HTLC with hash ${
      HTLCExample[HTLCKeys.SECRET_HASH]
    } created successfully (the HTLC secret has not been saved by the API)`,
  })
  message: string;
}

export class RetrieveCertificateQueryInput {
  @ApiProperty({
    description: 'Ethereum address of the transaction sender',
    example: UserExample[UserKeys.DEFAULT_WALLET],
  })
  senderAddress: string;

  @ApiProperty({
    description: 'Ethereum address of the token smart contract',
    example: TokenExample[TokenKeys.DEFAULT_DEPLOYMENT],
  })
  contractAddress: string;

  @ApiProperty({
    description: 'Transaction payload',
    example: '0x...',
  })
  txPayload: string;

  @ApiProperty({
    description: 'Token smart contract name',
    example: TokenExample[TokenKeys.STANDARD],
  })
  tokenStandard: SmartContract;

  @ApiProperty({
    description:
      'Chain ID of Ethereum network where the transaction will be sent',
    example: NetworkExample[NetworkKeys.CHAIN_ID],
  })
  chainId: string; // TO BE DEPRECATED (replaced by 'networkKey')

  @ApiProperty({
    description: 'Key of Ethereum network where the transaction will be sent',
    example: NetworkExample[NetworkKeys.KEY],
  })
  @IsOptional()
  networkKey: string;

  @ApiProperty({
    description: 'Response message',
    example: 'User 3611ab62-94a9-4782-890f-221a64518c83 successfully created',
  })
  message: string;
}

export class RetrieveCertificateOutput {
  @ApiProperty({
    description:
      'Certificate, to inject as last parameter in the transaction, in order to get it validated',
    example: 'Ox...',
  })
  certificate: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Certificate retrieved successfully',
  })
  message: string;
}
export class ListAllTokenStateOutput {
  @ApiProperty({
    description: 'List of token states supported by the API + associated rules',
    example: stateRules,
  })
  @ValidateNested()
  tokenStates: {
    [state: string]: {
      [property: string]: boolean | string;
    };
  };

  @ApiProperty({
    description: 'Response message',
    example: 'Token states listed successfully',
  })
  message: string;
}

export class CreateConfigBodyInput {
  @ApiProperty({
    description: 'Name of the tenant',
    example: 'Codefi Assets',
  })
  name: string;

  @ApiProperty({
    description: 'Logo of the tenant',
    example: 'Config created successfully',
  })
  logo: string;

  @ApiProperty({
    description: 'Mail logo of the tenant',
    example: 'any valid url https://www.exemple.com',
  })
  mailLogo: string;

  @ApiProperty({
    description: 'Mail color of the tenant',
    example: 'any valid hex color #ffffff',
  })
  mailColor: string;

  @ApiProperty({
    description: 'Color for the tenant',
    example: {},
  })
  @IsOptional()
  mainColor: string;

  @ApiProperty({
    description: 'Color for the tenant',
    example: {},
  })
  @IsOptional()
  mainColorLight: string;

  @ApiProperty({
    description: 'Color for the tenant',
    example: {},
  })
  @IsOptional()
  mainColorLighter: string;

  @ApiProperty({
    description: 'Color for the tenant',
    example: {},
  })
  @IsOptional()
  mainColorDark: string;

  @ApiProperty({
    description: 'Color for the tenant',
    example: {},
  })
  @IsOptional()
  mainColorDarker: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: {},
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description: 'Object to store any preferences',
    example: {},
  })
  @IsOptional()
  preferences: any;

  @ApiProperty({
    description: 'Language',
    example: {},
  })
  @IsOptional()
  language: string;

  @ApiProperty({
    description: 'Region',
    example: {},
  })
  @IsOptional()
  @IsEnum(RegionalFormats)
  region: RegionalFormats;

  @IsEnum(AssetType, {
    each: true,
    message: `restrictedAssetTypes must be an array of ${Object.values(
      AssetType,
    )}`,
  })
  @IsArray()
  @IsOptional()
  @ApiProperty({
    required: false,
    isArray: true,
    enum: AssetType,
  })
  restrictedAssetTypes: AssetType[];

  @IsEnum(UserType, {
    each: true,
    message: `restrictedUserTypes must be an array of ${Object.values(
      UserType,
    )}`,
  })
  @IsArray()
  @IsOptional()
  @ApiProperty({
    required: false,
    isArray: true,
    enum: UserType,
  })
  restrictedUserTypes: UserType[];
}

export class CreateConfigOutput {
  @ApiProperty({
    description: 'Configuration file for the front-end application',
    example: ConfigExample,
  })
  @ValidateNested()
  config: Config;

  @ApiProperty({
    description:
      "'true' if a new config has been created, 'false' if config already existed and has been retrieved",
    example: true,
  })
  newConfig: boolean;

  @ApiProperty({
    description: 'Response message',
    example:
      'Config created successfully for tenant MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  })
  message: string;
}

export class RetrieveConfigOutput {
  @ApiProperty({
    description: 'Configuration file for the front-end application',
    example: ConfigExample,
  })
  @ValidateNested()
  config: Config;

  @ApiProperty({
    description: 'Response message',
    example: `Custom config ${
      ConfigExample[ConfigKeys.ID]
    } retrieved successfully for tenant MQp8PWAYYas8msPmfwVppZY2PRbUsFa5`,
  })
  message: string;
}

export class GetConfigQueryInput {
  @ApiProperty({
    description: 'Should fach user configuration',
    example: 'true/false',
  })
  @IsOptional()
  userConfiguration: boolean;

  @ApiProperty({
    description: 'Tenant id of the config we would like to fetch',
    example: 'fQPeYS1BhXQUbEKqBUGv0EXj7mluOfPa',
  })
  @IsOptional()
  tenantId: string;
}

export class ListAllTenantsQueryInput {
  @ApiProperty({
    description: 'Index of first tenant to fetch',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Max amount of orders to fetch',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Max(MAX_TENANTS_COUNT)
  limit: number;
}
export class ListAllTenantsOutput {
  @ApiProperty({
    description: 'Codefi Assets tenants list',
    example: [ClientApplicationExample],
  })
  @ValidateNested()
  tenants: Array<ClientApplication>;

  @ApiProperty({
    description: 'Number of Codefi Assets tenants fetched',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'Total number of Codefi Assets tenants',
    example: 543,
  })
  total: number;

  @ApiProperty({
    description: 'Response message',
    example: '3 Codefi Assets tenants listed successfully',
  })
  message: string;
}

export class RetrieveTenantParamInput {
  @ApiProperty({
    description: 'Id of tenant OR alias',
    example: tenantIdExample,
  })
  tenantIdOrAlias: string;
}

export class RetrieveTenantOutput {
  @ApiProperty({
    description: 'Created tenant',
    example: TenantExample,
  })
  @ValidateNested()
  tenant: TenantResponse;

  @ApiProperty({
    description: 'Client application used in auth0 (identity provider)',
    example: ClientApplicationExample,
  })
  @ValidateNested()
  clientApplications: Array<Partial<ClientApplication>>;

  @ApiProperty({
    description: 'Configuration file for the front-end application',
    example: ConfigExample,
  })
  @ValidateNested()
  config: Config;

  @ApiProperty({
    description: 'Configuration type',
    example: ConfigType.CUSTOM,
  })
  @ValidateNested()
  configType: ConfigType;

  @ApiProperty({
    description: 'Response message',
    example: `Codefi Assets tenant with ID ${
      ClientApplicationExample[ClientKeys.CLIENT_ID]
    } retrieved successfully`,
  })
  message: string;
}

export class CreateTenantBodyInput {
  @ApiProperty({
    description: 'Name of the tenant to create',
    example: 'Codefi',
  })
  tenantName: string;

  @ApiProperty({
    description: 'Email of the tenant admin',
    example: 'admin@tenantName.com',
  })
  email: string;

  @ApiProperty({
    description: 'Password of the tenant admin',
    example: 'xxx-xxx-xxx',
  })
  password: string;

  @ApiProperty({
    description: 'enable market place for the platform',
    example: 'true',
  })
  enableMarketplace: boolean;

  @ApiProperty({
    description: 'The primary use case for the platform',
    example: 'collectables',
  })
  usecase: string;

  @ApiProperty({
    description: 'First name of the tenant admin',
    example: 'Codefi',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the tenant admin',
    example: 'Codefi',
  })
  lastName: string;

  @ApiProperty({
    description: 'Region where the data are stored',
    example: 'EU',
  })
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'Default alias',
    example: 'my-tenant-name.assets.codefi.network',
  })
  defaultAlias: string;

  @ApiProperty({
    description: 'Alias URLs',
    example:
      '["my-tenant-name.assets.codefi.network", "my-tenant-name.payments.codefi.network"]',
  })
  aliases: string[];

  @ApiProperty({
    description:
      'Type of tenant. Not a technical field, it is used for internal accounting.',
    example: 'API',
  })
  tenantType: TenantType;

  @ApiProperty({
    description:
      'Optional parameter to define a default KYC template for a given tenant',
    example: UserExample[UserKeys.DATA][UserKeys.DATA__KYC_TEMPLATE_ID],
  })
  @IsOptional()
  @IsString()
  kycTemplateId: string;

  @ApiProperty({
    description: 'List of Networks (keys) for which we want to create a Faucet',
    example: ['some_network_key', 'some_other_network_key'],
  })
  faucetNetworksKeys?: string[];

  @ApiProperty({
    description:
      "If set to 'true', a machine-to-machine client application shall be created for the tenant",
  })
  @IsOptional()
  createM2mClientApplication: boolean;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class CreateTenantOutput {
  @ApiProperty({
    description: 'Tenant configuration file',
    example: ConfigExample,
  })
  @ValidateNested()
  config: Config;

  @ApiProperty({
    description:
      'Created tenant (client application created in auth0 identity provider)',
    example: TenantExample,
  })
  @ValidateNested()
  tenant: TenantResponse;

  @ApiProperty({
    description:
      "'true' if a new tenant has been created, 'false' if tenant already existed and has been retrieved",
    example: true,
  })
  newTenant: boolean;

  @ApiProperty({
    description: `First user created for the new tenant (user of type ${UserType.ISSUER} for a single issuer platform, or user of type ${UserType.ADMIN} for a multi issuer platform)`,
    example: UserExample,
  })
  @ValidateNested()
  firstUser: User;

  @ApiProperty({
    description:
      'Codefi users created, email addresses have been generated from tenant defautAlias.',
    example: {
      [UserType.ADMIN]: UserExample,
      [UserType.ISSUER]: UserExample,
      [UserType.INVESTOR]: UserExample,
    },
  })
  @ValidateNested()
  codefiUsers: {
    [key: string]: User;
  };

  @ApiProperty({
    description: 'Postman credentials created for the tenant',
    example: PostmanCredentialsExample,
  })
  @ValidateNested()
  postmanCredentials: PostmanCredentials;

  @ApiProperty({
    description:
      'Created M2M client application (created in auth0 identity provider)',
    example: ClientApplicationExample,
  })
  @ValidateNested()
  clientApplication: ClientApplication;

  @ApiProperty({
    description:
      'Created M2M client application (created in auth0 identity provider)',
    example: ClientApplicationExample,
  })
  @ValidateNested()
  m2mClientApplication?: ClientApplication;

  @ApiProperty({
    description: 'An array of created Faucet Ids',
    example: [
      '14ea4e33-0203-49db-b0b6-b092472098bc',
      '125eb4e6-5b5a-4fcd-ace5-372b4bebb0c9',
    ],
  })
  @IsOptional()
  faucetIds?: string[];

  @ApiProperty({
    description: 'Response message',
    example: `Tenant with ID ${
      ClientApplicationExample[ClientKeys.CLIENT_ID]
    } has been successfully created for Codefi`,
  })
  message: string;
}

export class DeleteTenantDataParamInput {
  @ApiProperty({
    description: 'ID of tenant for data cleanup',
    example: ClientApplicationExample[ClientKeys.CLIENT_ID],
  })
  tenantId: string;
}

export class DeleteTenantDataQueryInput {
  @ApiProperty({
    description: "delete tenant's KYC template data?",
    example: false,
    required: false,
  })
  @IsOptional()
  deleteTenantKYCTemplateData: boolean;

  @ApiProperty({
    description: "delete tenant's workflow data?",
    example: true,
    required: false,
  })
  @IsOptional()
  deleteTenantWorkflowData: boolean;

  @ApiProperty({
    description: "delete tenant's Metadata?",
    example: false,
    required: false,
  })
  @IsOptional()
  deleteTenantMetaData: boolean;

  // Options to micro control of Metadata to be deleted
  @ApiProperty({
    description:
      'Do Not delete Tenant Configs (Micro control parameter for MetaData)?',
    example: true,
    required: false,
  })
  @IsOptional()
  doNotDeleteTenantConfigs: boolean;

  @ApiProperty({
    description:
      'Do Not delete Tenant Users (Micro control parameter for MetaData)?',
    example: true,
    required: false,
  })
  @IsOptional()
  doNotDeleteTenantUsers: boolean;

  @ApiProperty({
    description:
      'Do Not delete Tenant Asset Templates (Micro control parameter for MetaData)?',
    example: true,
    required: false,
  })
  @IsOptional()
  doNotDeleteTenantAssetTemplates: boolean;

  @ApiProperty({
    description:
      'Do Not delete Tenant Asset Elements (Micro control parameter for MetaData)?',
    example: true,
    required: false,
  })
  @IsOptional()
  doNotDeleteTenantAssetElements: boolean;
}

export class DeleteTenantDataOutput {
  @ApiProperty({
    description: 'Response message',
    example: `Data for Codefi Assets tenant with ID ${
      ClientApplicationExample[ClientKeys.CLIENT_ID]
    } has been successfully deleted`,
  })
  message: string;
}

export class CreateM2mApplicationForTenantParamInput {
  @ApiProperty({
    description: 'ID of tenant, an m2m client application shall be created for',
    example: ClientApplicationExample[ClientKeys.CLIENT_ID],
  })
  tenantId: string;
}

export class CreateM2mApplicationForTenantOutput {
  @ApiProperty({
    description:
      'Created M2M client application (created in auth0 identity provider)',
    example: ClientApplicationExample,
  })
  @ValidateNested()
  m2mClientApplication: ClientApplication;

  @ApiProperty({
    description:
      "'true' if a new M2M client application has been created, 'false' if M2M client application already existed and has been retrieved",
    example: true,
  })
  newM2mClientApplication: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `M2M client application has been successfully created for tenant with id ${
      ClientApplicationExample[ClientKeys.CLIENT_ID]
    }`,
  })
  message: string;
}
export class DeleteTenantParamInput {
  @ApiProperty({
    description: 'ID of tenant to delete',
    example: ClientApplicationExample[ClientKeys.CLIENT_ID],
  })
  tenantId: string;
}

export class DeleteTenantOutput {
  @ApiProperty({
    description: 'Response message',
    example: `Codefi Assets tenant with ID ${
      ClientApplicationExample[ClientKeys.CLIENT_ID]
    } has been successfully deleted`,
  })
  message: string;
}

export class RetrievePostmanCredentialsParamInput {
  @ApiProperty({
    description:
      'ID of tenant from which we want to retrieve postman credentials',
    example: ClientApplicationExample[ClientKeys.CLIENT_ID],
  })
  tenantId: string;
}

export class RetrievePostmanCredentialsOutput {
  @ApiProperty({
    description: 'Postman credentials created for the tenant',
    example: PostmanCredentialsExample,
  })
  postmanCredentials: PostmanCredentials;
}
