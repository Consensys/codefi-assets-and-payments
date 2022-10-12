import { IKYCElement } from './KYCElement';
import { IKYCElementInstance } from './KYCElementInstance';

export interface IKYCSectionElement {
  name: string;
  element: IKYCElement;
  elementInstance: IKYCElementInstance;
  relatedElements: Array<IKYCSectionElement>;
}
