import { DigitalCurrencyMintedEventSchema } from '../../schemas/DigitalCurrencyMintedEventSchema';
import { AbstractMessage } from '../AbstractMessage';

export class DigitalCurrencyMintedEvent extends AbstractMessage<IDigitalCurrencyMintedEvent> {
  protected messageName = 'digital_currency_minted';
  public messageSchema: any = DigitalCurrencyMintedEventSchema.schema;
}
export interface IDigitalCurrencyMintedEvent {
  tokenId: string;
  toAccountId: string;
  value: number;
}
