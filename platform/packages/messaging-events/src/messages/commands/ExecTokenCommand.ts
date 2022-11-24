import { ExecTokenCommandSchema } from '../../schemas/ExecTokenCommandSchema';
import { Builder, IBuilder } from 'builder-pattern';
import { ITokenCommand, TokenCommand } from '../TokenCommand';
import { ExecArgument } from '@consensys/ts-types';

export class ExecTokenCommand extends TokenCommand {
  public messageName = 'exec_token';
  public messageSchema: any = ExecTokenCommandSchema.schema;
}
export interface IExecTokenCommand extends ITokenCommand {
  functionName: string;
  params: ExecArgument[];
}
export abstract class ExecTokenCommandBuilder {
  public static get(
    functionName: string,
    params: ExecArgument[],
    operationId: string,
    subject: string,
    tenantId: string,
    entityId?: string | null,
  ): IBuilder<IExecTokenCommand> {
    const command: IExecTokenCommand = {
      functionName,
      params,
      operationId,
      subject,
      tenantId,
      entityId,
      txConfig: null,
    };

    return Builder<IExecTokenCommand>(command);
  }
}
