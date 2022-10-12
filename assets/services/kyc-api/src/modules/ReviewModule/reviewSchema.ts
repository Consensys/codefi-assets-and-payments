import * as Joi from 'joi';

import {
  ReviewScope,
  ReviewStatus,
  ClientCategory,
  RiskProfile,
  EntityType,
} from 'src/utils/constants/enum';

export const reviewSchema = Joi.object({
  scope: Joi.string()
    .valid(
      ReviewScope.TEMPLATE,
      ReviewScope.SECTION,
      ReviewScope.ELEMENT_INSTANCE,
    )
    .when('$requestType', {
      is: 'POST',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  reviewId: Joi.string().when('$requestType', {
    is: 'PUT',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  objectId: Joi.string().when('$requestType', {
    is: 'POST',
    then: Joi.required(),
  }),
  entityType: Joi.number()
    .valid(
      EntityType.TOKEN,
      EntityType.ASSET_CLASS,
      EntityType.ISSUER,
      EntityType.ADMIN,
      EntityType.PROJECT,
      EntityType.PLATFORM,
    )
    .when('$requestType', {
      is: 'POST',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  entityId: Joi.string().when('entityType', {
    not: 'PLATFORM',
    then: Joi.string().required(),
  }),
  entityClass: Joi.string(),
  status: Joi.string()
    .valid(
      ReviewStatus.SUBMITTED,
      ReviewStatus.VALIDATED,
      ReviewStatus.REJECTED,
    )
    .required(),
  data: Joi.object(),
  comment: Joi.string(),
  validityDate: Joi.date(),
  investorId: Joi.string().when('scope', {
    is: ReviewScope.TEMPLATE,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  category: Joi.string().valid(
    ClientCategory.ELIGIBLE_COUNTER_PARTIES,
    ClientCategory.PROFESSIONAL_CLIENTS,
    ClientCategory.RETAIL_CUSTOMERS,
  ),
  riskProfile: Joi.string().valid(
    RiskProfile.CONSERVATIVE,
    RiskProfile.MODERATE,
    RiskProfile.BALANCED,
    RiskProfile.DYNAMIC,
    RiskProfile.AGGRESSIVE,
  ),
});
