import { KycReview, KycReviewExample } from './review';
import { KycTemplate, KycTemplateExample } from './template';

export enum keys {
  DATA = 'kycData',
  DATA__ELEMENT_REVIEWS = 'elementReviews',
  DATA__TEMPLATE_REVIEW = 'templateReview',
  VALIDATIONS = 'kycValidations',
  VALIDATIONS__ELEMENTS = 'elements',
  VALIDATIONS__TEMPLATE = 'template',
  MESSAGE = 'message',
}

export interface KycData {
  [keys.DATA__ELEMENT_REVIEWS]: KycTemplate;
  [keys.DATA__TEMPLATE_REVIEW]: KycReview;
}

export interface KycValidations {
  [keys.VALIDATIONS__ELEMENTS]: [boolean, string];
  [keys.VALIDATIONS__TEMPLATE]: [boolean, string];
}

export interface KycDataResponse {
  [keys.DATA]: KycData;
  [keys.VALIDATIONS]: KycValidations;
  [keys.MESSAGE]: string;
}

export const KycDataExample: KycData = {
  [keys.DATA__ELEMENT_REVIEWS]: KycTemplateExample,
  [keys.DATA__TEMPLATE_REVIEW]: KycReviewExample,
};

export const KycValidationsExample: KycValidations = {
  [keys.VALIDATIONS__ELEMENTS]: [true, 'KYC validated at elements level'],
  [keys.VALIDATIONS__TEMPLATE]: [true, 'KYC validated at template level'],
};

export const KycDataResponseExample: KycDataResponse = {
  [keys.DATA]: KycDataExample,
  [keys.VALIDATIONS]: KycValidationsExample,
  [keys.MESSAGE]:
    'KYC data (token-related) of submitter ce0d4d20-f3a5-4fd0-9fde-274927e4a0b5 listed successfully for reviewer 8090f332-e0c3-44dd-bf37-cb353ea77625',
};
