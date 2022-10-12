export enum TokenState {
  LOCKED = 'locked',
  RESERVED = 'reserved',
  ISSUED = 'issued',
  COLLATERAL = 'collateral',
}

export enum TokenRule {
  KYC_REQUIRED = 'kycRequired',
  ERC20_COMPLIANT = 'erc20Compliant',
  OWNER_CAN_CHANGE = 'ownerCanChange',
}

export const stateRules: {
  [state: string]: {
    [property: string]: boolean | string;
  };
} = {
  [TokenState.LOCKED]: {
    [TokenRule.KYC_REQUIRED]: false,
    [TokenRule.ERC20_COMPLIANT]: false,
    [TokenRule.OWNER_CAN_CHANGE]: true,
    description:
      'Tokens can not be used without Codefi API, and have not been reserved yet, thus they can be transferred without restriction to other users of Codefi platform',
  },
  [TokenState.RESERVED]: {
    [TokenRule.KYC_REQUIRED]: true,
    [TokenRule.ERC20_COMPLIANT]: false,
    [TokenRule.OWNER_CAN_CHANGE]: false,
    description:
      'Tokens have been reserved by a verified user, which means tokens are destined to become issued tokens, thus can neither be transferred, nor used without Codefi API',
  },
  [TokenState.ISSUED]: {
    [TokenRule.KYC_REQUIRED]: true,
    [TokenRule.ERC20_COMPLIANT]: true,
    [TokenRule.OWNER_CAN_CHANGE]: true,
    description:
      'Tokens have been issued, thus can be used on any ERC20-compliant platform/tool/exchange/etc., but only by verified users',
  },
  [TokenState.COLLATERAL]: {
    // technically similar to "STATE_RESERVED", but occurs after "STATE_ISSUED"
    [TokenRule.KYC_REQUIRED]: true,
    [TokenRule.ERC20_COMPLIANT]: false,
    [TokenRule.OWNER_CAN_CHANGE]: false,
    description:
      'Tokens have already been issued, but can neither be transferred, nor used without Codefi API (e.g. without issuer s approval), since they have been collateralized',
  },
};
