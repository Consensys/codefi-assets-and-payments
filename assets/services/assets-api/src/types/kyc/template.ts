import { keys as TranslationKeys, TranslatedString } from '../languages';
import {
  KycElementAndElementInstance,
  KycElementAndElementInstanceExample,
} from './element';

if (!process.env.DEFAULT_KYC_TEMPLATE_NAME) {
  throw new Error(
    'shall never happen: env. variable with name DEFAULT_KYC_TEMPLATE_NAME is not defined',
  );
}
export const DEFAULT_KYC_TEMPLATE_NAME = process.env.DEFAULT_KYC_TEMPLATE_NAME;

export enum keys {
  TEMPLATE_ID = 'id',
  TENANT_ID = 'tenantId',
  ISSUER_ID = 'issuerId',
  NAME = 'name',
  TOP_SECTIONS = 'topSections',
  TOP_SECTIONS__LABEL = 'label',
  TOP_SECTIONS__KEY = 'key',
  TOP_SECTIONS__SECTIONS = 'sections',
  SECTIONS__KEY = 'key',
  SECTIONS__LABEL = 'label',
  SECTIONS__ELEMENTS = 'elements',
  DATA = 'data',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export const NATURAL_PERSON_SECTION = 'naturalPersonSection';
export const LEGAL_PERSON_SECTION = 'legalPersonSection';

/************************* Raw KYC template ****************************/

export interface RawKycTemplateSection {
  [keys.SECTIONS__KEY]: string;
  [keys.SECTIONS__LABEL]: TranslatedString;
  [keys.SECTIONS__ELEMENTS]: Array<string>;
}

export interface RawKycTemplateTopSection {
  [keys.TOP_SECTIONS__KEY]: string;
  [keys.TOP_SECTIONS__LABEL]: TranslatedString;
  [keys.TOP_SECTIONS__SECTIONS]: Array<RawKycTemplateSection>;
}

export interface RawKycTemplate {
  [keys.TEMPLATE_ID]: string;
  [keys.TENANT_ID]: string;
  [keys.ISSUER_ID]: string;
  [keys.NAME]: string;
  [keys.TOP_SECTIONS]: Array<RawKycTemplateTopSection>;
  [keys.DATA]: any;
}

/************************* Examples ****************************/

export const RawKycTemplateSectionExample: RawKycTemplateSection = {
  [keys.SECTIONS__KEY]: 'one',
  [keys.SECTIONS__LABEL]: {
    [TranslationKeys.EN]: 'Part 1',
    [TranslationKeys.FR]: 'Partie 1',
  },
  [keys.SECTIONS__ELEMENTS]: [
    'firstName_natural',
    'lastName_natural',
    'adress_natural',
    'email_natural',
    'phoneNumber_natural',
  ],
};

export const RawKycTemplatetopSectionExample: RawKycTemplateTopSection = {
  [keys.TOP_SECTIONS__KEY]: 'naturalPersonSection',
  [keys.TOP_SECTIONS__LABEL]: {
    [TranslationKeys.EN]: 'Natural Person',
    [TranslationKeys.FR]: 'Personne physique',
  },
  [keys.TOP_SECTIONS__SECTIONS]: [RawKycTemplateSectionExample],
};

export const RawKycTemplateExample: RawKycTemplate = {
  [keys.TEMPLATE_ID]: 'ddb8a64b-004f-4800-a166-af9d93ede5ae',
  [keys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.ISSUER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [keys.NAME]: 'Codefi demo template',
  [keys.TOP_SECTIONS]: [RawKycTemplatetopSectionExample],
  [keys.DATA]: {},
};

/************************* KYC template ****************************/

export interface KycTemplateSection {
  [keys.SECTIONS__KEY]: string;
  [keys.SECTIONS__LABEL]: TranslatedString;
  [keys.SECTIONS__ELEMENTS]: Array<KycElementAndElementInstance>;
}

export interface KycTemplateTopSection {
  [keys.TOP_SECTIONS__KEY]: string;
  [keys.TOP_SECTIONS__LABEL]: TranslatedString;
  [keys.TOP_SECTIONS__SECTIONS]: Array<KycTemplateSection>;
}

export interface KycTemplate {
  [keys.TEMPLATE_ID]: string;
  [keys.ISSUER_ID]: string;
  [keys.NAME]: string;
  [keys.TOP_SECTIONS]: Array<KycTemplateTopSection>;
  [keys.DATA]: any;
}

/************************* Examples ****************************/

export const KycTemplateSectionExample: KycTemplateSection = {
  [keys.SECTIONS__KEY]: RawKycTemplateSectionExample[keys.SECTIONS__KEY],
  [keys.SECTIONS__LABEL]: RawKycTemplateSectionExample[keys.SECTIONS__LABEL],
  [keys.SECTIONS__ELEMENTS]: [KycElementAndElementInstanceExample],
};

export const KycTemplatetopSectionExample: KycTemplateTopSection = {
  [keys.TOP_SECTIONS__KEY]:
    RawKycTemplatetopSectionExample[keys.TOP_SECTIONS__KEY],
  [keys.TOP_SECTIONS__LABEL]:
    RawKycTemplatetopSectionExample[keys.TOP_SECTIONS__LABEL],
  [keys.TOP_SECTIONS__SECTIONS]: [KycTemplateSectionExample],
};

export const KycTemplateExample: KycTemplate = {
  [keys.TEMPLATE_ID]: RawKycTemplateExample[keys.TEMPLATE_ID],
  [keys.ISSUER_ID]: RawKycTemplateExample[keys.ISSUER_ID],
  [keys.NAME]: RawKycTemplateExample[keys.NAME],
  [keys.TOP_SECTIONS]: [KycTemplatetopSectionExample],
  [keys.DATA]: {},
};
