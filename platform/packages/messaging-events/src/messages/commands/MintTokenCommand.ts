import { MintTokenCommandSchema } from '../../schemas/MintTokenCommandSchema';
import { Builder, IBuilder } from 'builder-pattern';
import { ITokenCommand, TokenCommand } from '../TokenCommand';
import { TokenType } from '@consensys/ts-types';

export class MintTokenCommand extends TokenCommand {
  public messageName = 'mint_token';
  public messageSchema: any = MintTokenCommandSchema.schema;
}
export interface IMintTokenCommand extends ITokenCommand {
  type: TokenType;
  amount: string | null;
  account: string | null;
  tokenId: string | null;
  partition: string | null;
}
export abstract class MintTokenCommandBuilder {
  public static get(
    type: TokenType,
    operationId: string,
    subject: string,
    tenantId: string,
    entityId?: string | null,
  ): IBuilder<IMintTokenCommand> {
    const command: IMintTokenCommand = {
      amount: null,
      partition: null,
      account: null,
      txConfig: null,
      tokenId: null,
      type,
      operationId,
      subject,
      tenantId,
      entityId,
    };

    return Builder<IMintTokenCommand>(command);
  }
}
