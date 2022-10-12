import { AbstractMessage } from '../AbstractMessage';
import { PrivateDataSharedEventSchema } from '../../schemas/PrivateDataSharedEventSchema';

export class PrivateDataSharedEvent extends AbstractMessage<IPrivateDataSharedEvent> {
  protected messageName = 'private_channel_shared_data';
  public messageSchema: any = PrivateDataSharedEventSchema.schema;
}

export interface IPrivateDataSharedEvent {
  id: string;
  data: string;
  privateChannelId: string;
  transactionHash: string;
  blockNumber: number;
  chainName?: string;
}
