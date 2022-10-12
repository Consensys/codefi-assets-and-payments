import { SetMetadata } from '@nestjs/common'

/**
 * This decorator defines the permissions an access token needs to contain
 * Permissions is a custom claim added by auth0 when using RBAC
 * @param permissions permissions needed to run an endpoint
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions)
