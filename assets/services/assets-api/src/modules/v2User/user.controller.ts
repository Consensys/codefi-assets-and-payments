import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Delete,
  Query,
  Body,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import { UserCreationService } from './user.service/createUser';
import { UserRetrievalService } from './user.service/retrieveUser';

import {
  ListAllUsersOutput,
  CreateUserBodyInput,
  CreateUserOutput,
  RetrieveUserOutput,
  RetrieveUserQueryInput,
  RetrieveUserParamInput,
  UpdateUserParamInput,
  UpdateUserBodyInput,
  DeleteUserParamInput,
  DeleteUserOutput,
  VerifierParamInput,
  VerifierBodyInput,
  VerifierOutput,
  NotaryParamInput,
  NotaryBodyInput,
  NotaryOutput,
  NavManagerParamInput,
  NavManagerBodyInput,
  NavManagerOutput,
  ListAllUsersQueryInput,
  MAX_USERS_COUNT,
  RetrieveUserQueryInputAsThirdParty,
  MessageOutput,
  DeleteUserQueryInput,
} from './user.dto';

import {
  extractUsertypeFromContext,
  IUserContext,
  keys as UserContextKeys,
} from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';
/**
 * USERS
 *
 * 5 kind of users can be distinguished:
 *  - SUPERADMINS (ConsenSys)
 *  - ADMINS (not available yet)
 *  - ISSUERS
 *  - NOTARIES
 *  - INVESTORS
 *  - VEHICLES
 */

