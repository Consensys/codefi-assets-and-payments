import { AbstractMessage } from '../AbstractMessage';
import { AttestDataCommandSchema } from '../../schemas/AttestDataCommandSchema';

/**
 * This command will be consumed by attestation-data-api
 *
 */
export class AttestDataCommand extends AbstractMessage<IAttestDataCommand> {
  protected messageName = 'attest_data_command';
  public messageSchema: any = AttestDataCommandSchema.schema;
}

export interface IAttestDataCommand {
  id: string;
  data: string;
  tenantId: string;
  createdBy: string;
}
