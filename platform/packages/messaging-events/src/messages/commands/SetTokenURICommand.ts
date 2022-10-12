import { Builder, IBuilder } from 'builder-pattern';
import { ITokenCommand, TokenCommand } from '../TokenCommand';
import { SetTokenURICommandSchema } from '../../schemas/SetTokenURICommandSchema';

export class SetTokenURICommand extends TokenCommand {
  public messageName = 'set_token_uri';
  public messageSchema: any = SetTokenURICommandSchema.schema;
}
export interface ISetTokenURICommand extends ITokenCommand {
  tokenId: string;
  uri: string;
}
export abstract class SetTokenURICommandBuilder {
  public static get(
    tokenId: string,
    uri: string,
    operationId: string,
    subject: string,
    tenantId: string,
    entityId?: string | null,
  ): IBuilder<ISetTokenURICommand> {
    const command: ISetTokenURICommand = {
      tokenId,
      uri,
      operationId,
      subject,
      tenantId,
      entityId,
      txConfig: null,
    };

    return Builder<ISetTokenURICommand>(command);
  }
}
