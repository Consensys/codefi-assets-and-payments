import { TokenType } from '@consensys/ts-types';

import { TokenRegisteredEventSchema } from '../../schemas/TokenRegisteredEventSchema';
import { AbstractMessage } from '../AbstractMessage';

export class TokenRegisteredEvent extends AbstractMessage<ITokenRegisteredEvent> {
  protected messageName = 'token_registered';
  public messageSchema: any = TokenRegisteredEventSchema.schema;
}

export interface ITokenRegisteredEvent {
  operationId: string;
  type: TokenType;
  name: string;
  symbol: string;
  decimals: number | null;
  chainName: string;
  contractAddress: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
}
