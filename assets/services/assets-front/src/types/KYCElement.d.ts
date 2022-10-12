import {
  ElementStatus,
  ElementType,
} from 'routes/Issuer/AssetIssuance/elementsTypes';

export interface IKYCElement {
  inputs: Array<{
    id: number;
    label: { [key: string]: string };
    value: string;
    relatedElements: Array<string>;
  }>;
  key: string;
  label: {
    [key: string]: string;
  };
  placeholder?: {
    [key: string]: string;
  };
  status: ElementStatus;
  type: ElementType;
  createdAt: string;
  data: {
    validation: {
      isEmail: boolean;
      status: ElementStatus;
    };
    docId?: string;
    signatureLink?: string;
  };
  id: string;
  updatedAt: string;
}
