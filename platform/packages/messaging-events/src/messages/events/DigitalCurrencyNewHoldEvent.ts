import { DigitalCurrencyNewHoldEventSchema } from '../../schemas/DigitalCurrencyNewHoldEventSchema';
import { AbstractMessage } from '../AbstractMessage';

export class DigitalCurrencyNewHoldEvent extends AbstractMessage<IDigitalCurrencyNewHoldEvent> {
  protected messageName = 'digital_currency_new_hold';
  public messageSchema: any = DigitalCurrencyNewHoldEventSchema.schema;
}

export interface IDigitalCurrencyNewHoldEvent {
  holdId: string;
  sender: string;
  inputNoteHashes: string[];
  outputNoteHashes: string[];
  notary: string;
  expirationDateTime: number;
  lockHash: string;
}
