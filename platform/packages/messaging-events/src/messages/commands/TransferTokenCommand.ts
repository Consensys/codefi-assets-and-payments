import { Builder, IBuilder } from 'builder-pattern';
import { ITokenCommand, TokenCommand } from '../TokenCommand';
import { TransferTokenCommandSchema } from '../../schemas/TransferTokenCommandSchema';
import { TokenType } from '@codefi-assets-and-payments/ts-types';

export class TransferTokenCommand extends TokenCommand {
  public messageName = 'transfer_token';
  public messageSchema: any = TransferTokenCommandSchema.schema;
}

export interface ITransferTokenCommand extends ITokenCommand {
  type: TokenType;
  amount: string | null;
  recipient: string | null;
  from: string | null;
  tokenId: string | null;
  partition: string | null;
}

export abstract class TransferTokenCommandBuilder {
  public static get(
    type: TokenType,
    operationId: string,
    subject: string,
    tenantId: string,
    entityId?: string | null,
  ): IBuilder<ITransferTokenCommand> {
    const command: ITransferTokenCommand = {
      recipient: null,
      amount: null,
      partition: null,
      from: null,
      txConfig: null,
      tokenId: null,
      type,
      operationId,
      subject,
      tenantId,
      entityId,
    };

    return Builder<ITransferTokenCommand>(command);
  }
}
