export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ERC1820_ACCEPT_MAGIC =
  '0xa2ef4600d742022d532d4747cb3547474667d6f13804902513b2ec01c848f4b4'; // keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"))

export enum ScVersion {
  V1 = 'V1',
  V2 = 'V2',
  V3 = 'V3',
}

export enum SmartContract {
  BATCH_BALANCE_READER = 'BatchBalanceReader', // TO BE DEPRECATED
  BATCH_READER = 'BatchReader',
  BATCH_TOKEN_ISSUER = 'BatchTokenIssuer',
  ERC20_TOKEN = 'ERC20Token',
  ERC721_TOKEN = 'ERC721Token',
  ERC1400ERC20 = 'ERC1400ERC20', // V1
  ERC1400_CERTIFICATE_NONCE = 'ERC1400CertificateNonce', // V2
  ERC1400_CERTIFICATE_SALT = 'ERC1400CertificateSalt', // V2
  ERC1400_HOLDABLE_CERTIFICATE = 'ERC1400HoldableCertificateToken', // V3
  ERC1400_TOKENS_VALIDATOR = 'ERC1400TokensValidator',
  DVP_HOLDABLE_LOCKABLE = 'DVPHoldableLockable',
}

export const SmartContractVersion = {
  [SmartContract.ERC1400ERC20]: ScVersion.V1,
  [SmartContract.ERC1400_CERTIFICATE_NONCE]: ScVersion.V2,
  [SmartContract.ERC1400_CERTIFICATE_SALT]: ScVersion.V2,
  [SmartContract.ERC1400_HOLDABLE_CERTIFICATE]: ScVersion.V3,
  [SmartContract.ERC1400_TOKENS_VALIDATOR]: ScVersion.V3,
};

export const BatchSupported = [
  SmartContract.ERC1400_CERTIFICATE_NONCE,
  SmartContract.ERC1400_CERTIFICATE_SALT,
  SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
];

export enum TokenCategory {
  FUNGIBLE = 'FUNGIBLE',
  NONFUNGIBLE = 'NONFUNGIBLE',
  HYBRID = 'HYBRID',
  ALL = 'ALL',
}

export enum CertificateType {
  NONE = 'NONE',
  NONCE = 'NONCE',
  SALT = 'SALT',
  NONE_OR_NONCE_OR_SALT = 'NONE_OR_NONCE_OR_SALT',
}

export const CertificateTypeIndex = {
  [CertificateType.NONE]: '0',
  [CertificateType.NONCE]: '1',
  [CertificateType.SALT]: '2',
};

export const EMPTY_CERTIFICATE = '0x';

export enum TokenExtensionSetup {
  CERTIFICATE_VALIDATION = '0',
  ALLOWLIST_ACTIVATED = '1',
  BLOCKLIST_ACTIVATED = '2',
  GRANULARITY_BY_PARTITION_ACTIVATED = '3',
  HOLDS_ACTIVATED = '4',
  TOKEN_CONTROLLERS = '5',
}

export const DEFAULT_FUNGIBLE_TOKEN_STANDARD = SmartContract.ERC20_TOKEN;
export const DEFAULT_NON_FUNGIBLE_TOKEN_STANDARD = SmartContract.ERC721_TOKEN;
export const DEFAULT_HYBRID_TOKEN_STANDARD =
  SmartContract.ERC1400_HOLDABLE_CERTIFICATE;

export const TOKEN_STANDARD = {
  [TokenCategory.FUNGIBLE as TokenCategory]: [SmartContract.ERC20_TOKEN],
  [TokenCategory.NONFUNGIBLE as TokenCategory]: [SmartContract.ERC721_TOKEN],
  [TokenCategory.HYBRID as TokenCategory]: [
    SmartContract.ERC1400ERC20, // V1
    SmartContract.ERC1400_CERTIFICATE_SALT, // V2
    SmartContract.ERC1400_CERTIFICATE_NONCE, // V2
    SmartContract.ERC1400_HOLDABLE_CERTIFICATE, // V3
  ],
};

export const CERTIFICATE_REQUIRED = {
  [SmartContract.ERC20_TOKEN]: CertificateType.NONE,
  [SmartContract.ERC721_TOKEN]: CertificateType.NONE,
  [SmartContract.ERC1400ERC20]: CertificateType.NONCE,
  [SmartContract.ERC1400_CERTIFICATE_SALT]: CertificateType.SALT,
  [SmartContract.ERC1400_CERTIFICATE_NONCE]: CertificateType.NONCE,
  [SmartContract.ERC1400_HOLDABLE_CERTIFICATE]:
    CertificateType.NONE_OR_NONCE_OR_SALT,
};

