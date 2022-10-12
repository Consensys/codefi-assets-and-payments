import ErrorService from 'src/utils/errorService';
import { LinkState } from 'src/types/workflow/workflowInstances/link';
import { Wallet, WalletExample } from 'src/types/wallet';
import {
  UserTokenData,
  UserProjectData,
  UserTokenDataExample,
  UserProjectDataExample,
} from 'src/types/userEntityData';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { FunctionName } from 'src/types/smartContract';
import { Token } from './token';
import { Project } from './project';
import {
  keys as ClientKeys,
  ClientApplicationExample,
} from './clientApplication';
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types';
import { Auth0User } from './authentication';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { checkValidEnumValue, getEnumValues } from 'src/utils/enumUtils';

export enum EntityEnum {
  ids = 'ids',
  name = 'name',
  email = 'email',
  firstConnectionCode = 'firstConnectionCode',
  superUserId = 'superUserId',
  userType = 'userType',
  userTypes = 'userTypes',
}

export const USER_ID_LENGTH = 36;

export enum DvpUserType {
  SENDER = 'SENDER',
  RECIPIENT = 'RECIPIENT',
}

export enum UserType {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  ISSUER = 'ISSUER',
  UNDERWRITER = 'UNDERWRITER',
  BROKER = 'BROKER',
  AGENT = 'AGENT',
  INVESTOR = 'INVESTOR',
  VEHICLE = 'VEHICLE',
  NOTARY = 'NOTARY',
  VERIFIER = 'VERIFIER',
  NAV_MANAGER = 'NAV_MANAGER',
}

export enum AccountType {
  FRONT = 'FRONT',
  BACK = 'BACK',
}

export enum UserNature {
  NATURAL = 'NATURAL',
  LEGAL = 'LEGAL',
}

export enum keys {
  TENANT_ID = 'tenantId',
  ACCESS_TYPE = 'accessType',
  WALLETS = 'wallets',
  ADDRESS = 'address',
  AUTH_ID = 'authId',
  COMPANY = 'company',
  CREATED_AT = 'createdAt',
  DATA = 'data',
  DATA__SUB_TENANT_ID = 'subTenantId',
  DATA__KYC_TEMPLATE_ID = 'kycTemplateId',
  DATA__COMPANY = 'company',
  DATA__PROFILE_PICTURE = 'userProfilePicture',
  DATA__REGISTRATION_EMAIL_SENT = 'registrationEmailSent',
  DATA__REGISTRATION_LINK = 'registrationLink',
  DATA__STORED_ETH_SERVICE_TYPE = 'storedEthServiceType',
  DATA__LOAN_AGREEMENTS_SIGNED = 'loanAgreementsSigned',
  DATA__BYPASS_KYC_CHECKS = 'bypassKycChecks',
  DATA__CLIENT_NAME = 'clientName',
  DATA__E2E_FLAG = 'e2eTestUser',
  DATA__USER_MIGRATED_IN_OAUTH2 = 'userMigratedInAuthO2',
  DEFAULT_WALLET = 'defaultWallet',
  LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID = 'docuSignId',
  EMAIL = 'email',
  FIRST_CONNECTION_CODE = 'firstConnectionCode',
  FIRST_NAME = 'firstName',
  LANGUAGE = 'language',
  LAST_NAME = 'lastName',
  PHONE = 'phone',
  PICTURE = 'picture',
  PREFIX = 'prefix',
  SUPER_USER_ID = 'superUserId',
  UPDATED_AT = 'updatedAt',
  USER_ID = 'id',
  USER_NATURE = 'userNature',
  USER_TYPE = 'userType',
  LINK = 'link',
  VEHICLES = 'vehicles',
  TOKEN_RELATED_DATA = 'tokenRelatedData',
  PROJECT_RELATED_DATA = 'projectRelatedData',
}

export class UserData {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  [keys.DATA__SUB_TENANT_ID]?: string;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  [keys.DATA__KYC_TEMPLATE_ID]?: string;
  @IsOptional()
  @IsBoolean()
  [keys.DATA__BYPASS_KYC_CHECKS]?: boolean;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  [keys.DATA__PROFILE_PICTURE]?: string;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  [keys.DATA__COMPANY]?: string;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  [keys.DATA__STORED_ETH_SERVICE_TYPE]?: string;
  @IsOptional()
  @IsBoolean()
  [keys.DATA__REGISTRATION_EMAIL_SENT]?: boolean;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  [keys.DATA__CLIENT_NAME]?: string;
  [keys.USER_TYPE]?: UserType;
  [keys.DATA__REGISTRATION_LINK]?: string;
  [keys.DATA__LOAN_AGREEMENTS_SIGNED]?: string[];
  [keys.DATA__USER_MIGRATED_IN_OAUTH2]?: boolean;
}

