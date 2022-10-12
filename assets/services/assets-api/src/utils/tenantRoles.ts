import { Role } from '@codefi-assets-and-payments/ts-types';
import { UserType } from 'src/types/user';

const BASE_ROLES = [Role.CODEFI_WALLET_OWNER];

const TENANT_ROLES_BY_USER_TYPE = {
  [UserType.SUPERADMIN]: [Role.ASSETS_ADMIN_STACK_ADMIN],
  [UserType.ADMIN]: [Role.ASSETS_ADMIN_TENANT_ADMIN],
  [UserType.ISSUER]: [Role.ASSETS_ADMIN_ISSUER],
  [UserType.UNDERWRITER]: [Role.ASSETS_ADMIN_UNDERWRITER],
  [UserType.BROKER]: [Role.ASSETS_ADMIN_BROKER],
  [UserType.INVESTOR]: [Role.ASSETS_ADMIN_INVESTOR],
  [UserType.VEHICLE]: [],
  [UserType.NOTARY]: [Role.ASSETS_ADMIN_NOTARY],
  [UserType.VERIFIER]: [Role.ASSETS_ADMIN_VERIFIER],
  [UserType.NAV_MANAGER]: [Role.ASSETS_ADMIN_NAV_MANAGER],
  [UserType.AGENT]: [Role.ASSETS_ADMIN_AGENT],
};

export const getTenantRolesForUserType = (userType: UserType): Role[] => {
  return [...TENANT_ROLES_BY_USER_TYPE[userType], ...BASE_ROLES];
};

export const rolesMatch = (first?: string[], second?: string[]): boolean => {
  return (
    !!first &&
    !!second &&
    first.length === second.length &&
    first.every((role) => second.includes(role))
  );
};
