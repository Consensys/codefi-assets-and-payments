/**
 * USERS
 */
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import {
  MAX_USERS_COUNT,
  ListAllAuth0UsersQueryInputV2,
  ListAllAuth0UsersOutputV2,
  CreateAuth0UserBodyInputV2,
  CreateAuth0UserOutputV2,
} from './user.dto';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import { keys as UserKeys } from 'src/types/user';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { ApiOAuth2, ApiOperation } from '@nestjs/swagger';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
import { ApiAdminCallService } from '../v2ApiCall/api.call.service/admin';
import {
  Auth0User,
  craftAuth0TenantId,
  craftAuth0UserPassword,
} from 'src/types/authentication';
import { getTenantRolesForUserType } from 'src/utils/tenantRoles';

// CAUTION!!!
// There is an important confusion to avoid between users in Assets-Api (e.g. this API)
// and users in Auth0 (the SaaS product used as identity provider):
//  - "Users" as defined in Assets-Api, are in reality "entities" in Entity-Api, e.g. potentially companies
//  - "Auth0Users" as defined in Assets-Api, are in reality "users" in Auth0, e.g. real persons
//
// By default There is a 1 to 1 relationship between "Users" and "Auth0Users",
// but there can potentially be a 1 to many realtionship in case the "User" represents a company
// and the "Auth0Users" represent its employees.
//
// This controller is meant to manage "Auth0Users" in Auth0.
@Controller('v2/essentials/auth0user')
@UseFilters(new AppToHttpFilter())
export class Auth0UserControllerV2 {
  constructor(private readonly apiAdminCallService: ApiAdminCallService) {}

  @Get()
  @HttpCode(200)
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'List all Auth0 users' })
  @Protected(true, [])
  async listAllAuth0Users(
    @UserContext() userContext: IUserContext,
    @Query() userQuery: ListAllAuth0UsersQueryInputV2,
  ): Promise<ListAllAuth0UsersOutputV2> {
    try {
      const offset = Number(userQuery.offset || 0);
      const limit: number = Math.min(
        Number(userQuery.limit || MAX_USERS_COUNT),
        MAX_USERS_COUNT,
      );

      const usersList: Array<Auth0User> =
        await this.apiAdminCallService.listAllAuth0UsersInByTenantIdAndEntityId(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
        );

      const slicedUsersList: Array<Auth0User> = usersList.slice(
        offset,
        Math.min(offset + limit, usersList.length),
      );

      const response: ListAllAuth0UsersOutputV2 = {
        users: slicedUsersList,
        count: slicedUsersList.length,
        total: usersList.length,
        message: `${slicedUsersList.length} Auth0 user(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing Auth0 users',
        'listAllAuth0Users',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(201)
  @ApiOAuth2(['write:user'])
  @ApiOperation({ summary: 'Create a user in Auth0' })
  @Protected(true, [])
  async createAuth0User(
    @UserContext() userContext: IUserContext,
    @Body() userBody: CreateAuth0UserBodyInputV2,
  ): Promise<CreateAuth0UserOutputV2> {
    try {
      const tenantId = userContext[UserContextKeys.TENANT_ID];
      const entityId = userContext[UserContextKeys.USER_ID];
      const entityTenantRole = getTenantRolesForUserType(
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE],
      );

      const usersList: Array<Auth0User> =
        await this.apiAdminCallService.listAllAuth0UsersInByTenantIdAndEntityId(
          tenantId,
          entityId,
        );

      const alreadyExistingUser = usersList.find((auth0User: Auth0User) => {
        return (
          auth0User?.email?.toLowerCase() === userBody?.email?.toLowerCase()
        );
      });

      if (alreadyExistingUser?.userId) {
        return {
          user: alreadyExistingUser,
          newUser: false,
          message: `Auth0 user ${alreadyExistingUser.userId} successfully retrieved`,
        };
      }

      const usersWithSameEmail: Array<Auth0User> =
        await this.apiAdminCallService.retrieveUsersInAuth0ByEmail(
          tenantId, // not used for now
          userBody.email,
        );

      if (
        usersWithSameEmail?.length > 0 &&
        usersWithSameEmail[0]?.email === userBody.email
      ) {
        const userWithSameEmail: Auth0User = usersWithSameEmail[0];
        const auth0TenantId = craftAuth0TenantId(tenantId);
        if (userWithSameEmail.appMetadata[auth0TenantId]) {
          if (
            userWithSameEmail.appMetadata[auth0TenantId]?.entityId !== entityId
          ) {
            ErrorService.throwError(
              `Auth0 user with email ${userBody.email} is already a user of entity ${userWithSameEmail.appMetadata[auth0TenantId]?.entityId} in tenant ${tenantId}. Impossible to add him to entity ${entityId}.`,
            );
          } else {
            ErrorService.throwError(
              `SHALL NEVER HAPPEN: Auth0 user with same email ${userBody.email} already exists with same tenantId ${tenantId} and entityId ${entityId} but it has not been returned by 'listAllAuth0UsersInByTenantIdAndEntityId' function.`,
            );
          }
        } else {
          // Add existing user to entity
          const updatedUser: Auth0User =
            await this.apiAdminCallService.updateUserInAuth0ById(
              tenantId,
              userWithSameEmail.userId,
              entityId,
              entityTenantRole,
            );

          return {
            user: updatedUser,
            newUser: false,
            message: `Auth0 user ${updatedUser.userId} successfully retrieved (and updated)`,
          };
        }
      }

      const auth0User: Auth0User =
        await this.apiAdminCallService.createUserInAuth0(
          tenantId,
          entityId,
          userBody.email,
          craftAuth0UserPassword(userBody.password),
          userBody.firstName,
          userBody.lastName,
          entityTenantRole,
          false, // e2eTestUser
        );

      const response: CreateAuth0UserOutputV2 = {
        user: auth0User,
        newUser: true,
        message: `Auth0 user ${auth0User.userId} successfully created`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating Auth0 user',
        'createAuth0User',
        true,
        500,
      );
    }
  }
}
