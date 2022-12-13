import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';
import {
  ClientApplication,
  keys as ClientApplicationKeys,
} from '../../../types/clientApplication';
import { ApiAdminCallService } from '../../v2ApiCall/api.call.service/admin';
import { ApiEntityCallService } from '../../v2ApiCall/api.call.service/entity';
import { keys as UserKeys, User } from '../../../types/user';

@Injectable()
export class NestedUserFixService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  fixNestedUserData = (userData: any): any => {
    const cleanUserData = { ...userData };
    this.apiEntityCallService.userKeysNotToAddInMetadata.map((userProperty) => {
      delete cleanUserData[userProperty];
    });

    if (userData.data && Object.keys(userData.data).length > 0) {
      return {
        ...this.fixNestedUserData(userData.data),
        ...cleanUserData,
      };
    } else {
      return cleanUserData;
    }
  };

  async fixNestedUsers(
    dryRun: boolean,
    singleTenantIdToFix?: string,
    singleEntityIdToFix?: string,
  ) {
    this.logger.info('NESTED USERS: Starting nested user fix');

    const nestedUsers: Array<User> = [];
    const nestedUsersFixFail: Array<User> = [];

    const clientApplicationsList: Array<ClientApplication> =
      await this.apiAdminCallService.listAllClientApplicationInAuth0();

    const tenantIdsList: Array<string> = [];
    clientApplicationsList.map((clientApplication: ClientApplication) => {
      if (
        clientApplication &&
        clientApplication[ClientApplicationKeys.METADATA] &&
        clientApplication[ClientApplicationKeys.METADATA][
          ClientApplicationKeys.METADATA__TENANT_ID
        ]
      ) {
        tenantIdsList.push(
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ],
        );
      }
    });

    for (const tenantId of tenantIdsList) {
      if (singleTenantIdToFix && tenantId !== singleTenantIdToFix) {
        continue;
      }

      this.logger.info(`NESTED USERS: tenantId ${tenantId}`);

      // Fetch users
      const allUsers: Array<User> =
        await this.apiEntityCallService.fetchEntities(
          tenantId,
          {}, // filter
          true, // includeWallets
        );

      for (const user of allUsers) {
        if (
          singleEntityIdToFix &&
          user[UserKeys.USER_ID] !== singleEntityIdToFix
        ) {
          continue;
        }

        if (user?.[UserKeys.DATA]?.[UserKeys.DATA]) {
          nestedUsers.push(user);
        }
      }
    }

    this.logger.info(`NESTED USERS: ${nestedUsers?.length} users to fix`);

    if (!dryRun) {
      for (let index = 0; index < nestedUsers.length; index++) {
        this.logger.info(
          `NESTED USERS: ${index}/${nestedUsers?.length} users fixed`,
        );

        const nestedUser: User = nestedUsers[index];
        const updates = {
          [UserKeys.DATA]: this.fixNestedUserData(nestedUser[UserKeys.DATA]),
        };
        try {
          await this.apiEntityCallService.patchEntity(
            nestedUser[UserKeys.TENANT_ID],
            nestedUser[UserKeys.USER_ID],
            updates,
          );
        } catch (error) {
          nestedUsersFixFail.push(nestedUser);
        }
      }
    }

    return {
      nestedUsers,
      nestedUsersFixFail,
    };
  }
}
