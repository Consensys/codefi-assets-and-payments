import { Link } from './workflow/workflowInstances/link';
import {
  ReducedUser,
  User,
  ReducedUserExample,
  UserExtendedForProjectExample,
} from './user';
import { UserProjectDataExample, UserProjectData } from './userEntityData';

export enum keys {
  PROJECT_ID = 'id',
  TENANT_ID = 'tenantId',
  KEY = 'key',
  NAME = 'name',
  DESCRIPTION = 'description',
  PICTURE = 'picture',
  BANK_ACCOUNT = 'bankAccount',
  KYC_TEMPLATE_ID = 'kycTemplateId',
  DATA = 'data',
  DATA__BYPASS_KYC_CHECKS = 'bypassKycChecks',
  LINK = 'link',
  ISSUER = 'issuer',
  USER_RELATED_DATA = 'userRelatedData',
  INVESTORS = 'investors',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export interface Project {
  [keys.PROJECT_ID]: string;
  [keys.TENANT_ID]: string;
  [keys.KEY]: string;
  [keys.NAME]: string;
  [keys.DESCRIPTION]: string;
  [keys.PICTURE]: Array<string>;
  [keys.BANK_ACCOUNT]: any;
  [keys.KYC_TEMPLATE_ID]: string;
  [keys.DATA]: {
    [keys.DATA__BYPASS_KYC_CHECKS]?: boolean;
  };
  [keys.CREATED_AT]: Date;
  [keys.UPDATED_AT]: Date;
  [keys.LINK]?: Link;
  [keys.ISSUER]?: ReducedUser;
  [keys.INVESTORS]?: Array<User>;
  [keys.USER_RELATED_DATA]?: UserProjectData;
}

export const ProjectExample: Project = {
  [keys.PROJECT_ID]: 'd4192b60-79b5-429c-9160-e862b5a3e370',
  [keys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.KEY]: 'regCamp-6657422',
  [keys.NAME]: 'RegCamp',
  [keys.DESCRIPTION]: 'A KYT solution',
  [keys.PICTURE]: ['regcamp', 'png'],
  [keys.BANK_ACCOUNT]: {
    IBAN: 'XXX-XXX-XXX-XXX',
    BIC: 'XXXXXX',
  },
  [keys.KYC_TEMPLATE_ID]: '745c87fb-f281-4359-8f00-239dad79cac3',
  [keys.DATA]: {},
  [keys.CREATED_AT]: new Date('September 19, 1990 08:24:00'),
  [keys.UPDATED_AT]: new Date('September 19, 1990 08:24:00'),
};

export const ProjectExtendedExample: Project = {
  ...ProjectExample,
  [keys.ISSUER]: ReducedUserExample,
  [keys.INVESTORS]: [UserExtendedForProjectExample],
  [keys.USER_RELATED_DATA]: UserProjectDataExample,
};
