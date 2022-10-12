import { Request } from 'express';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import ErrorService from 'src/utils/errorService';
import { keys as UserKeys, User, UserType } from './types/user';

import { keys as UserContextKeys } from './types/userContext';
import {
  decodeTokenFromRequest,
  extractEntityIdFromRequest,
  extractEntityIdFromToken,
  extractTenantIdFromToken,
} from '@codefi-assets-and-payments/auth';
import config from './config';
import { ApiEntityCallService } from './modules/v2ApiCall/api.call.service/entity';

const unprotectedRoutes: Array<string> = [
  '/healthcheck',
  '/v2/utils/identity',
  '/v2/utils/config',
  '/v2/utils/tenant/:tenantIdOrAlias',
  '/v2/utils/usecase/:usecase',
  '/v2/document/public/:fileName',
];
const machineToMachineRoutes: Array<string> = [
  '/v2/hooks',
  '/v2/essentials/digital/asset/nav/m2m',
];

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const { headers, route } = request;

      if (
        this.checkRouteIsUnprotected(route.path) ||
        this.checkRouteIsMachineToMachineRoute(route.path, headers) ||
        ((await this.checkAuthenticatedWithAuthToken(request)) &&
          (await this.checkValidUserIdInQuery(request)) &&
          this.checkPlatformIsNotInMaintenance(request))
      ) {
        return true;
      } else {
        ErrorService.throwError('authentication error');
      }

      return false;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking authentication',
        'canActivate',
        true,
        401,
      );
    }
  }

  checkRouteIsUnprotected(path: string): boolean {
    try {
      if (unprotectedRoutes.indexOf(path) >= 0) {
        this.logger.debug(
          {},
          `AUTH1 --> Bypass authentication check (unprotected route: ${path})`,
        );
        return true;
      } else {
        return false;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking authenticaction can be bypassed',
        'checkRouteIsUnprotected',
        false,
        401,
      );
    }
  }

  checkRouteIsMachineToMachineRoute(path: string, headers: any): boolean {
    try {
      if (machineToMachineRoutes.indexOf(path) >= 0) {
        const applicationSecret = process.env.API_SECRET;

        const headersSecret =
          headers && headers['x-assets-api-secret']
            ? headers['x-assets-api-secret']
            : undefined;

        if (
          applicationSecret &&
          applicationSecret.length !== 0 &&
          headersSecret &&
          headersSecret.length !== 0 &&
          applicationSecret === headersSecret
        ) {
          this.logger.debug(
            {},
            'AUTH2 --> authentication with secret (only for internal Codefi micro-services)',
          );
          return true;
        } else {
          throw new Error(`invalid authentication for m2m route ${path}`);
        }
      } else {
        return false;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking route is authenticated in m2m mode',
        'checkRouteIsMachineToMachineRoute',
        false,
        401,
      );
    }
  }

  async checkAuthenticatedWithAuthToken(request: Request): Promise<boolean> {
    try {
      const decodedToken = decodeTokenFromRequest(request);
      const tenantId = extractTenantIdFromToken(decodedToken);
      const userId = extractEntityIdFromRequest(request); // TODO: userId will be renamed entityId after integration with Entity-Api
      const authId = decodedToken?.sub;

      // We store 'tenantId' and 'authId' in user context
      request[UserContextKeys.TENANT_ID] = tenantId;
      request[UserContextKeys.AUTH_ID] = authId;

      if (!userId) {
        ErrorService.throwError(
          `invalid access token: access token shall include an 'entityId' inside '${process.env.AUTH_CUSTOM_NAMESPACE} custom claims'`,
        );
      }

      if (!authId) {
        ErrorService.throwError('access token contains no subject (sub)');
      }

      let caller: User;
      try {
        caller = await this.apiEntityCallService.fetchEntity(
          tenantId,
          userId,
          true,
        );
      } catch (error) {
        ErrorService.throwError(
          `no entity found for tenantId ${tenantId} and entityId ${userId}: please register your identity in Codefi first by calling /v2/utils/identity endpoint, with this same authToken in headers`,
        );
      }

      const typeFunctionCaller: UserType = caller[UserKeys.USER_TYPE];

      // Save callerId in headers
      request[UserContextKeys.CALLER_ID] = caller[UserKeys.USER_ID];
      request[UserContextKeys.CALLER] = caller;

      if (typeFunctionCaller === UserType.SUPERADMIN) {
        const entityIdExtractedFromCustomClaims =
          extractEntityIdFromToken(decodedToken);
        // The 'entityId' extracted from custom claims is equal to:
        //   - CASE1 (user authentication): 'entityId' is equal to caller's 'entityId' (most of the time)
        //   - CASE2 (machine authentication): 'entityId' is equal to '*'
        //
        // The condition below aims to forbid machine authentication for superadmins
        if (caller[UserKeys.USER_ID] !== entityIdExtractedFromCustomClaims) {
          ErrorService.throwError(
            `please make sure the superadmin's entityId (${
              caller[UserKeys.USER_ID]
            }) is included in the ${
              process.env.AUTH_CUSTOM_NAMESPACE
            } custom claim of the access token`,
          );
        }
      }

      this.logger.debug(
        {},
        `AUTH3 --> User ${
          decodedToken?.sub
        } authenticated with authToken (tenant: ${
          caller[UserKeys.TENANT_ID]
        }, entity: ${caller[UserKeys.USER_ID]})`,
      );
      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking authenticaction',
        'checkAuthenticatedWithAuthToken',
        false,
        401,
      );
    }
  }

  // Caution: this function needs to be called after "checkAuthenticatedWithAuthToken", otherwise
  // the headers don't contain the "tenantId".
  async checkValidUserIdInQuery(request: any) {
    try {
      if (!request[UserContextKeys.TENANT_ID]) {
        ErrorService.throwError(
          'shall never happen, headers contain no tenantId, which probably means checkAuthenticatedWithAuthToken has not been called before',
        );
      }

      // 'request.query.userId' is meant to contain the ID of the user on behalf of which the caller wants to act
      if (!request.query.userId) {
        ErrorService.throwError(
          'no userId provided in query params, please indicate in query params the ID of the user account, the action is executed for',
        );
      }

      let user: User;
      try {
        user = await this.apiEntityCallService.fetchEntity(
          request[UserContextKeys.TENANT_ID],
          request.query.userId,
          true,
        );
      } catch (error) {
        ErrorService.throwError(
          `no entity found for ID ${request.query.userId}: please indicate a valid userId in query params`,
        );
      }

      const typeFunctionCaller: UserType =
        request[UserContextKeys.CALLER][UserKeys.USER_TYPE];
      request[UserContextKeys.USER] = user;
      request[UserContextKeys.USER_ID] = user[UserKeys.USER_ID];
      request[UserContextKeys.EMAIL] = user[UserKeys.EMAIL];

      // SUPERADMIN can retrieve data from any tenant provided in query
      if (
        typeFunctionCaller === UserType.SUPERADMIN &&
        request.query.tenantId
      ) {
        request[UserContextKeys.TENANT_ID] = request.query.tenantId;
      }

      if (
        typeFunctionCaller === UserType.SUPERADMIN &&
        process.env.ENABLE_SUPERADMIN
      ) {
        // SUPERADMIN can act on behalf of everyone, only if ENABLE_SUPERADMIN is set to true
        return true;
      }

      // ADMIN can act on behalf of everyone within a given tenant, excepted on behalf of SUPERADMINs
      if (
        request[UserContextKeys.CALLER][UserKeys.USER_TYPE] ===
          UserType.ADMIN &&
        user[UserKeys.USER_TYPE] !== UserType.SUPERADMIN
      ) {
        return true;
      }

      // We distinguish 2 users (even though most of the time, both are the same):
      // - the user who really calls the endpoint, who provides the valid acess token, sometimes called the "caller"
      // - the user on behalf of whom we act, indicated by the "userId" passed as param to the request
      //
      // In most cases, both are the same, except for VEHICLEs. Indeed a VEHICLE is a user that is not a physical
      // person. The VEHICLE belongs to a "super user". The "super user" is the only one allowed to act on behalf of the
      // VEHICLE.
      if (user[UserKeys.USER_TYPE] === UserType.VEHICLE) {
        // User is a VEHICLE
        if (
          user[UserKeys.SUPER_USER_ID] !== request[UserContextKeys.CALLER_ID]
        ) {
          ErrorService.throwError(
            `iam issue: user with ID ${
              request[UserContextKeys.CALLER_ID]
            } is not allowed to act on behalf of vehicle with ID ${
              request.query.userId
            }`,
          );
        }
      } else {
        // User is not a VEHICLE
        if (request.query.userId !== request[UserContextKeys.CALLER_ID]) {
          ErrorService.throwError(
            `iam issue: user with ID ${
              request[UserContextKeys.CALLER_ID]
            } is not allowed to act on behalf of user with ID ${
              request.query.userId
            }`,
          );
        }
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if query contains a valid user ID',
        'checkValidUserIdInQuery',
        false,
        401,
      );
    }
  }

  checkPlatformIsNotInMaintenance(request: Request): boolean {
    try {
      if (
        config()?.maintenanceMode?.enabled &&
        request?.[UserContextKeys.CALLER]?.[UserKeys.USER_TYPE] !==
          UserType.SUPERADMIN
      ) {
        ErrorService.throwError(
          'Codefi platform is currently in maintenance... please retry a bit later',
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if platform is in maintenance',
        'checkPlatformIsNotInMaintenance',
        false,
        401,
      );
    }
  }
}
