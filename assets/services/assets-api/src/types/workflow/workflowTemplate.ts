import { TransitionTemplate } from './transition';
import { WorkflowType } from './workflowInstances';
import { UserType } from '../user';
import { LinkState } from './workflowInstances/link';
import { FunctionName } from '../smartContract';

export const NOT_STARTED = '__notStarted__';

export enum keys {
  DEFAULT_WORKFLOWS = 'defaultProcesses',
  ID = 'id',
  TENANT_ID = 'tenantId',
  NAME = 'name',
  WORKFLOW_TYPE = 'workflowType',
  ROLES = 'roles',
  STATES = 'states',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DEFAULT_WORKFLOWS_NAME = 'defaultProcessesName',
  WORKFLOWS = 'processes',
  WORKFLOW_IDS = 'processesIds',
  TRANSITION_TEMPLATES = 'transitionTemplates',
  USER_ID = 'userId',
  LEGAL_AGREEMENT_TEMPLATE_ID = 'legalAgreementTemplateId',
  PROCESS_ORDER = 'processOrder',
  INVESTOR_MAP = 'mapStatusToInvestorAction',
  RECIPIENT_MAP = 'mapStatusToRecipientAction',
  ISSUER_MAP = 'mapStatusToIssuerAction',
  NOTARY_MAP = 'mapStatusToNotaryAction',
  VERIFIER_MAP = 'mapStatusToVerifierAction',
  NAV_MANAGER_MAP = 'mapStatusToNavManagerAction',
}

export enum WorkflowName {
  KYC = 'kyc',
  PRE_ISSUANCE = 'preissuance',
  ISSUANCE = 'issuance',
  FUNGIBLE_BASICS = 'fungibleBasics',
  NON_FUNGIBLE_BASICS = 'nonfungibleBasics',
  HYBRID_BASICS = 'hybridBasics',
  ASSET_CREATION = 'assetCreation',
  ASSET_PRIMARY_TRADE = 'assetPrimaryTrade',
  NAV = 'nav',
  ASSET_SECONDARY_TRADE = 'assetSecondaryTrade',
  OFFER = 'offer',
  EVENT = 'event',
}

export const ALL_ROLES = [
  UserType.SUPERADMIN,
  UserType.ADMIN,
  UserType.ISSUER,
  UserType.INVESTOR,
  UserType.VEHICLE,
  UserType.NOTARY,
  UserType.VERIFIER,
  UserType.NAV_MANAGER,
];

export interface WorkflowTemplate {
  [keys.ID]: number;
  [keys.TENANT_ID]: string;
  [keys.NAME]: WorkflowName;
  [keys.WORKFLOW_TYPE]: WorkflowType;
  [keys.ROLES]: string[];
  [keys.STATES]: string[];
  [keys.TRANSITION_TEMPLATES]: TransitionTemplate[];
  [keys.CREATED_AT]?: Date;
  [keys.UPDATED_AT]?: Date;
}

export const workflowTemplateExample: WorkflowTemplate = {
  [keys.ID]: 1,
  [keys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.NAME]: WorkflowName.KYC,
  [keys.WORKFLOW_TYPE]: WorkflowType.LINK,
  [keys.ROLES]: ALL_ROLES,
  [keys.STATES]: [
    NOT_STARTED,
    LinkState.INVITED,
    LinkState.KYCSUBMITTED,
    LinkState.VALIDATED,
    LinkState.ISSUER,
  ],
  [keys.TRANSITION_TEMPLATES]: [
    {
      name: FunctionName.KYC_INVITE,
      fromState: NOT_STARTED,
      toState: LinkState.INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_SUBMIT,
      fromState: LinkState.INVITED,
      toState: LinkState.KYCSUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.KYC_VALIDATE,
      fromState: LinkState.KYCSUBMITTED,
      toState: LinkState.VALIDATED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_VALIDATE,
      fromState: LinkState.KYCSUBMITTED,
      toState: LinkState.VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: NOT_STARTED,
      toState: LinkState.VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: LinkState.INVITED,
      toState: LinkState.VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: LinkState.KYCSUBMITTED,
      toState: LinkState.VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: LinkState.VALIDATED,
      toState: LinkState.INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: LinkState.KYCSUBMITTED,
      toState: LinkState.INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.CREATE_TOKEN,
      fromState: NOT_STARTED,
      toState: LinkState.ISSUER,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ADD_NOTARY,
      fromState: NOT_STARTED,
      toState: LinkState.INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ADD_VERIFIER,
      fromState: NOT_STARTED,
      toState: LinkState.INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ADD_NAV_MANAGER,
      fromState: NOT_STARTED,
      toState: LinkState.INVITED,
      role: UserType.ISSUER,
    },
  ],
  [keys.CREATED_AT]: new Date('December 17, 1995 03:24:00'),
  [keys.UPDATED_AT]: new Date('December 17, 1995 03:24:00'),
};
