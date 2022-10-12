import { DigitalCurrencyReleaseHoldEventSchema } from '../../schemas/DigitalCurrencyReleaseHoldEventSchema';
import { AbstractMessage } from '../AbstractMessage';

export class DigitalCurrencyReleaseHoldEvent extends AbstractMessage<IDigitalCurrencyReleaseHoldEvent> {
  protected messageName = 'digital_currency_release_hold';
  public messageSchema: any = DigitalCurrencyReleaseHoldEventSchema.schema;
}

export interface IDigitalCurrencyReleaseHoldEvent {
  holdId: string;
}
