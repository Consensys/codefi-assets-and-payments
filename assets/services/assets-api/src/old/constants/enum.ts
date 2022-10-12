export const UserEnum = Object.freeze({
  all: 0,
  userId: 1,
  authId: 2,
  email: 3,
  firstConnectionCode: 4,
  superUserId: 5,
  userType: 6,
  userTypes: 7,
});

export const ApiKeysEnum = Object.freeze({
  id: 1,
  userId: 2,
  key: 3,
  all: 4,
});

export const TokenCategoryEnum = Object.freeze({
  fungible: 1,
  nonfungible: 2,
  hybrid: 3,
});

export const TokenIdentifierEnum = Object.freeze({
  all: 0,
  tokenId: 1,
  address: 2,
  name: 3,
  symbol: 4,
});

export const TransactionEnum = Object.freeze({
  identifier: 1,
  txHash: 2,
  index: 3,
});

export const ElementEnum = Object.freeze({
  elementId: 1,
  key: 2,
});

export const TemplateEnum = Object.freeze({
  templateId: 1,
  issuerId: 2,
  name: 3,
});

export const ElementInstanceEnum = Object.freeze({
  elementId: 1,
  userIdAndElementKey: 2,
  userId: 3,
});

export const ReviewEnum = Object.freeze({
  reviewId: 1,
  objectIdAndEntityId: 2,
  objectIdAndEntityIdAndInvestorId: 3,
});

export const CycleEnum = Object.freeze({
  cycleId: 1,
  assetId: 2,
  assetIdAndAssetClassKey: 3,
  assetIdAndAssetClassKeyAndType: 4,
});

export const ProjectEnum = Object.freeze({
  tenantId: 1,
  projectId: 2,
  key: 3,
  name: 4,
});

///////////////////////////////////////////////////
///////////////////////////////////////////////////

export const WorkflowTemplateEnum = Object.freeze({
  id: 1,
  name: 2,
});

// SHALL BE THE SAME ENUM AS THE ONE IN API-PROCESS
// Previously called "ActionEnum"
export const WorkflowInstanceEnum = Object.freeze({
  id: 1, // Previously called "actionId"
  ids: 2,
  entityIdAndUserId: 3,
  entityIdAndUserIds: 4,
  entityIdAndRecipientId: 5,
  userId: 6,
  entityId: 7,
  recipientId: 8,
  objectId: 9,
  entityType: 10,
  entityTypeAndUserId: 11,
  entityTypeAndUserIds: 12,
  idempotencyKey: 13,
  all: 14,
  entityIdAndAgentId: 15,
});

// SHALL BE THE SAME ENUM AS THE ONE IN API-PROCESS
export const UserEntityLinkWorkflowEnum = Object.freeze({
  kyc: 1,
});
// SHALL BE THE SAME ENUM AS THE ONE IN API-PROCESS
// FIXME: ActionWorkflowEnum should be deleted
export const enum ActionWorkflowEnum {
  preissuance = 1,
  issuance = 2,
  otcTransfer = 3,
  withdrawal = 4,
  fungibleBasics = 5,
  nonfungibleBasics = 6,
  hybridBasics = 7,
  assetCreation = 8,
}
