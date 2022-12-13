import { Builder, IBuilder } from 'builder-pattern';
import { ITokenCommand, TokenCommand } from '../TokenCommand';
import { TokenType } from '@consensys/ts-types';
import { BurnTokenCommandSchema } from '../../schemas/BurnTokenCommandSchema';

export class BurnTokenCommand extends TokenCommand {
  public messageName = 'burn_token';
  public messageSchema: any = BurnTokenCommandSchema.schema;
}
export interface IBurnTokenCommand extends ITokenCommand {
  type: TokenType;
  amount: string;
  account: string | null;
  tokenId: string | null;
  partition: string | null;
}
export abstract class BurnTokenCommandBuilder {
  public static get(
    type: TokenType,
    amount: string,
    operationId: string,
    subject: string,
    tenantId: string,
    entityId?: string | null,
  ): IBuilder<IBurnTokenCommand> {
    const command: IBurnTokenCommand = {
      partition: null,
      account: null,
      txConfig: null,
      tokenId: null,
      type,
      amount,
      operationId,
      subject,
      tenantId,
      entityId,
    };

    return Builder<IBurnTokenCommand>(command);
  }
}
