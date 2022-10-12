import { IKYCSection } from './KYCSection';

export interface IKYCTopSection {
  key: 'legalPersonSection' | 'naturalPersonSection';
  label: {
    [key: string]: string;
  };
  sections: Array<IKYCSection>;
}
