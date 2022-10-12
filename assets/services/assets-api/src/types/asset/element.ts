import { TranslatedString, TranslatedStringExample } from '../languages';

export enum AssetElementType {
  string = 'string',
  document = 'document',
  check = 'check',
  radio = 'radio',
  multistring = 'multistring',
  number = 'number',
  date = 'date',
  time = 'time',
  percentage = 'percentage',
  timeAfterSubscription = 'timeAfterSubscription',
  title = 'title',
}

export enum AssetElementStatus {
  mandatory = 'mandatory',
  optional = 'optional',
  conditionalOptional = 'conditionalOptional',
  conditionalMandatory = 'conditionalMandatory',
}

export enum AssetElementFileType {
  pdf = 'pdf',
  image = 'image',
}

export enum keys {
  ID = 'id',
  TENANT_ID = 'tenantId',
  NAME = 'name',
  KEY = 'key',
  TYPE = 'type',
  STATUS = 'status',
  LABEL = 'label',
  SUBLABEL = 'sublabel',
  PLACEHOLDER = 'placeholder',
  RIGHTTAG = 'rightTag',
  LEFTTAG = 'leftTag',
  MULTILINE = 'multiline',
  SIZE = 'size',
  FILEACCEPT = 'fileAccept',
  FILL_LINE = 'fillLine',
  INPUTS = 'inputs',
  INPUT__KEY = 'key',
  INPUT__LABEL = 'label',
  OPTIONS = 'options',
  UPDATABLE = 'updatable',
  MAP = 'map',
  DATA = 'data',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export interface AssetElementInput {
  [keys.INPUT__KEY]: string;
  [keys.INPUT__LABEL]: TranslatedString;
}

export interface AssetElement {
  [keys.ID]: string;
  [keys.TENANT_ID]: string;
  [keys.NAME]: string;
  [keys.KEY]: string;
  [keys.TYPE]: AssetElementType;
  [keys.STATUS]: AssetElementStatus;
  [keys.LABEL]: TranslatedString;
  [keys.SUBLABEL]: TranslatedString;
  [keys.PLACEHOLDER]: TranslatedString;
  [keys.RIGHTTAG]: TranslatedString;
  [keys.LEFTTAG]: TranslatedString;
  [keys.MULTILINE]: boolean;
  [keys.SIZE]: 1 | 2 | 3 | 4 | 5;
  [keys.FILEACCEPT]: AssetElementFileType;
  [keys.FILL_LINE]: boolean;
  [keys.INPUTS]?: Array<AssetElementInput>;
  [keys.OPTIONS]: any;
  [keys.DATA]: any;
  [keys.UPDATABLE]: boolean;
  [keys.MAP]: string;
  [keys.CREATED_AT]?: Date;
  [keys.UPDATED_AT]?: Date;
}

export const AssetElementExample: AssetElement = {
  [keys.ID]: '6a6a7e44-3d55-4b81-8d40-77425ab55205',
  [keys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.NAME]: '',
  [keys.KEY]: 'fundInformations_fundName',
  [keys.TYPE]: AssetElementType.string,
  [keys.STATUS]: AssetElementStatus.mandatory,
  [keys.LABEL]: TranslatedStringExample,
  [keys.SUBLABEL]: TranslatedStringExample,
  [keys.PLACEHOLDER]: TranslatedStringExample,
  [keys.RIGHTTAG]: TranslatedStringExample,
  [keys.LEFTTAG]: TranslatedStringExample,
  [keys.MULTILINE]: false,
  [keys.SIZE]: 3,
  [keys.FILEACCEPT]: AssetElementFileType.pdf,
  [keys.FILL_LINE]: true,
  [keys.INPUTS]: [],
  [keys.OPTIONS]: {},
  [keys.UPDATABLE]: false,
  [keys.MAP]: 'class.general.name',
  [keys.DATA]: {},
  [keys.CREATED_AT]: new Date('December 17, 1995 03:24:00'),
  [keys.UPDATED_AT]: new Date('December 17, 1995 03:24:00'),
};