export interface User {
  [keys.USER_ID]: string;
  [keys.TENANT_ID]: string;
  [keys.AUTH_ID]?: string | null;
  [keys.SUPER_USER_ID]: string | null;
  [keys.USER_NATURE]: UserNature;
  [keys.USER_TYPE]: UserType;
  [keys.FIRST_NAME]: string;
  [keys.LAST_NAME]: string;
  [keys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]?: string; // FIXME: to be deprecated in IAM API and renamed LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID
  [keys.EMAIL]: string;
  [keys.FIRST_CONNECTION_CODE]?: string;
  [keys.UPDATED_AT]?: Date;
  [keys.CREATED_AT]: Date;
  [keys.COMPANY]?: string;
  [keys.DEFAULT_WALLET]?: string;
  [keys.WALLETS]?: Array<Wallet>;
  [keys.DATA]: UserData;
  [keys.LANGUAGE]?: string;
  [keys.LINK]?: Link;
  [keys.ADDRESS]?: string; // Renamed version of DEFAULT_WALLET
  [keys.VEHICLES]?: Array<User>;
  [keys.TOKEN_RELATED_DATA]?: Token | UserTokenData;
  [keys.PROJECT_RELATED_DATA]?: Project | UserProjectData;
}

export const tenantIdExample = ClientApplicationExample[ClientKeys.CLIENT_ID]; // client application ID is used as tenant ID
export const userIdExample = '3611ab62-94a9-4782-890f-221a64518c83';
export const exampleFirstName = 'John';
export const exampleLastName = 'Doe';
export const exampleEmail = 'john.doe@investor.com';
export const authSubIdExample = '5fe0ce446843db0077c47e43';
export const authIdExample = `auth0|${authSubIdExample}`;
export const UserExample: User = {
  [keys.USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [keys.TENANT_ID]: tenantIdExample,
  [keys.AUTH_ID]: authIdExample,
  [keys.FIRST_CONNECTION_CODE]: 'po2LcDbR-cSCoVZ7F-TCmVs0nx-kLotkoAG',
  [keys.SUPER_USER_ID]: null,
  [keys.USER_TYPE]: UserType.INVESTOR,
  [keys.USER_NATURE]: UserNature.NATURAL,
  [keys.EMAIL]: exampleEmail,
  [keys.FIRST_NAME]: exampleFirstName,
  [keys.LAST_NAME]: exampleLastName,
  [keys.DEFAULT_WALLET]: '0xd200b5d89f719473573be585eadedc8c916e5515',
  [keys.WALLETS]: [WalletExample],
  [keys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]:
    '767db668-ad45-4100-ac57-e6d39a9f7162',
  [keys.DATA]: {},
  [keys.CREATED_AT]: new Date('December 19, 1990 08:24:00'),
  [keys.UPDATED_AT]: new Date('December 19, 1990 08:24:00'),
};

export const UserExtendedForTokenExample: User = {
  ...UserExample,
  [keys.TOKEN_RELATED_DATA]: UserTokenDataExample,
};

export const UserExtendedForProjectExample: User = {
  ...UserExample,
  [keys.PROJECT_RELATED_DATA]: UserProjectDataExample,
};

export interface ReducedUser {
  [keys.USER_ID]: string;
  [keys.FIRST_NAME]: string;
  [keys.LAST_NAME]: string;
  [keys.EMAIL]: string;
  [keys.PHONE]?: string;
  [keys.ADDRESS]?: string; // Renamed version of DEFAULT_WALLET
  [keys.PICTURE]?: string;
  [keys.PREFIX]?: string;
  [keys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]?: string;
  [keys.LINK]?: Link;
}

export const ReducedUserExample: ReducedUser = {
  [keys.USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [keys.FIRST_NAME]: exampleFirstName,
  [keys.LAST_NAME]: exampleLastName,
  [keys.EMAIL]: exampleEmail,
  [keys.PHONE]: '',
  [keys.ADDRESS]: '0xd200b5d89f719473573be585eadedc8c916e5515',
  [keys.PICTURE]: '',
  [keys.PREFIX]: '',
  [keys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]:
    '767db668-ad45-4100-ac57-e6d39a9f7162',
};

export const Auth0UserExample: Auth0User = {
  userId: authIdExample,
  email: exampleEmail,
  emailVerified: false,
  name: exampleFirstName,
  nickname: 'test.g53f2bgf2c',
  familyName: exampleLastName,
  givenName: `${exampleFirstName} ${exampleLastName}`,
  // identities: [
  //   {
  //     connection: 'Username-Password-Authentication',
  //     user_id: authSubIdExample,
  //     provider: 'auth0',
  //     isSocial: false,
  //   },
  // ],
  picture:
    'https://s.gravatar.com/avatar/5f59420c533e3718fa602245827a3b9c?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fte.png',
  appMetadata: {
    registered: true,
    // [tenantIdExample: string]: {
    //   entityId: userIdExample, // TODO: will be renamed entityIdExample after integration with Entity-Api
    // },
    products: {
      [ProductsEnum.assets]: true,
    },
  },
  lastIp: '193.169.64.89',
  lastLogin: '2021-10-18T11:58:48.283Z',
  loginsCount: 1590,
  createdAt: '2020-12-21T16:33:08.984Z',
  updatedAt: '2020-12-21T16:33:08.984Z',
};

export const validEntityLinkStatusForUserType: {
  [usertype: string]: Array<string>;
} = {
  [UserType.ISSUER]: [LinkState.ISSUER],
  [UserType.UNDERWRITER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.BROKER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.AGENT]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.INVESTOR]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.VEHICLE]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.NOTARY]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.VERIFIER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.NAV_MANAGER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
};

