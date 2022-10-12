import { TenantType } from 'constants/tenantKeys';
import { UserType } from 'User';

interface ISettingsMenuItemAcl {
  [TenantType.PLATFORM_SINGLE_ISSUER]: UserType[];
  [TenantType.PLATFORM_MULTI_ISSUER]: UserType[];
  [TenantType.API]: UserType[];
}
export interface ISettingsMenuItem {
  title: string;
  description: string;
  linkTo: string;
  icon?: string;
  permissions?: ISettingsMenuItemAcl;
}
