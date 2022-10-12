import {
  keys as ClientKeys,
  ClientApplicationExample,
  tenantNameExample,
} from './clientApplication';
import { keys as UserKeys, UserExample } from './user';

import config from 'src/config';

const APP_URL: string = config().appUrl;
const AUTH0_URL: string = config().auth0Url;
const AUTH_ACCEPTED_AUDIENCE: string = config().acceptedAudience;

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

let authUrlExample: string = AUTH0_URL;
if (authUrlExample.endsWith('/')) {
  authUrlExample = authUrlExample.slice(0, -1);
}

export const PostmanCredentialsExample: PostmanCredentials = {
  [keys.ID]: '899cb848-10f2-40a3-a028-9e28c9356746',
  [keys.NAME]: `dev-eu.codefi.${tenantNameExample
    .toLowerCase()
    .split(' ')
    .join('.')}`,
  [keys.VALUES]: [
    {
      key: 'CODEFI_API_ROOT',
      value: `${APP_URL}/api/assets`,
      enabled: true,
    },
    {
      key: 'CODEFI_API',
      value: '{{CODEFI_API_ROOT}}/v2',
      enabled: true,
    },
    {
      key: 'AUTH_URL',
      value: authUrlExample,
      enabled: true,
    },
    {
      key: 'AUTH_AUDIENCE',
      value: AUTH_ACCEPTED_AUDIENCE,
      enabled: true,
    },
    {
      key: 'AUTH_CLIENT_ID',
      value: ClientApplicationExample[ClientKeys.CLIENT_ID],
      enabled: true,
    },
    {
      key: 'AUTH_CLIENT_SECRET',
      value: ClientApplicationExample[ClientKeys.CLIENT_SECRET],
      enabled: true,
    },
    {
      key: 'AUTH_USERNAME',
      value: UserExample[UserKeys.EMAIL],
      enabled: true,
    },
    {
      key: 'AUTH_PASSWORD',
      value: `${process.env.DEFAULT_PASSWORD}`,
      enabled: true,
    },
  ],
  [keys.POSTMAN_VARIABLE_SCOPE]: 'environment',
  [keys.POSTMAN_EXPORTED_AT]: '2020-09-10T08:50:24.603Z',
  [keys.POSTMAN_EXPORTED_USING]: 'Postman/7.31.1',
};
