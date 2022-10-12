import { IKYCSectionElement } from './KYCSectionElement';

export interface IKYCSection {
  elements: Array<IKYCSectionElement>;
  key: string;
  label: {
    [key: string]: string;
  };
  description: {
    [key: string]: string;
  };
}
