import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProtectionContext } from '../types';
import { checkAuthentication, checkPermissions } from '../utils/authUtils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const protectionContext: ProtectionContext =
      this.reflector.get<ProtectionContext>(
        'protectionContext',
        context.getHandler()
      );

    let canActivate = true;

    if (!protectionContext) {
      return canActivate;
    }

    const request = context.switchToHttp().getRequest();

    if (protectionContext.authentication) {
      canActivate = canActivate && (await checkAuthentication(request));
    }

    if (protectionContext.permissions?.length) {
      canActivate =
        canActivate && checkPermissions(request, protectionContext.permissions);
    }

    return canActivate;
  }
}
