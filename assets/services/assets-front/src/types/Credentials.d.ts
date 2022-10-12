export enum keys {
  ID = 'id',
  NAME = 'name',
  VALUES = 'values',
  POSTMAN_VARIABLE_SCOPE = '_postman_variable_scope',
  POSTMAN_EXPORTED_AT = '_postman_exported_at',
  POSTMAN_EXPORTED_USING = '_postman_exported_using',
  VALUE_KEY = 'key',
  VALUE_VALUE = 'value',
  VALUE_ENABLED = 'enabled',
}

export interface PostmanValues {
  [keys.VALUE_KEY]: string;
  [keys.VALUE_VALUE]: string;
  [keys.VALUE_ENABLED]: boolean;
}

export interface PostmanCredentials {
  [keys.ID]: string;
  [keys.NAME]: string;
  [keys.VALUES]: Array<PostmanValues>;
  [keys.POSTMAN_VARIABLE_SCOPE]: string;
  [keys.POSTMAN_EXPORTED_AT]: string;
  [keys.POSTMAN_EXPORTED_USING]: string;
}
