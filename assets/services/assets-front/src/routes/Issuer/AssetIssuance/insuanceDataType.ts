import { IElement } from './elementsTypes';
import { AssetType } from './templatesTypes';

export interface IAssetTemplate {
  id: string;
  name: string;
  type: AssetType;
  label: ITranslation;
  topSections: Array<ITopSection>;
}

export interface IIssuanceDataType {
  name: string;
  label: ITranslation;
  generalSection: ITopSection;
  shareclasses: Array<ITopSection>;
}

export interface ITopSection {
  label: ITranslation;
  legend?: ITranslation;
  sections: Array<ISection>;
  multiple: boolean;
  key: string;
}

export interface ISection {
  label: ITranslation;
  description?: ITranslation;
  key: string;
  elements: Array<IIssuanceElement>;
}

export interface IIssuanceElement extends IElement {
  data: string[];
}

export interface ITranslation {
  [key: string]: string;
}
