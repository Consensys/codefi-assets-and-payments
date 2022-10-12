import { EntityType } from '../entity';

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

export enum ReviewStatus {
  NOT_SHARED = 'NOT_SHARED',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

export enum ClientCategory {
  ELIGIBLE_COUNTER_PARTIES = 'ELIGIBLE_COUNTER_PARTIES',
  PROFESSIONAL_CLIENTS = 'PROFESSIONAL_CLIENTS',
  RETAIL_CUSTOMERS = 'RETAIL_CUSTOMERS',
}

export enum RiskProfile {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  BALANCED = 'BALANCED',
  DYNAMIC = 'DYNAMIC',
  AGGRESSIVE = 'AGGRESSIVE',
}

export enum keys {
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

export interface KycReview {
  [keys.REVIEW_ID]: string;
  [keys.TENANT_ID]: string;
  [keys.REVIEW_SCOPE]: ReviewScope;
  [keys.REVIEW_OBJECT_ID]: string;
  [keys.REVIEW_SECTION_KEY]: string;
  [keys.REVIEW_INVESTOR_ID]: string;
  [keys.REVIEW_ENTITY_TYPE]: EntityType;
  [keys.REVIEW_ENTITY_ID]: string;
  [keys.REVIEW_STATUS]: ReviewStatus;
  [keys.REVIEW_CATEGORY]: ClientCategory;
  [keys.REVIEW_RISK_PROFILE]: RiskProfile;
  [keys.REVIEW_COMMENT]: string;
  [keys.REVIEW_VALIDITY_DATE]: Date;
  [keys.REVIEW_DATA]: any;
  [keys.REVIEW_CREATED_AT]: Date;
  [keys.REVIEW_UPDATED_AT]: Date;
}

export const KycReviewExample: KycReview = {
  [keys.REVIEW_ID]: '882f3058-2d42-4c0c-8987-ea586821af63',
  [keys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.REVIEW_SCOPE]: ReviewScope.TEMPLATE,
  [keys.REVIEW_OBJECT_ID]: '4fea9fd4-f01f-4b37-b530-3cc974801d1b',
  [keys.REVIEW_SECTION_KEY]: '',
  [keys.REVIEW_INVESTOR_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [keys.REVIEW_ENTITY_TYPE]: EntityType.TOKEN,
  [keys.REVIEW_ENTITY_ID]: '20fd8685-f09c-4cb1-ad49-038a89e4bfc8',
  [keys.REVIEW_STATUS]: ReviewStatus.REJECTED,
  [keys.REVIEW_CATEGORY]: ClientCategory.PROFESSIONAL_CLIENTS,
  [keys.REVIEW_RISK_PROFILE]: RiskProfile.AGGRESSIVE,
  [keys.REVIEW_COMMENT]:
    'Validity date is past, please re-submit this document',
  [keys.REVIEW_VALIDITY_DATE]: new Date('December 19, 2022 08:24:00'),
  [keys.REVIEW_DATA]: {},
  [keys.REVIEW_CREATED_AT]: new Date('December 19, 1990 08:24:00'),
  [keys.REVIEW_UPDATED_AT]: new Date('December 19, 1990 08:24:00'),
};
