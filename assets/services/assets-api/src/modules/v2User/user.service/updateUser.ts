import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import {
  EntityEnum,
  keys as UserKeys,
  User,
  UserData,
  UserType,
} from 'src/types/user';
import { Auth0User } from 'src/types/authentication';
import { ApiAdminCallService } from 'src/modules/v2ApiCall/api.call.service/admin';
import { getTenantRolesForUserType } from 'src/utils/tenantRoles';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class UserUpdateService {
  constructor(
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}
  /**
   * [Update a specific user]
   */
  async updateUserById(
    tenantId: string,
    user: User,
    userToUpdateId: string,
    updatedParameters: any,
  ): Promise<User> {
    try {
      // Retrieve user in Codefi database
      const userToUpdate = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userToUpdateId,
        true,
      );

      // Retrieve user in Auth0 (if defined)
      let auth0User: Auth0User;
      try {
        auth0User = userToUpdate[UserKeys.AUTH_ID]
          ? await this.apiAdminCallService.retrieveUsersInAuth0ById(
              tenantId, // not used for now
              userToUpdate[UserKeys.AUTH_ID],
            )
          : undefined;
      } catch (error) {
        ErrorService.throwError(
          `user to update has an invalid authId (${
            userToUpdate[UserKeys.AUTH_ID]
          }). Consequently, it is impossible to update his email`,
        );
      }

      let updates: any;

      // Parameter to update: 'tenantId'
      if (updatedParameters[UserKeys.TENANT_ID]) {
        ErrorService.throwError("a user's 'tenantId' can't be updated");
      }

      // Parameter to update: 'firstConnectionCode'
      if (updatedParameters[UserKeys.FIRST_CONNECTION_CODE]) {
        ErrorService.throwError(
          "a user's 'firstConnectionCode' can't be updated",
        );
      }

      // Parameter to update: 'authId'
      if (updatedParameters[UserKeys.AUTH_ID]) {
        ErrorService.throwError(
          "a user's 'authId' can't be updated (otherwise, 'tenantId'+'entityId' stored in target Auth0 user's metadata would have to be overwritten)",
        );
      }

      // Parameter to update: 'userType'
      if (
        updatedParameters[UserKeys.USER_TYPE] &&
        updatedParameters[UserKeys.USER_TYPE] !==
          userToUpdate[UserKeys.USER_TYPE]
      ) {
        if (
          !this.checkUserTypeCanBeUpdated(
            user[UserKeys.USER_TYPE],
            updatedParameters[UserKeys.USER_TYPE],
          )
        ) {
          ErrorService.throwError(
            `user of type ${
              user[UserKeys.USER_TYPE]
            } is not alowed to turn a user of type ${
              userToUpdate[UserKeys.USER_TYPE]
            } into a user of type ${updatedParameters[UserKeys.USER_TYPE]}`,
          );
        }

        // In case user is defined in Auth0, user's tenantRoles need to be updated in Auth0
        if (auth0User) {
          await this.apiAdminCallService.updateUserInAuth0ById(
            userToUpdate[UserKeys.TENANT_ID],
            auth0User?.userId, // authId
            userToUpdate[UserKeys.USER_ID],
            getTenantRolesForUserType(updatedParameters[UserKeys.USER_TYPE]), // tenantRoles
          );
        }
      }

      // Parameter to update: 'dafaultWallet'
      if (updatedParameters[UserKeys.DEFAULT_WALLET]) {
        ErrorService.throwError(
          "please use '/wallet' endpoints to update user's defaultWallet",
        );
      }

      // Parameter to update: 'wallets'
      if (updatedParameters[UserKeys.WALLETS]) {
        ErrorService.throwError(
          "please use '/wallet' endpoints to update user's wallets",
        );
      }

      // There is one single situation, where entity's email can be updated.
      //  - 'Entity1' exists and is coupled with 'Auth0User1', which has 'email1' as email
      //  - 'Entity1' has 'email1' as email
      //  - 'Auth0User1' creates an 'Auth0User2' with 'email2' as email and couples 'Auth0User2' with 'Entity1', thanks to "POST {{CODEFI_API}}/essentials/auth0user" endpoint
      //  - 'Auth0User2' calls this endpoint ("PUT {{CODEFI_API}}/essentials/user/{{user}}") to update the email of 'Entity1' and set it to 'email2'
      //  - 'Entity1' has 'email2' as email
      if (
        updatedParameters[UserKeys.EMAIL] &&
        updatedParameters[UserKeys.EMAIL] !== userToUpdate[UserKeys.EMAIL]
      ) {
        const [usersWithSameEmail, auth0UsersWithSameEmail]: [
          Array<User>,
          Array<Auth0User>,
        ] = await Promise.all([
          this.apiEntityCallService.fetchFilteredEntities(
            tenantId,
            EntityEnum.email,
            updatedParameters[UserKeys.EMAIL],
            true, // includeWallets
          ),
          this.apiAdminCallService.retrieveUsersInAuth0ByEmail(
            tenantId, // not used for now
            updatedParameters[UserKeys.EMAIL],
          ),
        ]);

        const entityAuth0UsersList: Array<Auth0User> =
          await this.apiAdminCallService.listAllAuth0UsersInByTenantIdAndEntityId(
            userToUpdate[UserKeys.TENANT_ID],
            userToUpdate[UserKeys.USER_ID],
          );

        const filteredEntityAuth0UsersList: Array<Auth0User> =
          entityAuth0UsersList.filter((entityAuth0User: Auth0User) => {
            return (
              entityAuth0User?.email &&
              entityAuth0User?.email === updatedParameters[UserKeys.EMAIL]
            );
          });

        let newAuth0User: Auth0User;
        if (usersWithSameEmail?.length > 0) {
          ErrorService.throwError(
            `Impossible to set ${
              updatedParameters[UserKeys.EMAIL]
            } as email for entity, as there's already another entity with the same email.`,
          );
        } else if (auth0UsersWithSameEmail?.length < 1) {
          ErrorService.throwError(
            `Impossible to set ${
              updatedParameters[UserKeys.EMAIL]
            } as email for entity, as no user with this email could be found in Auth0. Please first create user in Auth0 whith the following endpoint "POST {{CODEFI_API}}/essentials/auth0user"`,
          );
        } else if (filteredEntityAuth0UsersList?.length < 1) {
          ErrorService.throwError(
            `User with email ${
              updatedParameters[UserKeys.EMAIL]
            } exists in Auth0, but is not coupled to entity with id ${userToUpdateId}. Consequently, his email can't be set as email for the entity.`,
          );
        } else if (filteredEntityAuth0UsersList?.length > 1) {
          ErrorService.throwError(
            `Shall never happen: more than one user with email ${
              updatedParameters[UserKeys.EMAIL]
            } was found in Auth0.`,
          );
        } else {
          newAuth0User = filteredEntityAuth0UsersList[0];
        }

        // If all conditions are met, to update entity's email, we need to update entity's 'authId' as well.
        updatedParameters[UserKeys.AUTH_ID] = newAuth0User?.userId;
      }

      // Parameter to update: 'data'
      if (
        updatedParameters[UserKeys.DATA] &&
        Object.keys(updatedParameters[UserKeys.DATA]).length > 0
      ) {
        // add new elements to data property
        const newData: UserData = {
          ...userToUpdate[UserKeys.DATA],
          ...updatedParameters[UserKeys.DATA],
        };

        updates = {
          ...updatedParameters,
          data: newData,
        };
      } else {
        updates = {
          ...updatedParameters,
        };
      }

      const updatedUser: User = await this.apiEntityCallService.patchEntity(
        tenantId,
        userToUpdateId,
        updates,
      );
      return updatedUser;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating a user',
        'updateUserById',
        false,
        500,
      );
    }
  }

  checkUserTypeCanBeUpdated(
    executerUserType: UserType,
    destinationUserType: UserType,
  ): boolean {
    if (executerUserType === UserType.SUPERADMIN) {
      return true; // SUPERADMIN can update userType of all users
    } else {
      if (destinationUserType === UserType.SUPERADMIN) {
        return false; // No one, other than the SUPERADMIN can create a SUPERADMIN
      }

      if (executerUserType === UserType.ADMIN) {
        return true; // 'destinationUserType' is not SUPERADMIN => So it's ok
      } else {
        if (destinationUserType === UserType.ADMIN) {
          return false;
        }

        if (executerUserType === UserType.ISSUER) {
          return true; // 'destinationUserType' is not SUPERADMIN or ADMIN => So it's ok
        } else {
          return false;
        }
      }
    }
  }
}
