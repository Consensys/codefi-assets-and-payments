export enum keys {
  KEY = 'key',
  VALUE = 'value',
}

export interface AssetElementInstance {
  [keys.KEY]: string;
  [keys.VALUE]: string[];
}

export const AssetElementInstanceExample: AssetElementInstance = {
  [keys.KEY]: 'fundInformations_fundName',
  [keys.VALUE]: ['ConsenSys Capital'],
};
