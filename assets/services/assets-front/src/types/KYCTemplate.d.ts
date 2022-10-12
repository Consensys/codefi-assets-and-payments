import { IKYCTopSection } from './KYCTopSection';

export interface IKYCTemplate {
  createdAt: string;
  data: {
    [key: string]: string | any;
  };
  issuerId: string;
  name: string;
  id: string;
  topSections: Array<IKYCTopSection>;
  updatedAt: string;
}
