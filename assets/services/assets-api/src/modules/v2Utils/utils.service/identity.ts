import { Injectable } from '@nestjs/common';

import { Request } from 'express';

/**
 * IDENTITY
 * The platform manages user accounts, e.g. an Ethereum wallet and any kind of metadata.
 */
import ErrorService from 'src/utils/errorService';

import { EntityEnum, keys as UserKeys, User, UserType } from 'src/types/user';
import { RetrieveIdentityOutput } from '../utils.dto';
import { UserCreationService } from 'src/modules/v2User/user.service/createUser';
import { CreateUserOutput } from 'src/modules/v2User/user.dto';
import { NestJSPinoLogger } from '@consensys/observability';
import {
  decodeToken,
  extractEntityIdFromRequest,
  extractTenantIdFromRequest,
  extractTokenFromRequest,
} from '@consensys/auth';
import { ApiAdminCallService } from 'src/modules/v2ApiCall/api.call.service/admin';
import { Auth0User } from 'src/types/authentication';
import { getTenantRolesForUserType } from 'src/utils/tenantRoles';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const ENABLE_PLATFORM_ACCESS_FOR_NEW_INVESTORS: boolean =
  process.env.ENABLE_PLATFORM_ACCESS_FOR_NEW_INVESTORS === 'true';
const ENABLE_PLATFORM_ACCESS_FOR_NEW_ISSUERS: boolean =
  process.env.ENABLE_PLATFORM_ACCESS_FOR_NEW_ISSUERS === 'true';

