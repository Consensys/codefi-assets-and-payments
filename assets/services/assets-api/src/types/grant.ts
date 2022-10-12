import config from 'src/config';
import {
  keys as ClientKeys,
  ClientApplicationExample,
} from './clientApplication';

const AUTH_ACCEPTED_AUDIENCE: string = config().acceptedAudience;

export const tenantNameExample = 'Acme Corp';

export const ASSETS_API_REQUIRED_SCOPES: Array<string> = ['create:users'];

export enum ConfigType {
  CUSTOM = 'custom',
  DEFAULT = 'default',
}

export enum keys {
  ID = 'id',
  CLIENT_ID = 'client_id',
  AUDIENCE = 'audience',
  SCOPE = 'scope',
}

export interface Grant {
  [keys.ID]: string;
  [keys.CLIENT_ID]: string;
  [keys.AUDIENCE]: string;
  [keys.SCOPE]: Array<string>;
}

export const GrantExample: Grant = {
  [keys.ID]: 'cgr_MndMtEP6eYV7SQsd',
  [keys.CLIENT_ID]: ClientApplicationExample[ClientKeys.CLIENT_ID],
  [keys.AUDIENCE]: AUTH_ACCEPTED_AUDIENCE,
  [keys.SCOPE]: ['create:users'],
};
