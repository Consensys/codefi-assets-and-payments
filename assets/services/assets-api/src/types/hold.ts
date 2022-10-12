//
// The Hold structure detailed below comes from the smart contract
// https://github.com/ConsenSys/UniversalToken/blob/master/contracts/extensions/tokenExtensions/ERC1400TokensValidator.sol#L82
//

import { removeDecimalsFromBalances } from 'src/utils/number';
import { DECIMALS } from 'src/types/decimals';

export enum HoldStatusCode {
  Nonexistent = 'Nonexistent',
  Ordered = 'Ordered',
  Executed = 'Executed',
  ExecutedAndKeptOpen = 'ExecutedAndKeptOpen',
  ReleasedByNotary = 'ReleasedByNotary',
  ReleasedByPayee = 'ReleasedByPayee',
  ReleasedOnExpiration = 'ReleasedOnExpiration',
}

export const HoldStatusCodeMapping = {
  ['0']: HoldStatusCode.Nonexistent,
  ['1']: HoldStatusCode.Ordered,
  ['2']: HoldStatusCode.Executed,
  ['3']: HoldStatusCode.ExecutedAndKeptOpen,
  ['4']: HoldStatusCode.ReleasedByNotary,
  ['5']: HoldStatusCode.ReleasedByPayee,
  ['6']: HoldStatusCode.ReleasedOnExpiration,
};

export enum keys {
  PARTITION = 'partition',
  SENDER = 'sender',
  RECIPIENT = 'recipient',
  NOTARY = 'notary',
  VALUE = 'value',
  EXPIRATION = 'expiration',
  SECRET_HASH = 'secretHash',
  SECRET = 'secret',
  STATUS = 'status',
  STATUS_READABLE = 'statusReadable',
  VALUE_READABLE = 'valueReadable',
}

export interface Hold {
  ['0']: string;
  ['1']: string;
  ['2']: string;
  ['3']: string;
  ['4']: string;
  ['5']: string;
  ['6']: string;
  ['7']: string;
  ['8']: string;
  [keys.PARTITION]: string;
  [keys.SENDER]: string;
  [keys.RECIPIENT]: string;
  [keys.NOTARY]: string;
  [keys.VALUE]: string;
  [keys.EXPIRATION]: string;
  [keys.SECRET_HASH]: string;
  [keys.SECRET]: string;
  [keys.STATUS]: string;
  [keys.STATUS_READABLE]?: string;
  [keys.VALUE_READABLE]?: number;
}

export const HoldExample: Hold = {
  ['0']: '0x697373756564000000000000636c617373610000000000000000000000000000',
  ['1']: '0xbab15B78D2F928b16102e71600b7e032f725B0CE',
  ['2']: '0xcbB90621d6D5ef672c58D9BC3420Aec4de34D0e3',
  ['3']: '0xDa1392b462A9469454F43a3f4cc714998f831212',
  ['4']: '1000000000000000000000',
  ['5']: '1606980447',
  ['6']: '0x352bc2dcfcd69c23f18188f0352fef9f099473d8b3a0cbb0540ae877d66e3e03',
  ['7']: '0x19dcef8275924a7191e62c437dd62f0a3ca8feadf637a7e774393e55fc354ee0',
  ['8']: '2',
  [keys.PARTITION]:
    '0x697373756564000000000000636c617373610000000000000000000000000000',
  [keys.SENDER]: '0xbab15B78D2F928b16102e71600b7e032f725B0CE',
  [keys.RECIPIENT]: '0xcbB90621d6D5ef672c58D9BC3420Aec4de34D0e3',
  [keys.NOTARY]: '0xDa1392b462A9469454F43a3f4cc714998f831212',
  [keys.VALUE]: '1000000000000000000000',
  [keys.EXPIRATION]: '1606980447',
  [keys.SECRET_HASH]:
    '0x352bc2dcfcd69c23f18188f0352fef9f099473d8b3a0cbb0540ae877d66e3e03',
  [keys.SECRET]:
    '0x19dcef8275924a7191e62c437dd62f0a3ca8feadf637a7e774393e55fc354ee0',
  [keys.STATUS]: '2',
  [keys.STATUS_READABLE]: HoldStatusCodeMapping['2'],
  [keys.VALUE_READABLE]: removeDecimalsFromBalances(
    '1000000000000000000000',
    DECIMALS,
  ),
};

export const formatHold = (hold: Hold) => {
  return {
    ...hold,
    ['0']: undefined,
    ['1']: undefined,
    ['2']: undefined,
    ['3']: undefined,
    ['4']: undefined,
    ['5']: undefined,
    ['6']: undefined,
    ['7']: undefined,
    ['8']: undefined,
    [keys.STATUS_READABLE]: HoldStatusCodeMapping[hold[keys.STATUS]],
    [keys.VALUE_READABLE]: removeDecimalsFromBalances(
      hold[keys.VALUE],
      DECIMALS,
    ),
  };
};
