import { keys as UserKeys, UserExample, User, UserType } from './user';

export enum keys {
  USER_ID = 'userId',
  CALLER_ID = 'callerId',
  TENANT_ID = 'tenantId',
  AUTH_ID = 'authId',
  EMAIL = 'email',
  USER = 'user',
  CALLER = 'caller',
  AUTH_TOKEN = 'authToken',
}

export interface IUserContext {
  [keys.TENANT_ID]?: string;
  [keys.USER_ID]?: string;
  [keys.CALLER_ID]?: string;
  [keys.AUTH_ID]?: string;
  [keys.EMAIL]?: string;
  [keys.USER]?: User;
  [keys.CALLER]?: User;
  [keys.AUTH_TOKEN]?: string;
}

export const UserContextExample: IUserContext = {
  [keys.TENANT_ID]: '1eQV8AuvoMtRi2UWkhXfWpgBRugPoc4u',
  [keys.USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [keys.CALLER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [keys.AUTH_ID]: 'auth0|5e81f1ba65a28c0c5dba9518',
  [keys.EMAIL]: 'gauthier.petetin@consensys.net',
  [keys.USER]: UserExample,
  [keys.CALLER]: UserExample,
  [keys.AUTH_TOKEN]: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

export const extractUsertypeFromContext = (
  userContext: IUserContext,
): UserType => {
  if (userContext[keys.USER] && userContext[keys.USER][UserKeys.USER_TYPE]) {
    return userContext[keys.USER][UserKeys.USER_TYPE];
  } else {
    throw new Error(
      `shall never happen, no userType found in user ${
        userContext[keys.USER_ID]
      }`,
    );
  }
};
