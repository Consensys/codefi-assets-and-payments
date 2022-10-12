import { keys as TranslationKeys, TranslatedString } from '../languages';
import { ReviewStatus } from './review';

export enum ElementType {
  STRING = 'string',
  NUMBER = 'number',
  CHECK = 'check',
  RADIO = 'radio',
  DOCUMENT = 'document',
  MULTISTRING = 'multistring',
}

export enum ElementStatus {
  MANDATORY = 'mandatory',
  OPTOINAL = 'optional',
  CONDITIONAL = 'conditional',
}

export enum keys {
  ELEMENT_ID = 'id',
  ELEMENT_TENANT_ID = 'tenantId',
  ELEMENT_KEY = 'key',
  ELEMENT_TYPE = 'type',
  ELEMENT_STATUS = 'status',
  ELEMENT_LABEL = 'label',
  ELEMENT_PLACEHOLDER = 'placeholder',
  ELEMENT_INPUTS = 'inputs',
  ELEMENT_INPUT__LABEL = 'label',
  ELEMENT_INPUT__RELATED_ELEMENTS = 'relatedElements',
  ELEMENT_INPUT__VALUE = 'value',
  ELEMENT_DATA = 'data',
  ELEMENT_CREATED_AT = 'createdAt',
  ELEMENT_UPDATED_AT = 'updatedAt',
  ELEMENT_INSTANCE_ID = 'id',
  ELEMENT_INSTANCE_TENANT_ID = 'tenantId',
  ELEMENT_INSTANCE_ELEMENT_KEY = 'elementKey',
  ELEMENT_INSTANCE_USER_ID = 'userId',
  ELEMENT_INSTANCE_VALUE = 'value',
  ELEMENT_INSTANCE_DATA = 'data',
  ELEMENT_INSTANCE_CREATED_AT = 'createdAt',
  ELEMENT_INSTANCE_UPDATED_AT = 'updatedAt',
  ELEMENT_INSTANCE_REVIEW_ID = 'reviewId',
  ELEMENT_INSTANCE_REVIEW_STATUS = 'status',
  ELEMENT_AND_INSTANCE__NAME = 'name',
  ELEMENT_AND_INSTANCE__ELEMENT = 'element',
  ELEMENT_AND_INSTANCE__ELEMENT_INSTANCE = 'elementInstance',
  ELEMENT_AND_INSTANCE__RELATED_ELEMENTS = 'relatedElements',
}

export enum KycElementNaturalPersonKeys {
  FIRST_NAME_LIGHT = 'firstName_natural',
  LAST_NAME_LIGHT = 'lastName_natural',
  ADDRESS_LIGHT = 'adress_natural',
  EMAIL_LIGHT = 'email_natural',
  PHONE_NUMBER_LIGHT = 'phoneNumber_natural',
  ID_NUMBER_LIGHT = 'ID_natural', // which ID ?
  INCOME_STATEMENT_LIGHT = 'incomeStatement_natural',
  COUNTRY_LIGHT = 'countryOfResidence_natural',
  PROOF_OF_RESIDENCE_LIGHT = 'proofOfResidence_natural',
  FIRST_NAME = 'firstName_personalInformation_identification',
  LAST_NAME = 'lastName_personalInformation_identification',
  EMAIL = 'email_personalInformation_identification',
  ADDRESS_FIRST_LINE = 'addressLine1_address_identification',
  ADDRESS_SECOND_LINE = 'addressLine2_address_identification',
  CITY = 'addressCity_address_identification',
  COUNTRY = 'addressCountry_address_identification',
  STATE = 'addressState_address_identification',
  ZIP_CODE = 'addressZip_address_identification',
  PHONE_NUMBER = 'addressPhone_address_identification',
  BANK_NAME = 'bankName_bankDetails_identification',
  IBAN = 'bankIBAN_bankDetails_identification',
  BIC = 'bankBIC_bankDetails_identification',
}

export interface KycElementInput {
  [keys.ELEMENT_INPUT__LABEL]: TranslatedString;
  [keys.ELEMENT_INPUT__RELATED_ELEMENTS]: Array<string>;
  [keys.ELEMENT_INPUT__VALUE]: string;
}

