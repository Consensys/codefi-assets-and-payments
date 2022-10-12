import { AbstractMessage } from '../AbstractMessage';
import { PrivateChannelCommandSchema } from '../../schemas/PrivateChannelCommandSchema';

/**
 * This command will be consumed by private-channels-api
 *
 */
export class PrivateChannelCommand extends AbstractMessage<IPrivateChannelCommand> {
  protected messageName = 'private_channel_command';
  public messageSchema: any = PrivateChannelCommandSchema.schema;
}

export enum ChainType {
  QUORUM = 'QUORUM',
  BESU = 'BESU',
}

export interface IPrivateChannelCommand {
  id: string;
  participants: string[];
  createdBy: string;
  name: string;
  description: string;
  type: ChainType;
  chainName?: string;
  tenantId?: string;
  entityId?: string;
}