export const retrieveTokenCategory = (
  tokenStandard: SmartContract,
): TokenCategory => {
  if (TOKEN_STANDARD[TokenCategory.FUNGIBLE].includes(tokenStandard)) {
    return TokenCategory.FUNGIBLE;
  } else if (
    TOKEN_STANDARD[TokenCategory.NONFUNGIBLE].includes(tokenStandard)
  ) {
    return TokenCategory.NONFUNGIBLE;
  } else if (TOKEN_STANDARD[TokenCategory.HYBRID].includes(tokenStandard)) {
    return TokenCategory.HYBRID;
  } else {
    throw new Error(
      `invalid token standard(${tokenStandard}), it belongs to no category`,
    );
  }
};

export enum FunctionName {
  UPDATE_TOKEN_DATA = 'updateTokenData',
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
  DEPLOY_ASSET_INSTANCE = 'deployAssetInstance', // asset creation digital asset workflow
  SUBMIT_ASSET_INSTANCE = 'submitAssetInstance', // asset creation digital asset workflow
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
  SETTLE_SUBSCRIPTION_PRIMARY_TRADE_ORDER = 'settleSubscriptionPrimaryTradeOrder', // digital asset primary trade workflow
  SETTLE_REDEMPTION_PRIMARY_TRADE_ORDER = 'settleSRedemptionptionPrimaryTradeOrder', // digital asset primary trade workflow
  SUBMIT_NAV = 'submitNav', // nav workflow
  VALIDATE_NAV = 'validateNav', // nav workflow
  REJECT_NAV = 'rejectNav', // nav workflow
  CREATE_NAV = 'createNav', // nav workflow
  CREATE_SECONDARY_TRADE_ORDER = 'createTradeOrder', // digital asset secondary trade workflow
  PRE_CREATE_SECONDARY_TRADE_ORDER = 'preCreateTradeOrder', // digital asset secondary trade workflow
  APPROVE_PRE_CREATED_SECONDARY_TRADE_ORDER = 'approvePreCreatedTradeOrder', // digital asset secondary trade workflow
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
  CANCEL_OFFER = 'cancelOffer', // digital asset offer workflow
  UPDATE_OFFER = 'updateOffer', // digital asset offer workflow
  PURCHASE_OFFER = 'purchaseOffer', // digital asset offer workflow
  BIND_OFFER = 'bindOffer', // digital asset offer workflow
  CREATE_EVENT = 'createEvent',
  SETTLE_EVENT = 'settleEvent',
  CANCEL_EVENT = 'cancelEvent',
  NEGOTIATE = 'negotiate', // digital asset offer workflow
  SUBMIT_TRADE_ORDER_NEGOTIATION = 'submitTradeOrderNegotiation', // digital asset offer workflow
}

export enum FunctionRule {
  SUPPORTED_TOKEN_CATEGORIES = 'supportedTokenCategories',
  SENDER_CHECK_REQUIRED = 'senderCheckRequired',
  RECIPIENT_CHECK_REQUIRED = 'recipientCheckRequired',
  OWNERSHIP_TRANSFER = 'ownershipTransfer',
  ERC20_FUNCTION_NAME = 'erc20FunctionName',
  ERC721_FUNCTION_NAME = 'erc721FunctionName',
  ERC1400_FUNCTION_NAME = 'erc1400FunctionName',
  CERTIFICATE_FIELD_NAME = 'certificateFieldName',
  IS_EXTENSION_FUNCTION = 'isExtensionFunction',
  HOOK_FUNCTION = 'hookFunction',
  PRICE_IMPACT = 'priceImpact',
}

export enum HookFunctions {
  TOKEN_CREATION_HOOK = 'tokenCreation_hook',
  ACTION_HOOK = 'action_hook',
  ORDER_HOOK = 'order_hook',
  DISTRIBUTE_HOOK = 'distribute_hook',
  NONE = 'none',
}

