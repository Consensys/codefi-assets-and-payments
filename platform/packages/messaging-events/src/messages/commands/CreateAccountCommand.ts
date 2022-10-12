import { AbstractMessage } from '../AbstractMessage';
import { CreateAccountCommandSchema } from '../../schemas/CreateAccountCommandSchema';
import { Builder, IBuilder } from 'builder-pattern';
import { ITransactionConfig } from '@codefi-assets-and-payments/ts-types';

export class CreateAccountCommand extends AbstractMessage<ICreateAccountCommand> {
  public messageName = 'create_account';
  public messageSchema: any = CreateAccountCommandSchema.schema;
}

export interface ICreateAccountCommand {
  tenantId: string;
  entityId: string;
  createdBy: string;
  txConfig: ITransactionConfig | null;
}

export abstract class CreateAccountCommandBuilder {
  public static get(
    tenantId: string,
    entityId: string,
    createdBy: string,
  ): IBuilder<ICreateAccountCommand> {
    const command: ICreateAccountCommand = {
      tenantId,
      entityId,
      createdBy,
      txConfig: null,
    };

    return Builder<ICreateAccountCommand>(command);
  }
}
