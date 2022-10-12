export enum Source {
  DAPHNE = 'daphne',
}

export enum keys {
  SOURCE = 'source',
  PROJECT_ID = 'projectId',
  PROJECT_METADATA = 'projectMetaData',
  ENCUMBERED = 'encumbered',
}

export interface ExternalImporter {
  [keys.SOURCE]: Source;
  [keys.PROJECT_ID]: string;
  [keys.PROJECT_METADATA]?: object;
  [keys.ENCUMBERED]?: boolean;
}

export const ExternalImporterExample: ExternalImporter = {
  [keys.SOURCE]: Source.DAPHNE,
  [keys.PROJECT_ID]: '70e059ee-45f0-4335-8c5a-bc2df21b9df3',
  [keys.ENCUMBERED]: true,
};
