import {
  NOT_STARTED,
  PREISSUANCE_OFFERED,
  PREISSUANCE_DISTRIBUTED,
  ISSUANCE_LOCKED,
  ISSUANCE_RESERVED,
  ISSUANCE_ISSUED,
  ISSUANCE_NOTARIZED,
  ISSUANCE_FINALIZED,
  KYC_ISSUER,
  KYC_INVITED,
  KYC_SUBMITTED,
  KYC_VALIDATED,
  BASICS_EXECUTED,
  INITIALIZED,
  DEPLOYED,
  DEPLOYED_WITH_EXTENSION,
  PAID,
  SUBSCRIBED,
  PAID_SETTLED,
  UNPAID_SETTLED,
  PAID_CANCELLED,
  UNPAID_CANCELLED,
  PAID_REJECTED,
  UNPAID_REJECTED,
  NAV_SUBMITTED,
  NAV_VALIDATED,
  NAV_REJECTED,
  KYC_REJECTED,
  SUBMITTED,
  APPROVED,
  ACCEPTED,
  EXECUTED,
  REJECTED,
  OUTSTANDING,
  PAYING,
  PRE_INITIALIZED,
  PURCHASED,
  NEGOTIATING,
  SCHEDULED,
  SETTLED,
  CANCELLED,
  PRE_INITIALIZED_2,
  PRE_CREATED,
} from './states'
import { UserType, ALL_ROLES } from './roles'

import { WorkflowTemplateDto } from '../models/dto/WorkflowTemplateDto'
import { WorkflowType } from '../models/WorkflowType'

