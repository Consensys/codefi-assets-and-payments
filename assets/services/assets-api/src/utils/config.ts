import { Region, TenantType } from 'src/types/clientApplication';
import { Config, keys as ConfigKeys } from 'src/types/config';

export const getTenantDataFromConfig = (config: Config) => {
  const configData = config[ConfigKeys.DATA];
  return {
    defaultAlias: configData[ConfigKeys.DATA__DEFAULT_ALIAS],
    aliases: configData[ConfigKeys.DATA__ALIASES],
    tenantRegion: configData[ConfigKeys.DATA__TENANT_REGION] as Region,
    tenantType: configData[ConfigKeys.DATA__TENANT_TYPE] as TenantType,
    createdAt: configData[ConfigKeys.DATA__CREATED_AT] as Date,
    firstUserId: configData[ConfigKeys.DATA__FIRST_USER_ID],
    codefiUsersIds: configData[ConfigKeys.DATA__CODEFI_USERS_IDS],
  };
};
