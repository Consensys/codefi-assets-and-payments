import { AbstractMessage } from '../AbstractMessage';
import { RegisterAccountCommandSchema } from '../../schemas/RegisterAccountCommandSchema';
import { Builder, IBuilder } from 'builder-pattern';
import { ITransactionConfig } from '@codefi-assets-and-payments/ts-types';

export class RegisterAccountCommand extends AbstractMessage<IRegisterAccountCommand> {
  public messageName = 'register_account';
  public messageSchema: any = RegisterAccountCommandSchema.schema;
}

export interface IRegisterAccountCommand {
  address: string;
  type: string;
  tenantId: string;
  entityId: string;
  createdBy: string;
  txConfig: ITransactionConfig | null;
}

export abstract class RegisterAccountCommandBuilder {
  public static get(
    address: string,
    type: string,
    tenantId: string,
    entityId: string,
    createdBy: string,
  ): IBuilder<IRegisterAccountCommand> {
    const command: IRegisterAccountCommand = {
      address,
      type,
      tenantId,
      entityId,
      createdBy,
      txConfig: null,
    };

    return Builder<IRegisterAccountCommand>(command);
  }
}
