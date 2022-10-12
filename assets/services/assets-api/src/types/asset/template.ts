import { TranslatedString, TranslatedStringExample } from '../languages';
import { TokenCategory } from '../smartContract';
import { AssetElement, AssetElementExample } from './element';

export enum AssetType {
  OPEN_END_FUND = 'OPEN_END_FUND',
  CLOSED_END_FUND = 'CLOSED_END_FUND',
  FIXED_RATE_BOND = 'FIXED_RATE_BOND',
  CARBON_CREDITS = 'CARBON_CREDITS',
  PHYSICAL_ASSET = 'PHYSICAL_ASSET',
  CURRENCY = 'CURRENCY',
  COLLECTIBLE = 'COLLECTIBLE',
  // deprecated
  SYNDICATED_LOAN = 'SYNDICATED_LOAN',
}

export interface RawAssetTemplateSection {
  label: TranslatedString;
  key: string;
  elements: Array<string>;
}

export interface RawAssetTemplateTopSection {
  label: TranslatedString;
  key: string;
  sections: Array<RawAssetTemplateSection>;
}

export interface RawAssetTemplate {
  id: string;
  category: TokenCategory;
  tenantId: string;
  name: string;
  title?: TranslatedString;
  type: AssetType;
  label: TranslatedString;
  topSections: Array<RawAssetTemplateTopSection>;
  data: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export const RawAssetTemplateSectionExample: RawAssetTemplateSection = {
  label: TranslatedStringExample,
  key: 'class',
  elements: [
    'fundInformations_fundName',
    'fundInformations_fundSymbol',
    'fundInformations_fundDescription',
  ],
};

export const RawAssetTemplateTopSectionExample: RawAssetTemplateTopSection = {
  label: TranslatedStringExample,
  key: 'class',
  sections: [RawAssetTemplateSectionExample],
};

export const RawAssetTemplateExample: RawAssetTemplate = {
  id: '739d619a-36b1-421e-b78e-a1a6573b101a',
  category: TokenCategory.HYBRID,
  tenantId: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  name: 'closedEndFund',
  title: TranslatedStringExample,
  type: AssetType.CLOSED_END_FUND,
  label: TranslatedStringExample,
  topSections: [RawAssetTemplateTopSectionExample],
  data: {},
  createdAt: new Date('December 17, 1995 03:24:00'),
  updatedAt: new Date('December 17, 1995 03:24:00'),
};

export interface AssetTemplateSection {
  label: TranslatedString;
  key: string;
  elements: Array<AssetElement>;
}

export interface AssetTemplateTopSection {
  label: TranslatedString;
  key: string;
  sections: Array<AssetTemplateSection>;
}

export interface AssetTemplate {
  id: string;
  tenantId: string;
  name: string;
  title?: TranslatedString;
  type: AssetType;
  label: TranslatedString;
  topSections: Array<AssetTemplateTopSection>;
  data: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export const AssetTemplateSectionExample: AssetTemplateSection = {
  ...RawAssetTemplateSectionExample,
  elements: [AssetElementExample],
};

export const AssetTemplateTopSectionExample: AssetTemplateTopSection = {
  ...RawAssetTemplateTopSectionExample,
  sections: [AssetTemplateSectionExample],
};

export const AssetTemplateExample: AssetTemplate = {
  ...RawAssetTemplateExample,
  topSections: [AssetTemplateTopSectionExample],
};