import { UserType, User, keys as UserKeys } from 'src/types/user';
import { UserListingService } from './user.service/listAllUsers';
import { UserUpdateService } from './user.service/updateUser';
import { UserHelperService } from './user.service/index';
import { UserDeletionService } from './user.service/deleteUser';
import { EntityType } from 'src/types/entity';
import { RoleService } from 'src/modules/v2Role/role.service';
import { FunctionName } from 'src/types/smartContract';
import { setToLowerCase } from 'src/utils/case';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import {
  ApiBearerAuth,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { checkValidEnumValue, getEnumValues } from 'src/utils/enumUtils';
import { LinkState } from 'src/types/workflow/workflowInstances/link';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

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
// This controller is meant to manage "Users" in Assets-Api.
@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('v2/essentials/user')
@UseFilters(new AppToHttpFilter())
export class UserController {
  constructor(
    private readonly userListingService: UserListingService,
    private readonly userCreationService: UserCreationService,
    private readonly userRetrievalService: UserRetrievalService,
    private readonly userUpdateService: UserUpdateService,
    private readonly userDeletionService: UserDeletionService,
    private readonly roleService: RoleService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly userHelperService: UserHelperService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'List all users' })
  @Protected(true, [])
  async listAllUsers(
    @UserContext() userContext: IUserContext,
    @Query() userQuery: ListAllUsersQueryInput,
  ): Promise<ListAllUsersOutput> {
    try {
      const offset = Number(userQuery.offset || 0);
      const limit: number = Math.min(
        Number(userQuery.limit || MAX_USERS_COUNT),
        MAX_USERS_COUNT,
      );

      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);

      // Extract userTypes form query param
      let userTypes: Array<UserType>;
      if (userQuery.userTypes) {
        userTypes = JSON.parse(userQuery.userTypes);
        if (!(userTypes && Array.isArray(userTypes))) {
          ErrorService.throwError(
            'Invalid input for userTypes. Shall be a stringified array.',
          );
        }
        userTypes.forEach((userType) => {
          if (!checkValidEnumValue(UserType, userType)) {
            ErrorService.throwError(
              `Invalid input for userTypes. ${userType} doesn't belong to list of authorized userTypes (${JSON.stringify(
                getEnumValues(UserType),
              )}).`,
            );
          }
        });
      }

      // Check userTypes validity
      if (typeFunctionUser === UserType.SUPERADMIN) {
        // Ok SUPERADMIN can fetch everything
      } else {
        if (userTypes && userTypes.includes(UserType.SUPERADMIN)) {
          ErrorService.throwError(
            `Invalid input for userTypes. User of type ${typeFunctionUser} is not allowed to retrieve users of type ${UserType.SUPERADMIN}.`,
          );
        }

        if (typeFunctionUser === UserType.ADMIN) {
          // Ok ADMIN can fetch everything, excepted SUPERADMINs
        } else {
          if (userTypes && userTypes.includes(UserType.ADMIN)) {
            ErrorService.throwError(
              `Invalid input for userTypes. User of type ${typeFunctionUser} is not allowed to retrieve users of type ${UserType.ADMIN}.`,
            );
          }
        }
      }

      // Extract linkStates form query param
      let linkStates: Array<string>;
      if (userQuery.linkStates) {
        linkStates = JSON.parse(userQuery.linkStates);
        if (!(linkStates && Array.isArray(linkStates))) {
          ErrorService.throwError(
            'Invalid input for linkStates. Shall be a stringified array.',
          );
        }
        linkStates.forEach((linkState) => {
          if (!checkValidEnumValue(LinkState, linkState)) {
            ErrorService.throwError(
              `Invalid input for linkStates. ${linkState} doesn't belong to list of authorized linkStates (${JSON.stringify(
                getEnumValues(LinkState),
              )}).`,
            );
          }
        });
      }

      let usersList: { users: Array<User>; total: number };
      if (
        typeFunctionUser === UserType.SUPERADMIN ||
        typeFunctionUser === UserType.ADMIN
      ) {
        usersList = await this.userListingService.listAllUsers(
          userContext[UserContextKeys.TENANT_ID],
          offset,
          limit,
          userTypes, // Filter users according to their userTypes
          userQuery.withLinks, // Append links to users
          EntityType.PLATFORM, // Retrieve list of all users linked to platform
          linkStates, // Filter users according to the state of their links
        );
      } else if (typeFunctionUser === UserType.ISSUER) {
        usersList = await this.userListingService.listAllUsersLinkedToIssuer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          offset,
          limit,
          userTypes, // Filter users according to their userTypes
          linkStates, // Filter users according to the state of their links
        );
      } else if (
        typeFunctionUser === UserType.VERIFIER ||
        typeFunctionUser === UserType.NOTARY ||
        typeFunctionUser === UserType.UNDERWRITER ||
        typeFunctionUser === UserType.BROKER
      ) {
        usersList =
          await this.userListingService.listAllInvestorsLinkedToThirdParty(
            userContext[UserContextKeys.TENANT_ID],
            userContext[UserContextKeys.USER_ID],
            offset,
            limit,
            typeFunctionUser,
            userTypes, // Filter users according to their userTypes
            linkStates, // Filter users according to the state of their links
          );
      } else if (
        typeFunctionUser === UserType.INVESTOR ||
        typeFunctionUser === UserType.VEHICLE
      ) {
        usersList = await this.userListingService.listAllIssuersLinkedToUser(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          offset,
          limit,
        );
      } else {
        ErrorService.throwError(
          `Invalid input parameter (userType) ${typeFunctionUser}, shall belong to list ${getEnumValues(
            UserType,
          )}`,
        );
      }

      // Remove sensitive fields so we don't return them to the client
      usersList.users.map(function (user) {
        delete user.firstConnectionCode;
        return user;
      });

      const response: ListAllUsersOutput = {
        users: usersList.users,
        count: usersList.users.length,
        total: usersList.total,
        message: `${usersList.users.length} user(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing users',
        'listAllUsers',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(201)
  @ApiOAuth2(['write:user'])
  @ApiOperation({ summary: 'Create a user' })
  @Protected(true, [])
  async createUser(
    @UserContext() userContext: IUserContext,
    @Body() userBody: CreateUserBodyInput,
  ): Promise<CreateUserOutput> {
    try {
      // UserType of user who is calling the endpoint
      const userType: UserType =
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE];

      // userBody.userType corresponds to userType of user to create
      if (userBody.userType === UserType.SUPERADMIN) {
        checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);
      } else if (
        userBody.userType === UserType.ADMIN ||
        userBody.userType === UserType.ISSUER
      ) {
        checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);
      } else if (
        userBody.userType === UserType.VERIFIER ||
        userBody.userType === UserType.NOTARY ||
        userBody.userType === UserType.NAV_MANAGER ||
        userBody.userType === UserType.UNDERWRITER ||
        userBody.userType === UserType.BROKER ||
        userBody.userType === UserType.AGENT
      ) {
        // SUPERADMIN and ADMIN shall be authorized to create VERIFIER, NOTARY, NAV_MANAGER, UNDERWRITER, BROKER AND AGENT
        if (userType !== UserType.SUPERADMIN && userType !== UserType.ADMIN) {
          checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);
        }
      } else if (userBody.userType === UserType.INVESTOR) {
        if (
          userType !== UserType.SUPERADMIN &&
          userType !== UserType.ADMIN &&
          userType !== UserType.ISSUER &&
          userType !== UserType.UNDERWRITER &&
          userType !== UserType.BROKER
        ) {
          ErrorService.throwError(
            `User of type ${userType} is not allowed to create user of type ${userBody.userType}`,
          );
        }
      } else if (userBody.userType === UserType.VEHICLE) {
        checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);
      } else {
        throw new Error(
          'userType needs to belong to the following list: [SUPERADMIN, ADMIN, ISSUER, UNDERWRITER, BROKER,AGENT, INVESTOR, VEHICLE, VERIFIER, NOTARY, NAV_MANAGER]',
        );
      }

      const email: string = userBody.email && userBody.email.toLowerCase();

      let response: CreateUserOutput;
      if (userBody.userType === UserType.VEHICLE) {
        response = await this.userCreationService.createLinkedVehicle(
          userContext[UserContextKeys.TENANT_ID],
          userBody.firstName,
          userBody.lastName,
          userBody.superUserId,
          userBody.userNature,
          userBody.projectId,
          userBody.tokenId,
          setToLowerCase(userBody.assetClass),
          userBody.data,
        );
      } else {
        let entityId: string;
        let entityType: EntityType;
        if (userBody.tokenId && userBody.projectId) {
          ErrorService.throwError(
            'user can not be both linked both to a token AND to a project with the same API call',
          );
        } else if (userBody.tokenId) {
          entityId = userBody.tokenId;
          entityType = EntityType.TOKEN;
        } else if (userBody.projectId) {
          entityId = userBody.projectId;
          entityType = EntityType.PROJECT;
        }

        response = await this.userCreationService.createLinkedUser(
          userContext[UserContextKeys.TENANT_ID],
          email,
          userBody.firstName,
          userBody.lastName,
          userBody.authId,
          userBody.userNature,
          userBody.docuSignId,
          userBody.kycTemplateId,
          userBody.userType,
          entityType,
          entityId,
          setToLowerCase(userBody.assetClass),
          userBody.auth0UserCreate,
          userBody.auth0UserPassword,
          userBody.data,
        );
      }

      // We don't want to return the sensible information: First connection code
      delete response.user[UserKeys.FIRST_CONNECTION_CODE];

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating a user',
        'createUser',
        true,
        500,
      );
    }
  }

  @Get(':userId')
  @HttpCode(200)
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'Retrieve a user' })
  @Protected(true, [])
  async retrieveUser(
    @UserContext() userContext: IUserContext,
    @Query() userQuery: RetrieveUserQueryInput,
    @Param() userParam: RetrieveUserParamInput,
  ): Promise<RetrieveUserOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const user: User = await this.userRetrievalService.retrieveUser(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        userContext[UserContextKeys.USER],
        userContext[UserContextKeys.CALLER_ID],
        userParam.userId,
        userQuery.tokenId,
        userQuery.assetClass,
        userQuery.withBalances,
        userQuery.withVehicles,
        userQuery.withEthBalance,
        userQuery.projectId,
        userContext[UserContextKeys.USER_ID],
      );

      const response: RetrieveUserOutput = {
        user: user,
        message: `User ${user[UserKeys.USER_ID]} retrieved successfully`,
      };

      // We don't want to return the sensible information: First connection code
      delete response.user[UserKeys.FIRST_CONNECTION_CODE];

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving a user',
        'retrieveUser',
        true,
        500,
      );
    }
  }

  @Get(':userId/verifier')
  @HttpCode(200)
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'Retrieve a user, as a verifier' })
  @Protected(true, [])
  async retrieveUserAsVerifier(
    @UserContext() userContext: IUserContext,
    @Query() userQuery: RetrieveUserQueryInputAsThirdParty,
    @Param() userParam: RetrieveUserParamInput,
  ): Promise<RetrieveUserOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const user: User = await this.userRetrievalService.retrieveUser(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        userContext[UserContextKeys.USER],
        userContext[UserContextKeys.CALLER_ID],
        userParam.userId,
        userQuery.tokenId,
        userQuery.assetClass,
        userQuery.withBalances,
        userQuery.withVehicles,
        userQuery.withEthBalance,
        userQuery.projectId,
        userQuery.issuerId,
      );

      const response: RetrieveUserOutput = {
        user: user,
        message: `User ${user[UserKeys.USER_ID]} retrieved successfully`,
      };

      // We don't want to return the sensible information: First connection code
      delete response.user[UserKeys.FIRST_CONNECTION_CODE];

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving a user, as verifier',
        'retrieveUserAsVerifier',
        true,
        500,
      );
    }
  }

  @Get(':userId/underwriter')
  @HttpCode(200)
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'Retrieve a user, as an underwriter' })
  @Protected(true, [])
  async retrieveUserAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Query() userQuery: RetrieveUserQueryInputAsThirdParty,
    @Param() userParam: RetrieveUserParamInput,
  ): Promise<RetrieveUserOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const user: User = await this.userRetrievalService.retrieveUser(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        userContext[UserContextKeys.USER],
        userContext[UserContextKeys.CALLER_ID],
        userParam.userId,
        userQuery.tokenId,
        userQuery.assetClass,
        userQuery.withBalances,
        userQuery.withVehicles,
        userQuery.withEthBalance,
        userQuery.projectId,
        userQuery.issuerId,
      );

      const response: RetrieveUserOutput = {
        user: user,
        message: `User ${user[UserKeys.USER_ID]} retrieved successfully`,
      };

      // We don't want to return the sensible information: First connection code
      delete response.user[UserKeys.FIRST_CONNECTION_CODE];

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving a user, as underwriter',
        'retrieveUserAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Get(':userId/broker')
  @HttpCode(200)
  @ApiOAuth2(['read:user'])
  @ApiOperation({ summary: 'Retrieve a user, as an broker' })
  @Protected(true, [])
  async retrieveUserAsBroker(
    @UserContext() userContext: IUserContext,
    @Query() userQuery: RetrieveUserQueryInputAsThirdParty,
    @Param() userParam: RetrieveUserParamInput,
  ): Promise<RetrieveUserOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const user: User = await this.userRetrievalService.retrieveUser(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        userContext[UserContextKeys.USER],
        userContext[UserContextKeys.CALLER_ID],
        userParam.userId,
        userQuery.tokenId,
        userQuery.assetClass,
        userQuery.withBalances,
        userQuery.withVehicles,
        userQuery.withEthBalance,
        userQuery.projectId,
        userQuery.issuerId,
      );

      const response: RetrieveUserOutput = {
        user: user,
        message: `User ${user[UserKeys.USER_ID]} retrieved successfully`,
      };

      // We don't want to return the sensible information: First connection code
      delete response.user[UserKeys.FIRST_CONNECTION_CODE];

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving a user, as broker',
        'retrieveUserAsBroker',
        true,
        500,
      );
    }
  }

  @Put(':userId')
  @HttpCode(200)
  @ApiOAuth2(['write:user'])
  @ApiOperation({ summary: 'Update a user' })
  @Protected(true, [])
  async updateUser(
    @UserContext() userContext: IUserContext,
    @Param() userParam: UpdateUserParamInput,
    @Body() userBody: UpdateUserBodyInput,
  ): Promise<MessageOutput> {
    // User is not returned anymore (reason realted to the H1 audit - to be clarified by Marco Menozzi)
    try {
      const selfUpdate: boolean =
        userParam.userId === userContext[UserContextKeys.USER_ID];

      let errorMessage;

      if (!selfUpdate) {
        const userType: UserType =
          userContext[UserContextKeys.USER][UserKeys.USER_TYPE];

        // Check if the given update parameters are only for user data
        const updateDataOnly =
          Object.entries(userBody.updatedParameters).filter(
            ([key]) => key !== UserKeys.DATA,
          ).length === 0;

        if (userType === UserType.SUPERADMIN) {
          // Ok, SUPERADMIN can update all users
        } else {
          let actionForbidden: boolean;
          const userToUpdate: User =
            await this.apiEntityCallService.fetchEntity(
              userContext[UserContextKeys.TENANT_ID],
              userParam.userId,
              true,
            );

          if (userType === UserType.ADMIN) {
            if (
              userToUpdate[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
              userToUpdate[UserKeys.USER_TYPE] === UserType.ADMIN
            ) {
              // ADMIN can not update SUPERDMINs or other ADMINs
              actionForbidden = true;
            }
          } else if (userType === UserType.ISSUER) {
            if (
              userToUpdate[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
              userToUpdate[UserKeys.USER_TYPE] === UserType.ADMIN ||
              userToUpdate[UserKeys.USER_TYPE] === UserType.ISSUER
            ) {
              // ISSUER can not update SUPERDMINs, ADMINs or other ISSUERs
              actionForbidden = true;
            }
            // If user type is ISSUER and user to update is INVESTOR or BROKER or AGENT...
            if (
              userToUpdate[UserKeys.USER_TYPE] === UserType.INVESTOR ||
              userToUpdate[UserKeys.USER_TYPE] === UserType.BROKER ||
              userToUpdate[UserKeys.USER_TYPE] === UserType.AGENT
            ) {
              // Check if the INVESTOR has already signed up. If so ISSUER is not allowed to update it other than the data fields
              if (userToUpdate[UserKeys.AUTH_ID] && !updateDataOnly) {
                actionForbidden = true;
                errorMessage = `user of type ${userType} is not allowed to update user of type ${
                  userToUpdate[UserKeys.USER_TYPE]
                } other than the data field, because user: ${
                  userToUpdate[UserKeys.USER_TYPE]
                } already signed up`;
              } else {
                // Check that both users are linked
                const userLink =
                  await this.userHelperService.retrieveStrictUserEntityLinkIfExisting(
                    userContext[UserContextKeys.TENANT_ID],
                    userParam.userId,
                    UserType.INVESTOR,
                    userContext[UserContextKeys.USER_ID],
                    EntityType.ISSUER,
                    undefined, // assetClassKey
                  );
                if (!userLink) {
                  actionForbidden = true;
                  errorMessage = `user of type ${userType} is not allowed to update user of type ${
                    userToUpdate[UserKeys.USER_TYPE]
                  }, because they are not linked`;
                }
              }
            }
          } else if (userType === UserType.BROKER) {
            if (userToUpdate[UserKeys.USER_TYPE] !== UserType.INVESTOR) {
              actionForbidden = true;
            }
            // Check if the INVESTOR has already signed up. If so BROKER is not allowed to update it other than data fields
            if (userToUpdate[UserKeys.AUTH_ID] && !updateDataOnly) {
              actionForbidden = true;
              errorMessage = `user of type ${userType} is not allowed to update user of type ${
                userToUpdate[UserKeys.USER_TYPE]
              } other than the data field, because user: ${
                userToUpdate[UserKeys.USER_TYPE]
              } already signed up`;
            } else {
              const isLinked =
                await this.userHelperService.isInvestorLinkedToThirdParty(
                  userContext[UserContextKeys.TENANT_ID],
                  userContext[UserContextKeys.USER_ID],
                  userType,
                  userToUpdate[UserKeys.USER_ID],
                );

              if (!isLinked) {
                actionForbidden = true;
                errorMessage = `user of type ${userType} is not allowed to update user of type ${
                  userToUpdate[UserKeys.USER_TYPE]
                }, because user: ${
                  userToUpdate[UserKeys.USER_ID]
                } is not linked with broker: ${
                  userContext[UserContextKeys.USER_ID]
                }`;
              }
            }
          } else {
            actionForbidden = true;
          }

          if (actionForbidden) {
            errorMessage =
              errorMessage ||
              `user of type ${userType} is not allowed to update user of type ${
                userToUpdate[UserKeys.USER_TYPE]
              }`;
            ErrorService.throwError(errorMessage);
          }
        }
      }

      const updatedUser: User = await this.userUpdateService.updateUserById(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        userParam.userId,
        userBody.updatedParameters,
      );

      const response = {
        message: `User ${updatedUser[UserKeys.USER_ID]} updated successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating a user',
        'updateUser',
        true,
        500,
      );
    }
  }

  @Delete(':userId')
  @HttpCode(200)
  @ApiOAuth2(['delete:user'])
  @ApiOperation({ summary: 'Delete a user' })
  @Protected(true, [])
  async deleteUser(
    @UserContext() userContext: IUserContext,
    @Param() userParam: DeleteUserParamInput,
    @Query() userQuery: DeleteUserQueryInput,
  ): Promise<DeleteUserOutput> {
    try {
      const selfUpdate: boolean =
        userParam.userId === userContext[UserContextKeys.USER_ID];

      if (!selfUpdate) {
        const userType: UserType =
          userContext[UserContextKeys.USER][UserKeys.USER_TYPE];

        if (userType === UserType.SUPERADMIN) {
          // Ok, SUPERADMIN can update all users
        } else {
          let actionForbidden: boolean;
          const userToUpdate: User =
            await this.apiEntityCallService.fetchEntity(
              userContext[UserContextKeys.TENANT_ID],
              userParam.userId,
              true,
            );
          if (userType === UserType.ADMIN) {
            if (
              userToUpdate[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
              userToUpdate[UserKeys.USER_TYPE] === UserType.ADMIN
            ) {
              // ADMIN can not update SUPERDMINs or other ADMINs
              actionForbidden = true;
            }
          } else if (userType === UserType.ISSUER) {
            if (
              userToUpdate[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
              userToUpdate[UserKeys.USER_TYPE] === UserType.ADMIN ||
              userToUpdate[UserKeys.USER_TYPE] === UserType.ISSUER
            ) {
              // ADMIN can not update SUPERDMINs, ADMINs or other ISSUERs
              actionForbidden = true;
            }
          } else {
            actionForbidden = true;
          }

          if (actionForbidden) {
            ErrorService.throwError(
              `user of type ${userType} is not allowed not update user of type ${
                userToUpdate[UserKeys.USER_TYPE]
              }`,
            );
          }
        }
      }

      const response: DeleteUserOutput =
        await this.userDeletionService.deleteUserById(
          userContext[UserContextKeys.TENANT_ID],
          userParam.userId,
          userQuery.auth0UserDelete,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting a user',
        'deleteUser',
        true,
        500,
      );
    }
  }

  @Put('/:userId/add/notary')
  @HttpCode(200)
  @ApiOAuth2(['write:user:notary'])
  @ApiOperation({ summary: 'Select a notary, as an admin or as an issuer' })
  @Protected(true, [])
  async addNotaryForAdminOrIssuer(
    @UserContext() userContext: IUserContext,
    @Param() notaryParam: NotaryParamInput,
    @Body() notaryBody: NotaryBodyInput,
  ): Promise<NotaryOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const functionName: FunctionName = FunctionName.KYC_ADD_NOTARY;

      const response: NotaryOutput =
        await this.roleService.addThirdPartyToEntityAsIssuer(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          functionName,
          notaryBody.notaryId,
          UserType.NOTARY,
          userContext[UserContextKeys.USER_ID],
          notaryParam.userId,
          EntityType.ISSUER,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding notary for admin/issuer',
        'addNotaryForAdminOrIssuer',
        true,
        500,
      );
    }
  }

  @Put('/:userId/add/kyc/verifier')
  @HttpCode(200)
  @ApiOAuth2(['write:user:verifier'])
  @ApiOperation({ summary: 'Select a verifier, as an admin or as an issuer' })
  @Protected(true, [])
  async addKycVerifierForAdminOrIssuer(
    @UserContext() userContext: IUserContext,
    @Param() verifierParam: VerifierParamInput,
    @Body() verifierBody: VerifierBodyInput,
  ): Promise<VerifierOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const functionName: FunctionName = FunctionName.KYC_ADD_VERIFIER;

      const response: VerifierOutput =
        await this.roleService.addThirdPartyToEntityAsIssuer(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          functionName,
          verifierBody.verifierId,
          UserType.VERIFIER,
          userContext[UserContextKeys.USER_ID],
          verifierParam.userId,
          EntityType.ISSUER,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding KYC verifier for admin/issuer',
        'addKycVerifierForAdminOrIssuer',
        true,
        500,
      );
    }
  }

  @Put('/:userId/add/nav/manager')
  @HttpCode(200)
  @ApiOAuth2(['write:user:nav-manager'])
  @ApiOperation({
    summary: 'Select a NAV manager, as an admin or as an issuer',
  })
  @Protected(true, [])
  async addNavManagerForAdminOrIssuer(
    @UserContext() userContext: IUserContext,
    @Param() navManagerParam: NavManagerParamInput,
    @Body() navManagerBody: NavManagerBodyInput,
  ): Promise<NavManagerOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const functionName: FunctionName = FunctionName.KYC_ADD_NAV_MANAGER;

      const response: NavManagerOutput =
        await this.roleService.addThirdPartyToEntityAsIssuer(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          functionName,
          navManagerBody.navManagerId,
          UserType.NAV_MANAGER,
          userContext[UserContextKeys.USER_ID],
          navManagerParam.userId,
          EntityType.ISSUER,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding KYC verifier for admin/issuer',
        'addNavManagerForAdminOrIssuer',
        true,
        500,
      );
    }
  }
}