export enum FunctionName {
  KYC_INVITE = 'invite',
  KYC_SUBMIT = 'submitKyc',
  KYC_VALIDATE = 'validateKyc',
  KYC_REJECT = 'rejectKyc',
  KYC_ALLOWLIST = 'allowList',
  KYC_UNVALIDATE = 'unvalidate',
  KYC_ADD_ISSUER = 'addIssuer',
  KYC_ADD_NOTARY = 'addNotary',
  KYC_ADD_VERIFIER = 'addKycVerifier',
  KYC_ADD_NAV_MANAGER = 'addNavManager',
  MINT = 'mint',
  MINT_AND_SET_TOKEN_URI = 'mintAndSetTokenURI',
  TRANSFER = 'transfer',
  BURN = 'burn',
  FORCE_TRANSFER = 'forceTransfer',
  FORCE_BURN = 'forceBurn',
  UPDATE_STATE = 'updateState',
  FORCE_UPDATE_STATE = 'forceUpdateState',
  UPDATE_CLASS = 'updateClass',
  APPROVE = 'approve',
  TRANSFER_FROM = 'transferFrom',
  HOLD = 'hold',
  FORCE_HOLD = 'forceHold',
  EXECUTE_HOLD = 'executeHold',
  RELEASE_HOLD = 'releaseHold',
  OFFER = 'offer', // preIssuance digital asset workflow
  DISTRIBUTE = 'distribute', // preIssuance digital asset workflow
  CREATE_UNLOCKED = 'createUnlockedTokens', // directIssuance digital asset workflow
  CREATE_LOCKED = 'createLockedTokens', // indirectIssuance digital asset workflow
  RESERVE = 'reserveTokens', // indirectIssuance digital asset workflow
  RELEASE = 'releaseTokens', // indirectIssuance digital asset workflow
  DESTROY = 'destroyTokens', // indirectIssuance digital asset workflow
  SEND_NOTARY_RECEIPT = 'sendNotaryReceipt', // indirectIssuance digital asset workflow
  INIT_ASSET_INSTANCE = 'initializeAssetInstance', // asset creation digital asset workflow
  UPDATE_ASSET_INSTANCE = 'updateAssetInstance', // asset creation digital asset workflow
  ADD_ASSET_INSTANCE_CLASS = 'addAssetInstanceClass', // asset creation digital asset workflow
  SUBMIT_ASSET_INSTANCE = 'submitAssetInstance', // asset creation digital asset workflow
  DEPLOY_ASSET_INSTANCE = 'deployAssetInstance', // asset creation digital asset workflow
  REJECT_ASSET_INSTANCE = 'rejectAssetInstance', // asset creation digital asset workflow
  DEPLOY_EXTENSION = 'deployExtension', // asset creation digital asset workflow
  TRANSFER_OWNERSHIP = 'transferOwnership', // asset creation digital asset workflow
  SET_CUSTOM_TOKEN_EXTENSION = 'setCustomTokenExtension',
  ADD_ALLOWLISTED = 'addAllowlisted',
  REMOVE_ALLOWLISTED = 'removeAllowlisted',
  CREATE_TOKEN = 'createToken', // asset creation digital asset workflow
  CREATE_PRIMARY_TRADE_ORDER = 'createPrimaryTradeOrder', // digital asset primary trade workflow
  CANCEL_PRIMARY_TRADE_ORDER = 'cancelPrimaryTradeOrder', // digital asset primary trade workflow
  REJECT_PRIMARY_TRADE_ORDER = 'rejectPrimaryTradeOrder', // digital asset primary trade workflow
  UNREJECT_PRIMARY_TRADE_ORDER = 'unrejectPrimaryTradeOrder', // digital asset primary trade workflow
  VALIDATE_PRIMARY_TRADE_ORDER_PAYMENT = 'validatePrimaryTradeOrder', // digital asset primary trade workflow
  SETTLE_PRIMARY_TRADE_ORDER = 'settlePrimaryTradeOrder', // DEPRECATED
  SETTLE_SUBSCRIPTION_PRIMARY_TRADE_ORDER = 'settleSubscriptionPrimaryTradeOrder', // digital asset primary trade workflow
  SETTLE_REDEMPTION_PRIMARY_TRADE_ORDER = 'settleSRedemptionptionPrimaryTradeOrder', // digital asset primary trade workflow
  SUBMIT_NAV = 'submitNav', // nav workflow
  VALIDATE_NAV = 'validateNav', // nav workflow
  REJECT_NAV = 'rejectNav', // nav workflow
  CREATE_NAV = 'createNav', // nav workflow
  PRE_CREATE_SECONDARY_TRADE_ORDER = 'preCreateTradeOrder', // digital asset secondary trade workflow
  APPROVE_PRE_CREATED_SECONDARY_TRADE_ORDER = 'approvePreCreatedTradeOrder', // digital asset secondary trade workflow
  CREATE_SECONDARY_TRADE_ORDER = 'createTradeOrder', // digital asset secondary trade workflow
  APPROVE_SECONDARY_TRADE_ORDER = 'approveTradeOrder', // digital asset secondary trade workflow
  ACCEPT_SECONDARY_TRADE_ORDER = 'acceptTradeOrder', // digital asset secondary trade workflow
  FORCE_CREATE_ACCEPTED_SECONDARY_TRADE_ORDER = 'forceCreateAcceptedTradeOrder', // digital asset secondary trade workflow
  FORCE_CREATE_PAID_SECONDARY_TRADE_ORDER = 'forceCreatePaidTradeOrder', // digital asset secondary trade workflow
  HOLD_SECONDARY_TRADE_ORDER_DELIVERY = 'holdTradeOrderDelivery', // digital asset secondary trade workflow
  HOLD_SECONDARY_TRADE_ORDER_PAYMENT = 'holdTradeOrderPayment', // digital asset secondary trade workflow
  SEND_SECONDARY_TRADE_ORDER_PAYMENT = 'sendTradeOrderPayment', // digital asset secondary trade workflow
  RECEIVE_SECONDARY_TRADE_ORDER_PAYMENT = 'receiveTradeOrderPayment', // digital asset secondary trade workflow
  SETTLE_ATOMIC_SECONDARY_TRADE_ORDER = 'settleAtomicTradeOrder', // digital asset secondary trade workflow
  SETTLE_NON_ATOMIC_SECONDARY_TRADE_ORDER = 'settleNonAtomicTradeOrder', // digital asset secondary trade workflow
  CANCEL_SECONDARY_TRADE_ORDER = 'cancelTradeOrder', // digital asset secondary trade workflow
  REJECT_SECONDARY_TRADE_ORDER = 'rejectTradeOrder', // digital asset secondary trade workflow
  CREATE_OFFER = 'createOffer', // digital asset offer workflow
  UPDATE_OFFER = 'updateOffer', // digital asset offer workflow
  CANCEL_OFFER = 'cancelOffer', // digital asset offer workflow
  PURCHASE_OFFER = 'purchaseOffer', // digital asset offer workflow
  BIND_OFFER = 'bindOffer', // digital asset offer workflow
  NEGOTIATE = 'negotiate', // digital asset offer workflow
  ACCEPT_TRADE_ORDER_NEGOTIATION = 'acceptTradeOrderNegotiation', // digital asset offer workflow
  SUBMIT_TRADE_ORDER_NEGOTIATION = 'submitTradeOrderNegotiation', // digital asset offer workflow
  CREATE_EVENT = 'createEvent',
  SETTLE_EVENT = 'settleEvent',
  CANCEL_EVENT = 'cancelEvent',
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

// TODO: Move the population outside of workflow-api code. These workflow templates should be populated by a client API.

const kycWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.KYC,
  workflowType: WorkflowType.LINK,
  roles: ALL_ROLES,
  states: [NOT_STARTED, KYC_INVITED, KYC_SUBMITTED, KYC_VALIDATED, KYC_ISSUER],
  transitionTemplates: [
    {
      name: FunctionName.KYC_INVITE,
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_INVITE,
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_INVITE,
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_INVITE,
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_INVITE,
      fromState: KYC_REJECTED,
      toState: KYC_INVITED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_INVITE,
      fromState: KYC_REJECTED,
      toState: KYC_INVITED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_INVITE,
      fromState: KYC_REJECTED,
      toState: KYC_INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_INVITE,
      fromState: KYC_REJECTED,
      toState: KYC_INVITED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_SUBMIT,
      fromState: KYC_INVITED,
      toState: KYC_SUBMITTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_SUBMIT,
      fromState: KYC_INVITED,
      toState: KYC_SUBMITTED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_SUBMIT,
      fromState: KYC_INVITED,
      toState: KYC_SUBMITTED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_SUBMIT,
      fromState: KYC_INVITED,
      toState: KYC_SUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.KYC_SUBMIT,
      fromState: KYC_INVITED,
      toState: KYC_SUBMITTED,
      role: UserType.VEHICLE,
    },
    {
      name: FunctionName.KYC_VALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_VALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_VALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_VALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_VALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_INVITED,
      toState: KYC_REJECTED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_INVITED,
      toState: KYC_REJECTED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_INVITED,
      toState: KYC_REJECTED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_INVITED,
      toState: KYC_REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_INVITED,
      toState: KYC_REJECTED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_SUBMITTED,
      toState: KYC_REJECTED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_SUBMITTED,
      toState: KYC_REJECTED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_SUBMITTED,
      toState: KYC_REJECTED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_SUBMITTED,
      toState: KYC_REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_SUBMITTED,
      toState: KYC_REJECTED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_VALIDATED,
      toState: KYC_REJECTED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_VALIDATED,
      toState: KYC_REJECTED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_VALIDATED,
      toState: KYC_REJECTED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_VALIDATED,
      toState: KYC_REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_REJECT,
      fromState: KYC_VALIDATED,
      toState: KYC_REJECTED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: NOT_STARTED,
      toState: KYC_VALIDATED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_INVITED,
      toState: KYC_VALIDATED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_REJECTED,
      toState: KYC_VALIDATED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: NOT_STARTED,
      toState: KYC_VALIDATED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_INVITED,
      toState: KYC_VALIDATED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_REJECTED,
      toState: KYC_VALIDATED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: NOT_STARTED,
      toState: KYC_VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_INVITED,
      toState: KYC_VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_REJECTED,
      toState: KYC_VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_INVITED,
      toState: KYC_VALIDATED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: NOT_STARTED,
      toState: KYC_VALIDATED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_INVITED,
      toState: KYC_VALIDATED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_SUBMITTED,
      toState: KYC_VALIDATED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_ALLOWLIST,
      fromState: KYC_REJECTED,
      toState: KYC_VALIDATED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_VALIDATED,
      toState: KYC_INVITED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_INVITED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_VALIDATED,
      toState: KYC_INVITED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_INVITED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_VALIDATED,
      toState: KYC_INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_VALIDATED,
      toState: KYC_INVITED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_INVITED,
      role: UserType.VERIFIER,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_VALIDATED,
      toState: KYC_INVITED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.KYC_UNVALIDATE,
      fromState: KYC_SUBMITTED,
      toState: KYC_INVITED,
      role: UserType.ADMIN,
    },
    {
      name: FunctionName.CREATE_TOKEN,
      fromState: NOT_STARTED,
      toState: KYC_ISSUER,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ADD_ISSUER,
      fromState: NOT_STARTED,
      toState: KYC_ISSUER,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ADD_ISSUER,
      fromState: NOT_STARTED,
      toState: KYC_ISSUER,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.KYC_ADD_ISSUER,
      fromState: NOT_STARTED,
      toState: KYC_ISSUER,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.KYC_ADD_NOTARY,
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ADD_VERIFIER,
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.KYC_ADD_NAV_MANAGER,
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.INIT_ASSET_INSTANCE, // bi-partite
      fromState: NOT_STARTED,
      toState: KYC_VALIDATED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.INIT_ASSET_INSTANCE, // tri-partite
      fromState: NOT_STARTED,
      toState: KYC_VALIDATED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.SUBMIT_ASSET_INSTANCE, // tri-partite
      fromState: NOT_STARTED,
      toState: KYC_VALIDATED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.PURCHASE_OFFER, // offer
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.BIND_OFFER, // offer
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.NEGOTIATE, // offer
      fromState: NOT_STARTED,
      toState: KYC_INVITED,
      role: UserType.INVESTOR,
    },
  ],
}

const preIssuanceWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.PRE_ISSUANCE,
  workflowType: WorkflowType.ACTION,
  roles: ALL_ROLES,
  states: [NOT_STARTED, PREISSUANCE_OFFERED, PREISSUANCE_DISTRIBUTED],
  transitionTemplates: [
    {
      name: FunctionName.OFFER,
      fromState: NOT_STARTED,
      toState: PREISSUANCE_OFFERED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.DISTRIBUTE,
      fromState: PREISSUANCE_OFFERED,
      toState: PREISSUANCE_DISTRIBUTED,
      role: UserType.INVESTOR,
    },
  ],
}

const issuanceWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.ISSUANCE,
  workflowType: WorkflowType.ACTION,
  roles: ALL_ROLES,
  states: [
    NOT_STARTED,
    ISSUANCE_LOCKED,
    ISSUANCE_RESERVED,
    ISSUANCE_ISSUED,
    ISSUANCE_FINALIZED,
  ],
  transitionTemplates: [
    {
      name: FunctionName.CREATE_LOCKED,
      fromState: NOT_STARTED,
      toState: ISSUANCE_LOCKED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.DISTRIBUTE,
      fromState: NOT_STARTED,
      toState: ISSUANCE_LOCKED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CREATE_UNLOCKED,
      fromState: NOT_STARTED,
      toState: ISSUANCE_ISSUED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.RESERVE,
      fromState: ISSUANCE_LOCKED,
      toState: ISSUANCE_RESERVED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.RELEASE,
      fromState: ISSUANCE_RESERVED,
      toState: ISSUANCE_ISSUED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.DESTROY,
      fromState: ISSUANCE_ISSUED,
      toState: ISSUANCE_FINALIZED,
      role: UserType.ISSUER,
    },
  ],
}

const fungibleBasicWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.FUNGIBLE_BASICS,
  workflowType: WorkflowType.ACTION,
  roles: ALL_ROLES,
  states: [NOT_STARTED, BASICS_EXECUTED],
  transitionTemplates: [
    {
      name: FunctionName.MINT,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.TRANSFER,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.BURN,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.HOLD,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.TRANSFER_OWNERSHIP,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.TRANSFER_FROM, // Not used yet
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.APPROVE, // Not used yet
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
  ],
}

const nonFungibleBasicWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.NON_FUNGIBLE_BASICS,
  workflowType: WorkflowType.ACTION,
  roles: ALL_ROLES,
  states: [NOT_STARTED, BASICS_EXECUTED],
  transitionTemplates: [
    {
      name: FunctionName.MINT,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.MINT_AND_SET_TOKEN_URI,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.TRANSFER,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.BURN,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.TRANSFER_OWNERSHIP,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.TRANSFER_FROM, // Not used yet
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.APPROVE, // Not used yet
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
  ],
}

const hybridBasicWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.HYBRID_BASICS,
  workflowType: WorkflowType.ACTION,
  roles: ALL_ROLES,
  states: [NOT_STARTED, BASICS_EXECUTED],
  transitionTemplates: [
    {
      name: FunctionName.MINT,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.TRANSFER,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.BURN,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.UPDATE_STATE,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.UPDATE_STATE,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.FORCE_UPDATE_STATE,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.UPDATE_CLASS,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.FORCE_TRANSFER,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.FORCE_BURN,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.HOLD,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.FORCE_HOLD,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.EXECUTE_HOLD,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.RELEASE_HOLD,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.TRANSFER_OWNERSHIP,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SET_CUSTOM_TOKEN_EXTENSION,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.ADD_ALLOWLISTED,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REMOVE_ALLOWLISTED,
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.TRANSFER_FROM, // Not used yet
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.APPROVE, // Not used yet
      fromState: NOT_STARTED,
      toState: BASICS_EXECUTED,
      role: UserType.INVESTOR,
    },
  ],
}

