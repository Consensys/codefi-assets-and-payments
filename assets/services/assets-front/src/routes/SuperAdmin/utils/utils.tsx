import React from 'react';
import { Region, TenantType, tenantTypeMapping } from 'constants/tenantKeys';
import { formatDate } from 'utils/commonUtils';
import Pill from 'uiComponents/Pill';
import { IUser, UserType } from 'User';
import { IConfig } from 'routes/Issuer/AssetIssuance/templatesTypes';

export const getFirstUser = (users: Array<IUser>): IUser => {
  return users
    .filter(
      (user: IUser) =>
        [UserType.ADMIN, UserType.ISSUER].includes(user.userType) &&
        !user.email.includes('codefi.net'),
    )
    .slice(-1)[0];
};

export const getTenantMetadataFromConfig = (config: IConfig) => {
  const configData = config.data || {};
  // tenant type
  const tenantName = configData?.tenantName;
  // platform url
  const platformUrl = configData.defaultAlias || '';
  // created at
  const createdAt = configData.createdAt
    ? formatDate(configData.createdAt)
    : '';
  // tenant type
  const tenantType = configData.tenantType;
  // region
  const region = configData.region || Region.EU;
  return { tenantName, platformUrl, createdAt, tenantType, region };
};

export const getTenantTypePill = (tenantType: TenantType) => {
  let pill;
  const mapper = tenantTypeMapping();
  switch (tenantType) {
    case TenantType.PLATFORM_MULTI_ISSUER:
      pill = <Pill label={mapper.get(tenantType)} color="accent3" />;
      break;
    case TenantType.PLATFORM_SINGLE_ISSUER:
      pill = <Pill label={mapper.get(tenantType)} color="accent4" />;
      break;
    case TenantType.API:
      pill = <Pill label={mapper.get(tenantType)} color="warning" />;
      break;
    default:
      pill = '-';
  }
  return pill;
};
