import { RegisterTokenCommandSchema } from '../../schemas/RegisterTokenCommandSchema';
import { ITokenCommand, TokenCommand } from '../TokenCommand';
import { Builder, IBuilder } from 'builder-pattern';
import { TokenType } from '@consensys/ts-types';

export class RegisterTokenCommand extends TokenCommand {
  public messageName = 'register_token';
  public messageSchema: any = RegisterTokenCommandSchema.schema;
}

export interface IRegisterTokenCommand extends ITokenCommand {
  type: TokenType;
  contractAddress: string;
  chainName: string;
}

export abstract class RegisterTokenCommandBuilder {
  public static get(
    type: TokenType,
    contractAddress: string,
    operationId: string,
    chainName: string,
    subject: string,
    tenantId: string,
    entityId?: string | null,
  ): IBuilder<IRegisterTokenCommand> {
    const command: IRegisterTokenCommand = {
      type,
      contractAddress,
      chainName,
      operationId,
      tenantId,
      subject,
      txConfig: null,
      entityId,
    };

    return Builder<IRegisterTokenCommand>(command);
  }
}
