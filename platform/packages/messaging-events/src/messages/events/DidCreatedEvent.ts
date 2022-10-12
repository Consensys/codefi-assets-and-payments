import { AbstractMessage } from '../AbstractMessage';
import { DidCreatedEventSchema } from '../../schemas/DidCreatedEventSchema';

/**
 * This command will be consumed by attestation-data-api
 *
 */
export class DidCreatedEvent extends AbstractMessage<IDidCreatedEvent> {
  protected messageName = 'did_created';
  public messageSchema: any = DidCreatedEventSchema.schema;
}

export interface IDidCreatedEvent {
  alias: string;
  did: string;
  provider: string;
  type: 'client' | 'user';
}