export const validPlatformLinkStatusForUserType: {
  [usertype: string]: Array<string>;
} = {
  [UserType.ISSUER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.UNDERWRITER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.BROKER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.AGENT]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.INVESTOR]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.VEHICLE]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.NOTARY]: [LinkState.NOTARY],
  [UserType.VERIFIER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
  [UserType.NAV_MANAGER]: [
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.REJECTED,
  ],
};

export const linkingFunctionForUserType: {
  [usertype: string]: FunctionName;
} = {
  [UserType.UNDERWRITER]: FunctionName.KYC_INVITE,
  [UserType.BROKER]: FunctionName.KYC_INVITE,
  [UserType.AGENT]: FunctionName.KYC_INVITE,
  [UserType.INVESTOR]: FunctionName.KYC_INVITE,
  [UserType.VEHICLE]: FunctionName.KYC_INVITE,
  [UserType.ISSUER]: FunctionName.KYC_ADD_ISSUER,
  [UserType.NOTARY]: FunctionName.KYC_ADD_NOTARY,
  [UserType.VERIFIER]: FunctionName.KYC_ADD_VERIFIER,
  [UserType.NAV_MANAGER]: FunctionName.KYC_ADD_NAV_MANAGER,
};

/**
 * [Checks if user data includes an E2E test flag]
 */
export const isE2eTestUserData = (data: any): boolean => {
  if (data && data?.[keys.DATA__E2E_FLAG]) {
    return true;
  }
  {
    return false;
  }
};

/**
 * [Checks if user is an E2E test user (if so, we won't send the email)]
 */
export const isE2eTestUser = (user: User): boolean => {
  if (user?.[keys.DATA] && isE2eTestUserData(user?.[keys.DATA])) {
    return true;
  }
  {
    return false;
  }
};

/**
 * [Check is userType is a platform administrator userType (SuperAdmin, Admin, Issuer)]
 */
export const isAdministratorUserType = (userType: UserType): boolean => {
  if (
    userType === UserType.SUPERADMIN ||
    userType === UserType.ADMIN ||
    userType === UserType.ISSUER
  ) {
    return true;
  } else {
    return false;
  }
};

export const maskUser = (user: User) => {
  return {
    [keys.USER_ID]: user[keys.USER_ID],
    [keys.EMAIL]: user[keys.EMAIL],
  };
};

export const checkValidUserType = (userType: UserType): boolean => {
  if (!checkValidEnumValue(UserType, userType)) {
    ErrorService.throwError(
      `Invalid input for 'userType'. ${userType} doesn't belong to list of authorized userTypes (${JSON.stringify(
        getEnumValues(UserType),
      )}).`,
    );
  }

  return true;
};

export const checkValidUserNature = (userNature: UserNature): boolean => {
  if (!checkValidEnumValue(UserNature, userNature)) {
    ErrorService.throwError(
      `Invalid input for 'userNature'. ${userNature} doesn't belong to list of authorized userNatures (${JSON.stringify(
        getEnumValues(UserNature),
      )}).`,
    );
  }

  return true;
};
