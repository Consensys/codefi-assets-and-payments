import {
  IWorkflowInstance,
  TokenState,
} from 'routes/Issuer/AssetIssuance/templatesTypes';

export enum UserType {
  ISSUER = 'ISSUER',
  INVESTOR = 'INVESTOR',
  VEHICLE = 'VEHICLE',
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  VERIFIER = 'VERIFIER',
  UNDERWRITER = 'UNDERWRITER',
  NAV_MANAGER = 'NAV_MANAGER',
}

export enum EntityType {
  TOKEN = 'TOKEN',
  ISSUER = 'ISSUER',
  ADMIN = 'ADMIN',
}

export enum UserAccessType {
  READWRITE = 'READWRITE',
  READONLY = 'READONLY',
  CUSTOM = 'CUSTOM',
}

export enum AccountType {
  FRONT = 'FRONT',
  BACK = 'BACK',
}

export enum UserNature {
  LEGAL = 'LEGAL',
  NATURAL = 'NATURAL',
}

export enum WalletType {
  VAULT = 'vault',
  LEDGER = 'ledger',
}

export interface IWallet {
  walletAddress: string;
  walletType: WalletType;
  data?: any;
}

export interface IUserData {
  registrationLink: string;
  kycTemplateId?: string;
  bypassKycChecks?: boolean;
  userProfilePicture?: string;
  company?: string;
  externalWallet?: string;
  storedEthServiceType?: string;
  registrationEmailSent?: boolean;
  loanAgreementsSigned?: string[];
  clientName?: string;
}

export interface IERC1400StateBalance {
  name: TokenState;
  balance: number;
  spendableTotal: number;
}

export interface IERC1400Balances {
  classes: Array<{
    name: string;
    balances: IERC1400StateBalance;
  }>;
  total: number;
}

export interface IUserTokenData {
  link?: ILink;
  balances?: IERC1400Balances;
  tokenActions?: Array<IWorkflowInstance>;
  vehicles?: Array<IUser>;
}

export interface IUser {
  id: string;
  authId?: string | null;
  superUserId: string | null;
  userNature: UserNature;
  userType: UserType;
  accessType?: UserAccessType;
  firstName: string;
  lastName: string;
  docuSignId?: string; // FIXME: to be deprecated in IAM API and renamed LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID
  email: string;
  firstConnectionCode?: string;
  updatedAt?: Date;
  createdAt: Date;
  bankAccount?: any;
  defaultWallet?: string;
  wallets?: Array<IWallet>;
  data: IUserData;
  language?: string;
  phone?: string;
  picture?: string;
  prefix?: string;
  link?: ILink;
  address?: string; // Renamed version of DEFAULT_WALLET
  vehicles?: Array<IUser>;
  tokenRelatedData?: IUserTokenData;
}

export enum LinkStatus {
  ISSUER = 'issuer',
  NOTARY = 'notary',
  VERIFIER = 'verifier',
  INVITED = 'invited',
  KYCSUBMITTED = 'kycSubmitted',
  VALIDATED = 'validated',
  KYCINREVIEW = 'KycInReview',
  REJECTED = 'rejected',
  NO_LINK_ADMIN = 'noLinkAdmin',
  NO_LINK_ISSUER = 'noLinkIssuer',
}
export interface ILink {
  id: number;
  userId: string;
  entityId: string;
  walletAddress: string;
  state: LinkStatus;
  name: string;
  entityType: EntityType;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}
