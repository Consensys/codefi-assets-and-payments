import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { UserEnum } from '../../../old/constants/enum';
import {
  ClientApplication,
  keys as ClientApplicationKeys,
} from '../../../types/clientApplication';
import { ApiAdminCallService } from '../../v2ApiCall/api.call.service/admin';
import { ApiEntityCallService } from '../../v2ApiCall/api.call.service/entity';
import { ApiMetadataCallService } from '../../v2ApiCall/api.call.service/metadata';
import { keys as UserKeys, User, UserType } from '../../../types/user';
import { IS_DEV_DOMAIN_NAME } from 'src/utils/domain';
import { DEV_DOMAIN_NAME } from 'src/types/authentication';

import ErrorService from 'src/utils/errorService';

const CROSS_NAMESPACE_MIGRATION = true;
@Injectable()
export class DevNamespaceUsersFixService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  async fixDevNamespaceUsers(
    dryRun: boolean,
    singleTenantIdToFix?: string,
    singleEntityIdToFix?: string,
  ) {
    this.logger.info('DEV NAMESPACE USERS: Starting dev namespace users fix');

    if (!IS_DEV_DOMAIN_NAME) {
      ErrorService.throwError(
        'this script shall only be run in the dev namespace',
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

      this.logger.info(`DEV NAMESPACE USERS: tenantId ${tenantId}`);

      // List of metadata users
      const users: User[] = singleEntityIdToFix
        ? [
            await this.apiMetadataCallService.retrieveUserInDB(
              tenantId,
              UserEnum.userId,
              singleEntityIdToFix,
              true,
            ),
          ]
        : await this.apiMetadataCallService.retrieveUserInDB(
            tenantId,
            UserEnum.all,
            undefined,
            false,
          );

      // List of entity-api entities
      const entities = singleEntityIdToFix
        ? [
            await this.apiEntityCallService.fetchEntity(
              tenantId,
              singleEntityIdToFix,
              false,
              CROSS_NAMESPACE_MIGRATION,
            ),
          ]
        : await this.apiEntityCallService.fetchEntities(
            tenantId,
            {},
            true, // includeWallets
            CROSS_NAMESPACE_MIGRATION, // crossNamespaceMigration
          );

      const entitiesMap: {
        [entityId: string]: User;
      } = entities.reduce(
        (map, entity: User) => ({
          ...map,
          [entity.id]: entity,
        }),
        {},
      );

      let i = 0;
      // For each user, check if it has changed or not
      for (const user of users) {
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
          `DEV NAMESPACE USERS: tenantId ${tenantId} entity ${
            user.id
          } (${++i}/${users.length})`,
        );

        const existingEntity = entitiesMap[user.id];

        if (
          !(
            existingEntity &&
            existingEntity[UserKeys.DEFAULT_WALLET]?.length > 0
          )
        ) {
          // We don't want to migrate users without wallets because it fails
          continue;
        }

        const subTenantId = existingEntity?.data?.subTenantId;
        if (existingEntity) {
          if (subTenantId !== DEV_DOMAIN_NAME) {
            try {
              if (!dryRun) {
                const updates = {
                  [UserKeys.DATA]: {
                    ...existingEntity[UserKeys.DATA],
                    [UserKeys.DATA__SUB_TENANT_ID]: DEV_DOMAIN_NAME,
                  },
                };
                await this.apiEntityCallService.patchEntity(
                  existingEntity[UserKeys.TENANT_ID],
                  existingEntity[UserKeys.USER_ID],
                  updates,
                  CROSS_NAMESPACE_MIGRATION, // crossNamespaceMigration
                );
              }

              updatedEntities.push({
                tenantId: existingEntity[UserKeys.TENANT_ID],
                entityId: existingEntity[UserKeys.USER_ID],
              });
            } catch (error) {
              updateFailEntities.push(existingEntity);
            }
          } else {
            alreadyMigratedEntities.push({
              tenantId: existingEntity[UserKeys.TENANT_ID],
              entityId: existingEntity[UserKeys.USER_ID],
            });
          }
        }
      }
    }

    return {
      updatedEntities,
      updateFailEntities,
      alreadyMigratedEntities,
    };
  }
}
