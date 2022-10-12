import { ITranslation } from './insuanceDataType';

export enum ElementStatus {
  mandatory = 'mandatory',
  optional = 'optional',
  conditional = 'conditional',
  conditionalOptional = 'conditionalOptional',
  conditionalMandatory = 'conditionalMandatory',
}

export enum ReviewStatus {
  NOT_SHARED = 'NOT_SHARED',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

export enum ElementType {
  string = 'string',
  document = 'document',
  check = 'check',
  radio = 'radio',
  multistring = 'multistring',
  number = 'number',
  title = 'title',
  date = 'date',
  time = 'time',
  percentage = 'percentage',
  docusign = 'docusign',
  team = 'team',
  timeAfterSubscription = 'timeAfterSubscription',
  target = 'target',
  feeWithType = 'feeWithType',
  periodSelect = 'periodSelect',
  perPercentage = 'perPercentage',
  bank = 'bank',
}

export interface IElement {
  type: ElementType;
  label: ITranslation;
  rightTag?: ITranslation;
  leftTag?: ITranslation;
  status?: ElementStatus;
  key: string;
  map: string;
  updatable: boolean;
  multiline?: boolean;
  size?: 1 | 2 | 3 | 4 | 5;
  maxLength?: number;
  fileAccept?: string;
  placeholder?: ITranslation;
  sublabel?: ITranslation;
  name?: string;
  fillLine?: boolean;
  inputs?: Array<{
    key: string;
    label: ITranslation;
    relatedElements?: Array<string>;
  }>;
  options: Array<
    | string
    | {
        label: ITranslation;
        value: string;
      }
  >;
  hidden?: boolean;
  defaultValue?: string;
}
