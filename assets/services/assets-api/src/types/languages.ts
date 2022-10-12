export enum keys {
  EN = 'en',
  FR = 'fr',
}

export interface TranslatedString {
  [keys.EN]: string;
  [keys.FR]: string;
}

export const TranslatedStringExample: TranslatedString = {
  [keys.EN]: 'This is a placeholder text written in english',
  [keys.FR]: "Ceci est un texte d'exemple écrit en francais",
};
