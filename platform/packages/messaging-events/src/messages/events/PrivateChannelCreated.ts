import { AbstractMessage } from '../AbstractMessage';
import { PrivateChannelCreatedEventSchema } from '../../schemas/PrivateChannelCreatedEventSchema';

export class PrivateChannelCreatedEvent extends AbstractMessage<IPrivateChannelCreatedEvent> {
  protected messageName = 'private_channel_created';
  public messageSchema: any = PrivateChannelCreatedEventSchema.schema;
}

export interface IPrivateChannelCreatedEvent {
  id: string;
  channelName: string;
  description: string;
  chainName: string;
  transactionHash: string;
  blockNumber: number;
  participants: string[];
  privacyGroup: string;
  contractAddress: string;
}
