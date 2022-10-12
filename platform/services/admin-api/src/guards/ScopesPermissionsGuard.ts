import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { decodeToken, DECODED_TOKEN_HEADER } from '../utils/jwtUtils'
import { JwtToken } from './JwtToken'
import cfg from '../config'

@Injectable()
export class ScopesPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (cfg().auth.disableScopesAndPermissions) {
      return true
    }

    const permissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    )
    if (!permissions) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    const decodedToken: JwtToken = decodeToken(request)
    if (!decodedToken) {
      throw new BadRequestException('Malformed auth header')
    }
    // since this is the first item executed in nestJS lifecycle
    // after middlewares, we're adding the decoded JWT as a new header
    // just in case we need it in some of the endpoints
    // we should use `tokenFromRequest` in order to get it from the request
    request.headers[DECODED_TOKEN_HEADER] = decodedToken
    const userPermissions = decodedToken.permissions
    if (userPermissions) {
      return this.matchPermissions(permissions, userPermissions)
    }
    return false
  }

  private matchPermissions(
    permissions: string[],
    userPermissions: string[],
  ): boolean {
    return permissions.every((scope) => userPermissions.includes(scope))
  }
}
