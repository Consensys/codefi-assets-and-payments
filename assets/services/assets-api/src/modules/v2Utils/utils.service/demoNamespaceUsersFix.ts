import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';
import {
  ClientApplication,
  keys as ClientApplicationKeys,
} from '../../../types/clientApplication';
import { ApiAdminCallService } from '../../v2ApiCall/api.call.service/admin';
import { ApiEntityCallService } from '../../v2ApiCall/api.call.service/entity';
import { keys as UserKeys, User, UserType } from '../../../types/user';
import { IS_DEMO_DOMAIN_NAME } from 'src/utils/domain';
import { DEMO_DOMAIN_NAME } from 'src/types/authentication';

import ErrorService from 'src/utils/errorService';

@Injectable()
export class DemoNamespaceUsersFixService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  async fixDemoNamespaceUsers(
    dryRun: boolean,
    singleTenantIdToFix?: string,
    singleEntityIdToFix?: string,
  ) {
    this.logger.info('DEMO NAMESPACE USERS: Starting demo namespace users fix');

    if (!IS_DEMO_DOMAIN_NAME) {
      ErrorService.throwError(
        'this script shall only be run in the demo namespace',
      );
    }

    const alreadyMigratedEntities: {
      tenantId: string;
      entityId: string;
    }[] = [];
    const updatedEntities: {
      tenantId: string;
      entityId: string;
    }[] = [];
    const updateFailEntities: any[] = [];
    const invalidEntities: any[] = [];

    // Fetch assets client applications with a tenantId
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
        const tenantId =
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__TENANT_ID
          ];
        if (!tenantIdsList.includes(tenantId)) {
          tenantIdsList.push(tenantId);
        }
      }
    });

    // For each tenant, check if it has changed or not
    for (const tenantId of tenantIdsList) {
      if (singleTenantIdToFix && tenantId !== singleTenantIdToFix) {
        continue;
      }

      this.logger.info(`DEMO NAMESPACE USERS: tenantId ${tenantId}`);

      // List of entity-api entities
      const entities = singleEntityIdToFix
        ? [
            await this.apiEntityCallService.fetchEntity(
              tenantId,
              singleEntityIdToFix,
              false,
              false,
            ),
          ]
        : await this.apiEntityCallService.fetchEntities(
            tenantId,
            {},
            true, // includeWallets
            false, // crossNamespaceMigration
          );

      // Users without 'user.data.subTenantId' flags
      const usersWithoutSubTenantIdFlag = entities.filter((entity: User) => {
        const entitySubTenantId =
          entity?.[UserKeys.DATA]?.[UserKeys.DATA__SUB_TENANT_ID];

        if (entitySubTenantId) {
          if (entitySubTenantId === DEMO_DOMAIN_NAME) {
            alreadyMigratedEntities.push({
              tenantId: entity[UserKeys.TENANT_ID],
              entityId: entity[UserKeys.USER_ID],
            });
          } else {
            // Shall never happen
            invalidEntities.push(entity);
          }
          return false;
        }

        return true;
      });

      let i = 0;
      // For each user without flag, add the 'demo' flag
      for (const user of usersWithoutSubTenantIdFlag) {
        if (user[UserKeys.USER_TYPE] === UserType.VEHICLE) {
          // We don't want to migrate VEHICLES
          continue;
        }

        if (
          singleEntityIdToFix &&
          user[UserKeys.USER_ID] !== singleEntityIdToFix
        ) {
          continue;
        }

        this.logger.info(
          `DEMO NAMESPACE USERS: tenantId ${tenantId} entity ${
            user.id
          } (${++i}/${usersWithoutSubTenantIdFlag.length})`,
        );

        if (!(user && user[UserKeys.DEFAULT_WALLET]?.length > 0)) {
          // We don't want to migrate users without wallets because it fails
          continue;
        }

        try {
          if (!dryRun) {
            const updates = {
              [UserKeys.DATA]: {
                ...user[UserKeys.DATA],
                [UserKeys.DATA__SUB_TENANT_ID]: DEMO_DOMAIN_NAME,
              },
            };
            await this.apiEntityCallService.patchEntity(
              user[UserKeys.TENANT_ID],
              user[UserKeys.USER_ID],
              updates,
              false, // crossNamespaceMigration
            );
          }

          updatedEntities.push({
            tenantId: user[UserKeys.TENANT_ID],
            entityId: user[UserKeys.USER_ID],
          });
        } catch (error) {
          updateFailEntities.push(user);
        }
      }
    }

    return {
      updatedEntities,
      updateFailEntities,
      alreadyMigratedEntities,
      invalidEntities,
    };
  }
}
