import { DeployTokenCommandSchema } from '../../schemas/DeployTokenCommandSchema';
import { ITokenCommand, TokenCommand } from '../TokenCommand';
import { Builder, IBuilder } from 'builder-pattern';
import { TokenType } from '@codefi-assets-and-payments/ts-types';

export class DeployTokenCommand extends TokenCommand {
  public messageName = 'deploy_token';
  public messageSchema: any = DeployTokenCommandSchema.schema;
}

export interface IDeployTokenCommand extends ITokenCommand {
  type: TokenType;
  name: string;
  symbol: string;
  decimals: number | null;
  confidential: boolean | null;
  controllers: string[] | null;
  defaultPartitions: string[] | null;
  extension: string | null;
  newOwner: string | null;
  certificateSigner: string | null;
  certificateActivated: string | null;
}

export abstract class DeployTokenCommandBuilder {
  public static get(
    type: TokenType,
    name: string,
    symbol: string,
    decimals: number | null,
    operationId: string,
    subject: string,
    tenantId: string,
    entityId?: string | null,
  ): IBuilder<IDeployTokenCommand> {
    const command: IDeployTokenCommand = {
      type,
      name,
      symbol,
      decimals,
      operationId,
      subject,
      tenantId,
      entityId,
      confidential: null,
      controllers: null,
      defaultPartitions: null,
      extension: null,
      newOwner: null,
      certificateSigner: null,
      certificateActivated: null,
      txConfig: null,
    };

    return Builder<IDeployTokenCommand>(command);
  }
}
