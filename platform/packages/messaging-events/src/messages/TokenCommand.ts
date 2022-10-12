import { ITransactionConfig } from '@codefi-assets-and-payments/ts-types';
import { Builder, IBuilder } from 'builder-pattern';
import { AbstractMessage } from './AbstractMessage';

/**
 * This command will be consumed by codefi-identity-agent
 *
 */
export abstract class TokenCommand extends AbstractMessage<ITokenCommand> {}

export interface ITokenCommand {
  subject: string;
  tenantId: string;
  entityId: string;
  txConfig: ITransactionConfig | null;
  operationId: string;
  idempotencyKey?: string;
  tokenEntityId?: string;
}

export abstract class TransactionConfigBuilder {
  public static get(from: string): IBuilder<ITransactionConfig> {
    const txConfig: ITransactionConfig = {
      from,
      chainName: null,
      nonce: null,
      to: null,
      gas: null,
      gasPrice: null,
      value: null,
      contractTag: null,
      privateFrom: null,
      privateFor: null,
      privacyGroupId: null,
      protocol: null,
      transactionType: null,
    };

    return Builder<ITransactionConfig>(txConfig);
  }
}
