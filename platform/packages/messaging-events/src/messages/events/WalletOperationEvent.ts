import { WalletType } from '@codefi-assets-and-payments/ts-types';
import { WalletOperationEventSchema } from '../../schemas/WalletOperationEventSchema';
import { AbstractMessage } from '../AbstractMessage';
import { MessageDataOperation } from '../MessageOperation';

export class WalletOperationEvent extends AbstractMessage<IWalletOperationEvent> {
  protected messageName = 'wallet_operation';
  public messageSchema: any = WalletOperationEventSchema.schema;
}

export interface IWalletOperationEvent {
  operation: MessageDataOperation;
  entityId: string;
  address: string;
  type: WalletType;
  storeId?: string;
  metadata: string;
  createdBy: string;
  createdAt: string;
}
