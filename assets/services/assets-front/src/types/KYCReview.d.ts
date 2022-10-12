import { ClientCategory, RiskProfile } from 'constants/kycKeys';
import { ReviewStatus } from 'routes/Issuer/AssetIssuance/elementsTypes';
import { EntityType } from 'User';

export enum KycGranularity {
  TEMPLATE_ONLY = 'TEMPLATE_ONLY',
  ELEMENT_ONLY = 'ELEMENT_ONLY',
  TEMPLATE_OR_ELEMENT = 'TEMPLATE_OR_ELEMENT',
  TEMPLATE_AND_ELEMENT = 'TEMPLATE_AND_ELEMENT',
}

export enum ReviewScope {
  TEMPLATE = 'TEMPLATE',
  SECTION = 'SECTION',
  ELEMENT_INSTANCE = 'ELEMENT_INSTANCE',
}

export enum ReviewKeys {
  REVIEW_ID = 'id',
  TENANT_ID = 'tenantId',
  DEPRECATED_REVIEW_ID = 'reviewId',
  REVIEW_SCOPE = 'scope',
  REVIEW_OBJECT_ID = 'objectId',
  REVIEW_SECTION_KEY = 'sectionKey',
  REVIEW_INVESTOR_ID = 'investorId',
  REVIEW_ENTITY_TYPE = 'entityType',
  REVIEW_ENTITY_ID = 'entityId',
  REVIEW_ENTITY_CLASS = 'entityClass',
  REVIEW_STATUS = 'status',
  REVIEW_CATEGORY = 'category',
  REVIEW_RISK_PROFILE = 'riskProfile',
  REVIEW_COMMENT = 'comment',
  REVIEW_VALIDITY_DATE = 'validityDate',
  REVIEW_DATA = 'data',
  REVIEW_CREATED_AT = 'createdAt',
  REVIEW_UPDATED_AT = 'updatedAt',
}

export interface IKycReview {
  id: string;
  tenantId: string;
  scope: ReviewScope;
  objectId: string;
  sectionKey: string;
  investorId: string;
  entityType: EntityType;
  entityId: string;
  status: ReviewStatus;
  category: ClientCategory;
  riskProfile: RiskProfile;
  comment: string;
  validityDate: Date;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}
