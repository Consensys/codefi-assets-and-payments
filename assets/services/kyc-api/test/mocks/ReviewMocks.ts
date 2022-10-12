import { v4 as uuidv4 } from 'uuid';
import { ReviewRequest } from 'src/modules/ReviewModule/ReviewRequest';
import {
  ClientCategory,
  EntityType,
  ReviewScope,
  ReviewStatus,
  RiskProfile,
} from 'src/utils/constants/enum';

export const templateReviewCreateRequestMock: ReviewRequest = {
  scope: ReviewScope.TEMPLATE,
  objectId: uuidv4(),
  investorId: uuidv4(),
  entityType: EntityType.TOKEN,
  entityId: uuidv4(),
  entityClass: 'classa',
  status: ReviewStatus.VALIDATED,
  category: ClientCategory.RETAIL_CUSTOMERS,
  riskProfile: RiskProfile.AGGRESSIVE,
  comment: 'ok - no comment',
  validityDate: new Date('2045-12-19T09:24:00.000Z'),
  data: {},
};

export const templateReviewUpdateRequestMock: Partial<ReviewRequest> = {
  objectId: uuidv4(),
  entityId: uuidv4(),
  entityClass: 'classa',
  status: ReviewStatus.SUBMITTED,
  category: ClientCategory.RETAIL_CUSTOMERS,
  riskProfile: RiskProfile.DYNAMIC,
  comment: 'ok - updated',
  validityDate: new Date('2045-12-19T09:24:00.000Z'),
  data: {},
};

export const elementInstancesReviewCreateRequestMock: ReviewRequest = {
  scope: ReviewScope.ELEMENT_INSTANCE,
  objectId: uuidv4(),
  entityType: EntityType.TOKEN,
  entityId: uuidv4(),
  entityClass: 'classa',
  status: ReviewStatus.VALIDATED,
  comment: 'ok - no comment',
  validityDate: new Date('2045-12-19T09:24:00.000Z'),
  data: {},
};

export const elementInstancesReviewUpdateRequestMock: Partial<ReviewRequest> = {
  objectId: uuidv4(),
  entityId: uuidv4(),
  entityClass: 'classa',
  status: ReviewStatus.REJECTED,
  comment: 'ok - no comment',
  validityDate: new Date('2045-12-19T09:24:00.000Z'),
  data: {},
};