export const functionRules: {
  [functionType: string]: {
    [property: string]: any;
  };
} = {
  [FunctionName.CREATE_TOKEN]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.ALL],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.TOKEN_CREATION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.DEPLOY_ASSET_INSTANCE]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.TOKEN_CREATION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.MINT]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.ALL],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: 'mint',
    [FunctionRule.ERC721_FUNCTION_NAME]: 'mint',
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'issueByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'data',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 1,
  },
  [FunctionName.MINT_AND_SET_TOKEN_URI]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.NONFUNGIBLE],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: 'mintAndSetTokenURI',
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 1,
  },
  [FunctionName.TRANSFER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.ALL],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: 'transfer',
    [FunctionRule.ERC721_FUNCTION_NAME]: 'transferFrom',
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'transferByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'data',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.BURN]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.ALL],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: 'burn',
    [FunctionRule.ERC721_FUNCTION_NAME]: 'burn',
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'redeemByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'data',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: -1,
  },
  [FunctionName.FORCE_TRANSFER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorTransferByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.FORCE_BURN]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorRedeemByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: -1,
  },
  [FunctionName.UPDATE_STATE]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorTransferByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.FORCE_UPDATE_STATE]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorTransferByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.UPDATE_CLASS]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorTransferByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.HOLD]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'hold',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'certificate',
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.FORCE_HOLD]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'holdFrom',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'certificate',
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.EXECUTE_HOLD]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.RELEASE_HOLD]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.OFFER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'issueByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'data',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.DISTRIBUTE]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'transferByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'data',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.DISTRIBUTE_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.CREATE_UNLOCKED]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'issueByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'data',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 1,
  },
  [FunctionName.CREATE_LOCKED]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'issueByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'data',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 1,
  },
  [FunctionName.RESERVE]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorTransferByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.RELEASE]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorTransferByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.DESTROY]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorRedeemByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: -1,
  },
  [FunctionName.TRANSFER_OWNERSHIP]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.ALL],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: 'transferOwnership',
    [FunctionRule.ERC721_FUNCTION_NAME]: 'transferOwnership',
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'transferOwnership',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.SET_CUSTOM_TOKEN_EXTENSION]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'setTokenExtension',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.ADD_ALLOWLISTED]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'addAllowlisted',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.REMOVE_ALLOWLISTED]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'removeAllowlisted',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ACTION_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.CREATE_PRIMARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.VALIDATE_PRIMARY_TRADE_ORDER_PAYMENT]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.SETTLE_SUBSCRIPTION_PRIMARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'issueByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'data',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ORDER_HOOK,
    [FunctionRule.PRICE_IMPACT]: 1,
  },
  [FunctionName.SETTLE_REDEMPTION_PRIMARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'operatorRedeemByPartition',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'operatorData',
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ORDER_HOOK,
    [FunctionRule.PRICE_IMPACT]: -1,
  },
  [FunctionName.REJECT_PRIMARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.CANCEL_PRIMARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.SUBMIT_NAV]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.VALIDATE_NAV]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.REJECT_NAV]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.CREATE_NAV]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.PRE_CREATE_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.APPROVE_PRE_CREATED_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.CREATE_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.APPROVE_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.ACCEPT_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.FORCE_CREATE_ACCEPTED_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.FORCE_CREATE_PAID_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'holdFrom',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'certificate',
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ORDER_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.HOLD_SECONDARY_TRADE_ORDER_DELIVERY]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'holdFrom',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: 'certificate',
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ORDER_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.HOLD_SECONDARY_TRADE_ORDER_PAYMENT]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.SETTLE_ATOMIC_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ORDER_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.SUBMIT_TRADE_ORDER_NEGOTIATION]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.SEND_SECONDARY_TRADE_ORDER_PAYMENT]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.RECEIVE_SECONDARY_TRADE_ORDER_PAYMENT]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.SETTLE_NON_ATOMIC_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ORDER_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.REJECT_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: 'releaseHold',
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: true,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.ORDER_HOOK,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.CANCEL_SECONDARY_TRADE_ORDER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: false,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined, // Off-chain for now (could be on-chain in the future)
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.CREATE_OFFER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.CANCEL_OFFER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.UPDATE_OFFER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: false,
    [FunctionRule.OWNERSHIP_TRANSFER]: false,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
  [FunctionName.PURCHASE_OFFER]: {
    [FunctionRule.SUPPORTED_TOKEN_CATEGORIES]: [TokenCategory.HYBRID],
    [FunctionRule.SENDER_CHECK_REQUIRED]: true,
    [FunctionRule.RECIPIENT_CHECK_REQUIRED]: true,
    [FunctionRule.OWNERSHIP_TRANSFER]: true,
    [FunctionRule.ERC20_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC721_FUNCTION_NAME]: undefined,
    [FunctionRule.ERC1400_FUNCTION_NAME]: undefined,
    [FunctionRule.CERTIFICATE_FIELD_NAME]: undefined,
    [FunctionRule.IS_EXTENSION_FUNCTION]: false,
    [FunctionRule.HOOK_FUNCTION]: HookFunctions.NONE,
    [FunctionRule.PRICE_IMPACT]: 0,
  },
};