export interface KycElement {
  [keys.ELEMENT_ID]: string;
  [keys.ELEMENT_TENANT_ID]: string;
  [keys.ELEMENT_KEY]: string;
  [keys.ELEMENT_TYPE]: ElementType;
  [keys.ELEMENT_STATUS]: ElementStatus;
  [keys.ELEMENT_LABEL]: TranslatedString;
  [keys.ELEMENT_PLACEHOLDER]: TranslatedString;
  [keys.ELEMENT_INPUTS]: Array<KycElementInput>;
  [keys.ELEMENT_DATA]: any;
  [keys.ELEMENT_CREATED_AT]: Date;
  [keys.ELEMENT_UPDATED_AT]: Date;
}

export interface KycElementInstance {
  [keys.ELEMENT_INSTANCE_ID]: string;
  [keys.ELEMENT_INSTANCE_TENANT_ID]: string;
  [keys.ELEMENT_INSTANCE_ELEMENT_KEY]: string;
  [keys.ELEMENT_INSTANCE_USER_ID]: string;
  [keys.ELEMENT_INSTANCE_VALUE]: Array<string>;
  [keys.ELEMENT_INSTANCE_DATA]: any;
  [keys.ELEMENT_INSTANCE_CREATED_AT]: Date;
  [keys.ELEMENT_INSTANCE_UPDATED_AT]: Date;
  [keys.ELEMENT_INSTANCE_REVIEW_ID]?: string;
  [keys.ELEMENT_INSTANCE_REVIEW_STATUS]?: ReviewStatus;
}

export interface KycElementAndElementInstance {
  [keys.ELEMENT_AND_INSTANCE__NAME]: string;
  [keys.ELEMENT_AND_INSTANCE__ELEMENT]: KycElement;
  [keys.ELEMENT_AND_INSTANCE__ELEMENT_INSTANCE]: KycElementInstance;
  [keys.ELEMENT_AND_INSTANCE__RELATED_ELEMENTS]: Array<KycElementAndElementInstance>;
}

export const KycElementExample: KycElement = {
  [keys.ELEMENT_ID]: '46fbc854-0083-4219-b909-0be6b4d63b13',
  [keys.ELEMENT_TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.ELEMENT_KEY]: 'firstName_natural',
  [keys.ELEMENT_TYPE]: ElementType.STRING,
  [keys.ELEMENT_STATUS]: ElementStatus.MANDATORY,
  [keys.ELEMENT_LABEL]: {
    [TranslationKeys.EN]: 'First name',
    [TranslationKeys.FR]: 'Prénom',
  },
  [keys.ELEMENT_PLACEHOLDER]: {
    [TranslationKeys.EN]: 'Ex: John',
    [TranslationKeys.FR]: 'Ex: Francois',
  },
  [keys.ELEMENT_INPUTS]: [],
  [keys.ELEMENT_DATA]: {},
  [keys.ELEMENT_CREATED_AT]: new Date('December 19, 1990 08:24:00'),
  [keys.ELEMENT_UPDATED_AT]: new Date('December 19, 1990 08:24:00'),
};

export const KycElementInstanceExample: KycElementInstance = {
  [keys.ELEMENT_INSTANCE_ID]: '',
  [keys.ELEMENT_INSTANCE_TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.ELEMENT_INSTANCE_ELEMENT_KEY]: KycElementExample[keys.ELEMENT_KEY],
  [keys.ELEMENT_INSTANCE_USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [keys.ELEMENT_INSTANCE_VALUE]: ['John'],
  [keys.ELEMENT_INSTANCE_DATA]: {},
  [keys.ELEMENT_INSTANCE_CREATED_AT]: new Date('December 19, 1990 08:24:00'),
  [keys.ELEMENT_INSTANCE_UPDATED_AT]: new Date('December 19, 1990 08:24:00'),
};

export const KycElementAndElementInstanceExample: KycElementAndElementInstance =
  {
    [keys.ELEMENT_AND_INSTANCE__NAME]: KycElementExample[keys.ELEMENT_KEY],
    [keys.ELEMENT_AND_INSTANCE__ELEMENT]: KycElementExample,
    [keys.ELEMENT_AND_INSTANCE__ELEMENT_INSTANCE]: KycElementInstanceExample,
    [keys.ELEMENT_AND_INSTANCE__RELATED_ELEMENTS]: [],
  };