const mataIssuanceWorkflow: WorkflowTemplateDto = {
  name: 'mataIssuanceProcess',
  workflowType: WorkflowType.ACTION,
  roles: ALL_ROLES,
  states: [
    NOT_STARTED,
    ISSUANCE_LOCKED,
    ISSUANCE_RESERVED,
    ISSUANCE_ISSUED,
    ISSUANCE_NOTARIZED,
  ],
  transitionTemplates: [
    {
      name: FunctionName.CREATE_LOCKED,
      fromState: NOT_STARTED,
      toState: ISSUANCE_LOCKED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.DISTRIBUTE,
      fromState: NOT_STARTED,
      toState: ISSUANCE_LOCKED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CREATE_UNLOCKED,
      fromState: NOT_STARTED,
      toState: ISSUANCE_ISSUED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.RESERVE,
      fromState: ISSUANCE_LOCKED,
      toState: ISSUANCE_RESERVED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.RELEASE,
      fromState: ISSUANCE_RESERVED,
      toState: ISSUANCE_ISSUED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SEND_NOTARY_RECEIPT,
      fromState: ISSUANCE_ISSUED,
      toState: ISSUANCE_NOTARIZED,
      role: UserType.NOTARY,
    },
    {
      name: FunctionName.SEND_NOTARY_RECEIPT,
      fromState: ISSUANCE_NOTARIZED,
      toState: ISSUANCE_NOTARIZED,
      role: UserType.NOTARY,
    },
  ],
}

const fundCreationWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.ASSET_CREATION,
  workflowType: WorkflowType.TOKEN,
  roles: ALL_ROLES,
  states: [
    NOT_STARTED,
    PRE_INITIALIZED,
    PRE_INITIALIZED_2,
    INITIALIZED,
    SUBMITTED,
    DEPLOYED,
    DEPLOYED_WITH_EXTENSION,
  ],
  transitionTemplates: [
    {
      name: FunctionName.INIT_ASSET_INSTANCE, // single-partite
      fromState: NOT_STARTED,
      toState: INITIALIZED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.INIT_ASSET_INSTANCE, // bi-partite
      fromState: NOT_STARTED,
      toState: PRE_INITIALIZED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.INIT_ASSET_INSTANCE, // tri-partite
      fromState: NOT_STARTED,
      toState: PRE_INITIALIZED_2,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // single-partite
      fromState: INITIALIZED,
      toState: INITIALIZED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // bi-partite
      fromState: PRE_INITIALIZED,
      toState: PRE_INITIALIZED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // bi-partite
      fromState: SUBMITTED,
      toState: PRE_INITIALIZED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // tri-partite
      fromState: PRE_INITIALIZED_2,
      toState: PRE_INITIALIZED_2,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // tri-partite
      fromState: PRE_INITIALIZED,
      toState: PRE_INITIALIZED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // tri-partite
      fromState: SUBMITTED,
      toState: PRE_INITIALIZED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // tri-partite
      fromState: SUBMITTED,
      toState: SUBMITTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // bi-partite
      fromState: REJECTED,
      toState: PRE_INITIALIZED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.UPDATE_ASSET_INSTANCE, // tri-partite
      fromState: REJECTED,
      toState: PRE_INITIALIZED_2,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.ADD_ASSET_INSTANCE_CLASS,
      fromState: DEPLOYED,
      toState: DEPLOYED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SUBMIT_ASSET_INSTANCE, // bi-partite
      fromState: PRE_INITIALIZED,
      toState: SUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.SUBMIT_ASSET_INSTANCE, // bi-partite
      fromState: SUBMITTED,
      toState: SUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.SUBMIT_ASSET_INSTANCE, // tri-partite
      fromState: PRE_INITIALIZED_2,
      toState: PRE_INITIALIZED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.SUBMIT_ASSET_INSTANCE, // tri-partite
      fromState: PRE_INITIALIZED,
      toState: PRE_INITIALIZED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.SUBMIT_ASSET_INSTANCE, // tri-partite
      fromState: REJECTED,
      toState: PRE_INITIALIZED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.SUBMIT_ASSET_INSTANCE, // tri-partite
      fromState: SUBMITTED,
      toState: PRE_INITIALIZED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.SUBMIT_ASSET_INSTANCE, // bi-partite
      fromState: REJECTED,
      toState: SUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.DEPLOY_ASSET_INSTANCE, // single-partite
      fromState: INITIALIZED,
      toState: DEPLOYED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.DEPLOY_ASSET_INSTANCE, // bi-partite or tri-partite
      fromState: SUBMITTED,
      toState: DEPLOYED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_ASSET_INSTANCE, // bi-partite or tri-partite
      fromState: SUBMITTED,
      toState: REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_ASSET_INSTANCE, // tri-partite
      fromState: PRE_INITIALIZED,
      toState: REJECTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CREATE_TOKEN, // used to bypass the whole asset creation workflow
      fromState: NOT_STARTED,
      toState: DEPLOYED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.DEPLOY_EXTENSION, // not used
      fromState: DEPLOYED,
      toState: DEPLOYED_WITH_EXTENSION,
      role: UserType.ISSUER,
    },
  ],
}

const primaryTradeWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.ASSET_PRIMARY_TRADE,
  workflowType: WorkflowType.ORDER,
  roles: ALL_ROLES,
  states: [
    NOT_STARTED,
    SUBSCRIBED,
    PAID,
    PAID_SETTLED,
    UNPAID_SETTLED,
    PAID_CANCELLED,
    UNPAID_CANCELLED,
    PAID_REJECTED,
    UNPAID_REJECTED,
  ],
  transitionTemplates: [
    {
      name: FunctionName.CREATE_PRIMARY_TRADE_ORDER,
      fromState: NOT_STARTED,
      toState: SUBSCRIBED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CANCEL_PRIMARY_TRADE_ORDER,
      fromState: SUBSCRIBED,
      toState: UNPAID_CANCELLED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CANCEL_PRIMARY_TRADE_ORDER,
      fromState: PAID,
      toState: PAID_CANCELLED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.VALIDATE_PRIMARY_TRADE_ORDER_PAYMENT,
      fromState: SUBSCRIBED,
      toState: PAID,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.VALIDATE_PRIMARY_TRADE_ORDER_PAYMENT,
      fromState: UNPAID_SETTLED,
      toState: PAID_SETTLED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SETTLE_PRIMARY_TRADE_ORDER,
      fromState: SUBSCRIBED,
      toState: UNPAID_SETTLED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SETTLE_PRIMARY_TRADE_ORDER,
      fromState: PAID,
      toState: PAID_SETTLED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SETTLE_SUBSCRIPTION_PRIMARY_TRADE_ORDER,
      fromState: SUBSCRIBED,
      toState: UNPAID_SETTLED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SETTLE_SUBSCRIPTION_PRIMARY_TRADE_ORDER,
      fromState: PAID,
      toState: PAID_SETTLED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SETTLE_REDEMPTION_PRIMARY_TRADE_ORDER,
      fromState: SUBSCRIBED,
      toState: UNPAID_SETTLED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SETTLE_REDEMPTION_PRIMARY_TRADE_ORDER,
      fromState: PAID,
      toState: PAID_SETTLED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_PRIMARY_TRADE_ORDER,
      fromState: SUBSCRIBED,
      toState: UNPAID_REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_PRIMARY_TRADE_ORDER,
      fromState: PAID,
      toState: PAID_REJECTED,
      role: UserType.ISSUER,
    },

    {
      name: FunctionName.UNREJECT_PRIMARY_TRADE_ORDER,
      fromState: PAID_REJECTED,
      toState: PAID,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.UNREJECT_PRIMARY_TRADE_ORDER,
      fromState: UNPAID_REJECTED,
      toState: SUBSCRIBED,
      role: UserType.ISSUER,
    },
  ],
}

const secondaryTradeWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.ASSET_SECONDARY_TRADE,
  workflowType: WorkflowType.ORDER,
  roles: ALL_ROLES,
  states: [
    NOT_STARTED,
    PRE_CREATED,
    SUBMITTED,
    NEGOTIATING,
    APPROVED,
    ACCEPTED,
    OUTSTANDING,
    PAYING,
    PAID,
    EXECUTED,
    CANCELLED,
    REJECTED,
  ],
  transitionTemplates: [
    {
      name: FunctionName.PRE_CREATE_SECONDARY_TRADE_ORDER,
      fromState: NOT_STARTED,
      toState: PRE_CREATED,
      role: UserType.AGENT,
    },
    {
      name: FunctionName.APPROVE_PRE_CREATED_SECONDARY_TRADE_ORDER,
      fromState: PRE_CREATED,
      toState: APPROVED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CANCEL_SECONDARY_TRADE_ORDER,
      fromState: PRE_CREATED,
      toState: CANCELLED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CANCEL_SECONDARY_TRADE_ORDER,
      fromState: PRE_CREATED,
      toState: CANCELLED,
      role: UserType.AGENT,
    },
    {
      name: FunctionName.CREATE_SECONDARY_TRADE_ORDER,
      fromState: NOT_STARTED,
      toState: SUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.FORCE_CREATE_ACCEPTED_SECONDARY_TRADE_ORDER,
      fromState: NOT_STARTED,
      toState: ACCEPTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.FORCE_CREATE_PAID_SECONDARY_TRADE_ORDER,
      fromState: NOT_STARTED,
      toState: PAID,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.PURCHASE_OFFER,
      fromState: NOT_STARTED,
      toState: ACCEPTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.BIND_OFFER,
      fromState: NOT_STARTED,
      toState: SUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.NEGOTIATE,
      fromState: NOT_STARTED,
      toState: NEGOTIATING,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.SUBMIT_TRADE_ORDER_NEGOTIATION,
      fromState: NEGOTIATING,
      toState: NEGOTIATING,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.ACCEPT_TRADE_ORDER_NEGOTIATION,
      fromState: NEGOTIATING,
      toState: ACCEPTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.ACCEPT_SECONDARY_TRADE_ORDER,
      fromState: NEGOTIATING,
      toState: ACCEPTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: NEGOTIATING,
      toState: REJECTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CREATE_SECONDARY_TRADE_ORDER,
      fromState: NOT_STARTED,
      toState: SUBMITTED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.APPROVE_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: APPROVED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.APPROVE_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: APPROVED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.ACCEPT_SECONDARY_TRADE_ORDER,
      fromState: APPROVED,
      toState: ACCEPTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.ACCEPT_SECONDARY_TRADE_ORDER,
      fromState: APPROVED,
      toState: ACCEPTED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.ACCEPT_SECONDARY_TRADE_ORDER,
      fromState: APPROVED,
      toState: ACCEPTED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.ACCEPT_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: ACCEPTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.ACCEPT_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: ACCEPTED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.ACCEPT_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: ACCEPTED,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.HOLD_SECONDARY_TRADE_ORDER_DELIVERY,
      fromState: ACCEPTED,
      toState: OUTSTANDING,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.HOLD_SECONDARY_TRADE_ORDER_DELIVERY,
      fromState: ACCEPTED,
      toState: OUTSTANDING,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.HOLD_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: OUTSTANDING,
      toState: PAID,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.HOLD_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: OUTSTANDING,
      toState: PAID,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.HOLD_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: OUTSTANDING,
      toState: PAID,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.SETTLE_ATOMIC_SECONDARY_TRADE_ORDER,
      fromState: PAID,
      toState: EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SETTLE_ATOMIC_SECONDARY_TRADE_ORDER,
      fromState: OUTSTANDING,
      toState: EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SEND_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: OUTSTANDING,
      toState: PAYING,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.SEND_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: OUTSTANDING,
      toState: PAYING,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.SEND_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: OUTSTANDING,
      toState: PAYING,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.RECEIVE_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: PAYING,
      toState: PAID,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.RECEIVE_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: PAYING,
      toState: PAID,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.RECEIVE_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: PAYING,
      toState: PAID,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.RECEIVE_SECONDARY_TRADE_ORDER_PAYMENT,
      fromState: PAYING,
      toState: PAID,
      role: UserType.BROKER,
    },
    {
      name: FunctionName.SETTLE_NON_ATOMIC_SECONDARY_TRADE_ORDER,
      fromState: PAID,
      toState: EXECUTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.SETTLE_NON_ATOMIC_SECONDARY_TRADE_ORDER,
      fromState: PAID,
      toState: EXECUTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.CANCEL_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: CANCELLED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CANCEL_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: CANCELLED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.CANCEL_SECONDARY_TRADE_ORDER,
      fromState: ACCEPTED,
      toState: CANCELLED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CANCEL_SECONDARY_TRADE_ORDER,
      fromState: APPROVED,
      toState: CANCELLED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: APPROVED,
      toState: REJECTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: APPROVED,
      toState: REJECTED,
      role: UserType.UNDERWRITER,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: REJECTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: APPROVED,
      toState: REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: ACCEPTED,
      toState: REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: OUTSTANDING,
      toState: REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_SECONDARY_TRADE_ORDER,
      fromState: PAID,
      toState: REJECTED,
      role: UserType.ISSUER,
    },
  ],
}

const offerWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.OFFER,
  workflowType: WorkflowType.OFFER,
  roles: ALL_ROLES,
  states: [NOT_STARTED, SUBMITTED, CANCELLED, PURCHASED],
  transitionTemplates: [
    {
      name: FunctionName.CREATE_OFFER,
      fromState: NOT_STARTED,
      toState: SUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.UPDATE_OFFER,
      fromState: SUBMITTED,
      toState: SUBMITTED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.CANCEL_OFFER,
      fromState: SUBMITTED,
      toState: CANCELLED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.PURCHASE_OFFER,
      fromState: SUBMITTED,
      toState: PURCHASED,
      role: UserType.INVESTOR,
    },
    {
      name: FunctionName.ACCEPT_SECONDARY_TRADE_ORDER,
      fromState: SUBMITTED,
      toState: PURCHASED,
      role: UserType.INVESTOR,
    },
  ],
}

const navWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.NAV,
  workflowType: WorkflowType.NAV,
  roles: ALL_ROLES,
  states: [NOT_STARTED, NAV_SUBMITTED, NAV_VALIDATED, NAV_REJECTED],
  transitionTemplates: [
    {
      name: FunctionName.SUBMIT_NAV,
      fromState: NOT_STARTED,
      toState: NAV_SUBMITTED,
      role: UserType.NAV_MANAGER,
    },
    {
      name: FunctionName.VALIDATE_NAV,
      fromState: NAV_SUBMITTED,
      toState: NAV_VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.REJECT_NAV,
      fromState: NAV_SUBMITTED,
      toState: NAV_REJECTED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.CREATE_NAV,
      fromState: NOT_STARTED,
      toState: NAV_VALIDATED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.DEPLOY_ASSET_INSTANCE, // Used when NAV is created in the frame of the asset creation workflow
      fromState: NOT_STARTED,
      toState: NAV_VALIDATED,
      role: UserType.ISSUER,
    },
  ],
}

const eventsWorkflow: WorkflowTemplateDto = {
  name: WorkflowName.EVENT,
  workflowType: WorkflowType.EVENT,
  roles: ALL_ROLES,
  states: [NOT_STARTED, SCHEDULED, SETTLED, CANCELLED],
  transitionTemplates: [
    {
      name: FunctionName.CREATE_EVENT,
      fromState: NOT_STARTED,
      toState: SCHEDULED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.SETTLE_EVENT,
      fromState: SCHEDULED,
      toState: SETTLED,
      role: UserType.ISSUER,
    },
    {
      name: FunctionName.CANCEL_EVENT,
      fromState: SCHEDULED,
      toState: CANCELLED,
      role: UserType.ISSUER,
    },
  ],
}

export const allWorkflows = [
  preIssuanceWorkflow,
  issuanceWorkflow,
  kycWorkflow,
  fungibleBasicWorkflow,
  nonFungibleBasicWorkflow,
  hybridBasicWorkflow,
  mataIssuanceWorkflow,
  fundCreationWorkflow,
  primaryTradeWorkflow,
  secondaryTradeWorkflow,
  navWorkflow,
  offerWorkflow,
  eventsWorkflow,
]
