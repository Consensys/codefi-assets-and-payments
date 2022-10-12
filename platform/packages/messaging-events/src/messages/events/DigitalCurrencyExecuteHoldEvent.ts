import { DigitalCurrencyExecuteHoldEventSchema } from '../../schemas/DigitalCurrencyExecuteHoldEventSchema';
import { AbstractMessage } from '../AbstractMessage';

export class DigitalCurrencyExecuteHoldEvent extends AbstractMessage<IDigitalCurrencyExecuteHoldEvent> {
  protected messageName = 'digital_currency_execute_hold';
  public messageSchema: any = DigitalCurrencyExecuteHoldEventSchema.schema;
}

export interface IDigitalCurrencyExecuteHoldEvent {
  holdId: string;
  lockPreimage: string;
}
