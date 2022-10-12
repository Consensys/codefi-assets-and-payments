import { AbstractMessage } from '../AbstractMessage';
import { DataAttestedEventSchema } from '../../schemas/DataAttestedEventSchema';

/**
 * This event is emitted when data is attested
 * in the platform using Data Attestation API
 */
export class DataAttestedEvent extends AbstractMessage<IDataAttestedEvent> {
  protected messageName = 'data_attested';
  public messageSchema: any = DataAttestedEventSchema.schema;
}

export interface IDataAttestedEvent {
  dataId: string;
  dataMerkleProof: any;
  merkleRootHash: string;
  date: string;
}
