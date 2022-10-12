export enum EntityType {
  TOKEN = 'TOKEN',
  ASSET_CLASS = 'ASSET_CLASS',
  ISSUER = 'ISSUER',
  ADMIN = 'ADMIN',
  PROJECT = 'PROJECT',
  PLATFORM = 'PLATFORM',
  EVENT = 'EVENT',
}

export const entityTypeToKycType = {
  [EntityType.PROJECT]: 'project-related',
  [EntityType.ISSUER]: 'issuer-related',
  [EntityType.TOKEN]: 'token-related',
  [EntityType.PLATFORM]: 'platform-related',
};

export const ENTITY_DESCRIPTION_MAX_LENGTH = 500;
