import { AbstractMessage } from '../AbstractMessage';
import { externalKYCResultSchema } from '../../schemas/ExternalKYCResult';

/**
 * This event is emitted when ...
 */
export class ExternalKYCResultEvent extends AbstractMessage<IExternalKYCResult> {
  protected messageName = 'external_kyc_result';
  public messageSchema: any = externalKYCResultSchema;
}

export interface IExternalKYCResult {
  userId: string;
  scope: KYCScope;
  errors: { [key: string]: string[] };
  reportName?: string;
  message?: string;
  result: KYCResult;
}

export enum KYCResult {
  Pass = 'PASS',
  Fail = 'FAIL',
}

export enum KYCScope {
  All = 'ALL',
  Id = 'ID',
  Identity = 'IDENTITY',
}
