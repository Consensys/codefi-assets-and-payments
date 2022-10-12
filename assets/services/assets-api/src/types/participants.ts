export enum keys {
  BORROWER_ID = 'borrowerId',
  UNDERWRITER_ID = 'underwriterId',
}

export interface Participants {
  [keys.BORROWER_ID]: string;
  [keys.UNDERWRITER_ID]: string;
}

export const ParticipantsExample: Participants = {
  [keys.BORROWER_ID]: '53e059ee-45f0-4335-8c5a-ac2df21b9df3',
  [keys.UNDERWRITER_ID]: '70e059ee-45f0-4335-8c5a-bc2df21b9df3',
};