@Injectable()
export class IdentityService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly userCreationService: UserCreationService,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  /**
   * [Retrieve, or update, or create user's account]
   *
   * This endpoint is not protected by authentication guard.
   *
   * NEW WAY:
   * This functions extracts (tenantId, userId) from access token and finds corresponding user in DB.
   *
   * DEPRECATED WAY:
   * This function retrieved user's (authId, email) from access token.
   * Based on those elements:
   *  - If a user with this authId is found in the DB, user is already initialized, the user is returned [CASE1]
   *  - If a user with this email is found in the DB, user, is not initialized, function doesn't return the user
   *    but informs caller he needs to initialize his account thanks to invitation email [CASE2]
   *  - If no user with this authId can be found in the DB:
   *      - If the user provided a firstConnectionCode in request Query parameters, function fetches user
   *        corresponding to this firstConnectionCode in the DB and returns it [CASE3]
   *      - If the user didn't provide a firstConnectionCode in request Query parameters, functions creates
   *        a new user and returns it [CASE4]
   */
  async retrieveOrUpdateOrCreateIdentity(
    userType: UserType,
    firstConnectionCode: string,
    request: Request,
  ): Promise<RetrieveIdentityOutput> {
    try {
      // Extract access token from Authorization headers
      const authToken = extractTokenFromRequest(request);
      const decodedToken = decodeToken(authToken);
      const tenantId = extractTenantIdFromRequest(request);
      const userId = extractEntityIdFromRequest(request);
      const authId = decodedToken?.sub;
      if (!authId) {
        ErrorService.throwError("access token contains no subject ('sub')");
      }

      // Retrieve user in Auth0
      const auth0User: Auth0User =
        await this.apiAdminCallService.retrieveUsersInAuth0ById(
          tenantId,
          authId,
        );
      if (!auth0User) {
        ErrorService.throwError(
          `error retrieving user with id ${authId} in auth0 (identity provider)`,
        );
      }
      const email = auth0User?.email;
      if (!email) {
        ErrorService.throwError(
          `user with id ${authId} retrieved from auth0 (identity provider) has no email`,
        );
      }

      /********************* NEW WAY to retrieve users (userId is extracted from access token) *******************/
      if (userId) {
        let userById: User;
        try {
          userById = await this.apiEntityCallService.fetchEntity(
            tenantId,
            userId,
            true,
          );
        } catch (error) {
          ErrorService.throwError(
            `invalid 'entityId' provided in access token: no entity with id ${userId} was not found in the DB`,
          );
        }
        return {
          user: userById,
          newUser: false,
          message: `User with id (${userId}) retrieved successfully`,
        };
      }

      const usersByEmail: Array<User> =
        await this.apiEntityCallService.fetchFilteredEntities(
          tenantId,
          EntityEnum.email,
          email,
          true, // includeWallets
        );

      if (firstConnectionCode) {
        const usersByFirstConnectionCode: Array<User> =
          await this.apiEntityCallService.fetchFilteredEntities(
            tenantId,
            EntityEnum.firstConnectionCode,
            firstConnectionCode,
            true, // includeWallets
          );
        if (usersByFirstConnectionCode.length > 1) {
          ErrorService.throwError(
            `shall never happen: multiple entities have been found for this first connection code (${firstConnectionCode})`,
          );
        } else if (usersByFirstConnectionCode.length < 1) {
          ErrorService.throwError(
            `no entity for this first connection code (${firstConnectionCode}) was found in the DB`,
          );
        }
        const user: User = usersByFirstConnectionCode[0];

        if (user[UserKeys.AUTH_ID]) {
          ErrorService.throwError(
            'entity has already initialized his account with this first cconnection code',
          );
        }

        if (user[UserKeys.EMAIL] !== email) {
          ErrorService.throwError(
            `invalid email (${email}): user has been invited with a different email (${
              user[UserKeys.EMAIL]
            })`,
          );
        }

        const updates = {
          [UserKeys.AUTH_ID]: authId,
        };
        const updatedUser: User = await this.apiEntityCallService.patchEntity(
          tenantId,
          user[UserKeys.USER_ID],
          updates,
        );

        await this.apiAdminCallService.updateUserInAuth0ById(
          tenantId,
          authId,
          updatedUser[UserKeys.USER_ID],
          getTenantRolesForUserType(updatedUser[UserKeys.USER_TYPE]), // tenantRoles
        );

        return {
          user: updatedUser,
          newUser: false,
          message:
            'User retrieved and updated successfully (thanks to first connection code)',
        };
      }
      /***********************************************************************************************************/

      if (usersByEmail.length > 1) {
        ErrorService.throwError(
          `shall never happen: multiple entities have been found for this email (${email})`,
        );
      } else if (usersByEmail.length === 1) {
        if (!usersByEmail[0][UserKeys.AUTH_ID]) {
          this.logger.info({}, JSON.stringify(usersByEmail[0]));
          return {
            user: undefined, // The API caller is not allowed to access user data, as his account is not initialized yet
            newUser: false,
            message: `User with email ${email} exists, but account needs ot be initialized with invitation email`, // [CASE2]
          };
        } else {
          ErrorService.throwError(
            `shall never happen: this entity is already initialized for another authId ${
              usersByEmail[0][UserKeys.AUTH_ID]
            }`,
          );
        }
      } else {
        if (userType === UserType.ISSUER) {
          if (!ENABLE_PLATFORM_ACCESS_FOR_NEW_ISSUERS) {
            ErrorService.throwError(
              'platform is not allowed for non-registered issuers: issuer needs to be invited first',
            );
          }
        } else if (userType === UserType.INVESTOR) {
          if (!ENABLE_PLATFORM_ACCESS_FOR_NEW_INVESTORS) {
            ErrorService.throwError(
              'platform is not allowed for non-registered investors: investor needs to be invited first',
            );
          }
        } else {
          ErrorService.throwError(
            `invalid userType passed in query parameters (${userType}, userType shall be chosen amongst ${UserType.ISSUER} and ${UserType.INVESTOR})`,
          );
        }

        const userCreation: CreateUserOutput =
          await this.userCreationService.createLinkedUser(
            tenantId,
            email,
            undefined, // firstName
            undefined, // lastName
            authId,
            undefined, // userNature
            undefined, // docuSignId
            undefined, // kycTemplateId
            userType,
            undefined, // entityType
            undefined, // tokenId
            undefined, // assetClassKey
            false, // auth0UserCreate (not required as user already exists in auth0)
            undefined, // auth0UserPassword (not required as user already exists in auth0)
            {}, // data
          );

        if (!userCreation.newUser) {
          ErrorService.throwError(
            'shall never happen: user account already existed',
          );
        } else {
          return {
            user: userCreation.user,
            newUser: true,
            message: 'User created successfully',
          };
        }
        /***********************************************************************************************************/
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "retrieving user's identity",
        'retrieveOrUpdateOrCreateIdentity',
        false,
        500,
      );
    }
  }
}
