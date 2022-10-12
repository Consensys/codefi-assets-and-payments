export const DEFAULT_TENANT_ID = 'codefi';
export const DEFAULT_INITIALIZATION_TENANT_ID = `'${
  process.env.DEFAULT_INITIALIZATION_TENANT_ID || DEFAULT_TENANT_ID
}'`;

export enum DATABASE_TABLES {
  TOKENS = 'tokens',
  USERS = 'users',
  ASSET_TEMPLATES = 'asset_templates',
  ASSET_USECASES = 'asset_usecases',
  ASSET_INSTANCES = 'asset_instances',
  ASSET_ELEMENTS = 'asset_elements',
  ASSET_CYCLE_INSTANCES = 'asset_cycle_instances',
  CONFIGS = 'configs',
  PROJECTS = 'projects',
  MAILS = 'mails',
  MAIL_VARIABLES = 'mail_variables',
}

export enum TokenCategory {
  FUNGIBLE = 'FUNGIBLE',
  NONFUNGIBLE = 'NONFUNGIBLE',
  HYBRID = 'HYBRID',
}

export enum AssetType {
  OPEN_END_FUND = 'OPEN_END_FUND',
  CLOSED_END_FUND = 'CLOSED_END_FUND',
  PHYSICAL_ASSET = 'PHYSICAL_ASSET',
  FIXED_RATE_BOND = 'FIXED_RATE_BOND',
  CARBON_CREDITS = 'CARBON_CREDITS',
  CURRENCY = 'CURRENCY',
  COLLECTIBLE = 'COLLECTIBLE',
  // deprecated
  SYNDICATED_LOAN = 'SYNDICATED_LOAN',
}

export enum UserType {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  ISSUER = 'ISSUER',
  UNDERWRITER = 'UNDERWRITER',
  BROKER = 'BROKER',
  INVESTOR = 'INVESTOR',
  VEHICLE = 'VEHICLE',
  NOTARY = 'NOTARY',
  VERIFIER = 'VERIFIER',
  NAV_MANAGER = 'NAV_MANAGER',
}

export enum UserNature {
  NATURAL = 'NATURAL',
  LEGAL = 'LEGAL',
}

export enum AccessType {
  READWRITE = 'READWRITE',
  READONLY = 'READONLY',
  CUSTOM = 'CUSTOM',
}

export enum Prefix {
  Mr = 'Mr',
  Mrs = 'Mrs',
  Ms = 'Ms',
  None = '',
}

export enum EntityType {
  TOKEN = 'TOKEN',
  ISSUER = 'ISSUER',
  ADMIN = 'ADMIN',
}

export enum WalletType {
  VAULT = 'vault',
  LEDGER = 'ledger',
}

export enum AssetElementType {
  string = 'string',
  document = 'document',
  check = 'check',
  radio = 'radio',
  multistring = 'multistring',
  number = 'number',
  date = 'date',
  time = 'time',
  percentage = 'percentage',
  title = 'title',
  target = 'target',
  feeWithType = 'feeWithType',
  periodSelect = 'periodSelect',
  perPercentage = 'perPercentage',
  team = 'team',
  docusign = 'docusign',
  bank = 'bank',
  json = 'json',
}

export enum AssetElementFileType {
  pdf = 'pdf',
  image = 'image',
}

export enum AssetElementStatus {
  mandatory = 'mandatory',
  optional = 'optional',
  conditionalOptional = 'conditionalOptional',
  conditionalMandatory = 'conditionalMandatory',
}

export enum CycleStatus {
  NOT_STARTED = 'NOT_STARTED',
  SUBSCRIPTION_STARTED = 'SUBSCRIPTION_STARTED',
  SUBSCRIPTION_ENDED = 'SUBSCRIPTION_ENDED',
  SETTLED = 'SETTLED',
  CLOSED = 'CLOSED',
}

export enum PrimaryTradeType {
  SUBSCRIPTION = 'subscription',
  REDEMPTION = 'redemption',
}

export const AUTHORIZATION_HEADERS = 'authorization';
