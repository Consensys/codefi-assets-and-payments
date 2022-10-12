import {
  EntityCreateRequest,
  TenantCreateRequest,
  TenantResponse,
  WalletType as EntityApiWalletType,
} from '@codefi-assets-and-payments/ts-types';
import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { UserEnum } from '../../../old/constants/enum';
import {
  ClientApplication,
  extractNameFromM2mClientApplicationName,
  keys as ClientApplicationKeys,
} from '../../../types/clientApplication';
import { keys as WalletKeys, Wallet, WalletType } from '../../../types/wallet';
import { ApiAdminCallService } from '../../v2ApiCall/api.call.service/admin';
import { ApiEntityCallService } from '../../v2ApiCall/api.call.service/entity';
import { ApiMetadataCallService } from '../../v2ApiCall/api.call.service/metadata';
import { keys as UserKeys, User, UserType } from '../../../types/user';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { keys as ConfigKeys } from 'src/types/config';
import { keys as NetworkKeys, Network } from '../../../types/network';
import { NetworkService } from 'src/modules/v2Network/network.service';

@Injectable()
export class EntityMigrationService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly configService: ConfigService,
    private readonly networkService: NetworkService,
  ) {}

  async migrateTenants(dryRun: boolean, singleTenantIdToMigrate?: string) {
    this.logger.info('TENANT: Starting tenant migrations');

    const alreadyMigratedTenants: string[] = [];
    const createdTenants: string[] = [];
    const createFailTenants: any[] = [];

    // Fetch assets client applications with a tenantId
    const clientApplicationsList: Array<ClientApplication> = (
      await this.apiAdminCallService.listAllClientApplicationInAuth0()
    ).filter(
      (clientApplication) =>
        clientApplication &&
        clientApplication[ClientApplicationKeys.METADATA] &&
        clientApplication[ClientApplicationKeys.METADATA][
          ClientApplicationKeys.METADATA__TENANT_ID
        ] &&
        // TODO BGC This removes duplicate M2M applications. Check before merging
        !clientApplication[ClientApplicationKeys.NAME].endsWith(' - M2M'),
    );

    // List of entity-api tenants
    const tenants = await this.apiEntityCallService.fetchTenants({});

    const tenantsMap: {
      [tenantId: string]: TenantResponse;
    } = tenants.reduce(
      (map, tenant: TenantResponse) => ({
        ...map,
        [tenant.id]: tenant,
      }),
      {},
    );

    const tenantIdsToMigrate: Array<string> = [];

    const clientsMap: {
      [tenantId: string]: ClientApplication;
    } = clientApplicationsList.reduce((map, client: ClientApplication) => {
      const tenantId =
        client?.[ClientApplicationKeys.METADATA]?.[
          ClientApplicationKeys.METADATA__TENANT_ID
        ];

      // If 'singleTenantIdToMigrate' is defined, only this tenant shall be migrated
      if (singleTenantIdToMigrate) {
        if (!tenantIdsToMigrate.includes(singleTenantIdToMigrate)) {
          tenantIdsToMigrate.push(singleTenantIdToMigrate);

          return singleTenantIdToMigrate === tenantId
            ? {
                ...map,
                [tenantId]: client,
              }
            : map;
        }

        return map;
      }

      // Otherwise, all tenants shall be migrated
      tenantIdsToMigrate.push(tenantId);

      return tenantId
        ? {
            ...map,
            [tenantId]: client,
          }
        : map;
    }, {});

    // For each tenant, check if it has changed or not
    for (const tenantId of tenantIdsToMigrate) {
      const clientApplication: ClientApplication = clientsMap[tenantId];
      const existingTenant = tenantsMap[tenantId];
      const defaultNetworkKey = await this.tenantDefaultNetworkKey(tenantId);

      if (!existingTenant) {
        await this.createTenant(
          tenantId,
          clientApplication,
          defaultNetworkKey,
          createdTenants,
          createFailTenants,
          dryRun,
        );
      } else {
        alreadyMigratedTenants.push(existingTenant.id);
      }
    }

    return {
      alreadyMigratedTenants,
      createdTenants,
      createFailTenants,
    };
  }

  private async createTenant(
    tenantId: string,
    clientApplication: ClientApplication,
    defaultNetworkKey: string,
    createdTenants: string[],
    createFailTenants: any[],
    dryRun: boolean,
  ) {
    this.logger.info(
      `TENANT: Tenant ${tenantId} not found. Starting migration`,
    );

    const request: TenantCreateRequest = {
      id: tenantId,
      name: extractNameFromM2mClientApplicationName(
        clientApplication[ClientApplicationKeys.NAME],
      ),
      products: { assets: true },
      defaultNetworkKey,
      metadata: {
        assetsMigrationToEntityApi: true,
        subTenantId:
          clientApplication[ClientApplicationKeys.METADATA][
            ClientApplicationKeys.METADATA__SUB_TENANT_ID
          ],
      },
      initialEntities: [
        {
          name: `${tenantId}-Delete`,
          metadata: {
            deleteAfterMigration: true,
          },
        },
      ],
    };

    try {
      if (!dryRun) {
        const response = await this.apiEntityCallService.createTenant(request);
        this.logger.info(`TENANT: Tenant ${response.id} migrated successfully`);
      }

      createdTenants.push(request.id);
    } catch (error) {
      this.logger.error(
        `TENANT: Tenant ${tenantId} migration failed: ${
          error?.message ? error.message : error
        }`,
      );

      createFailTenants.push(request);
    }

    if (!dryRun) {
      try {
        const [defaultEntity] = await this.apiEntityCallService.fetchEntities(
          tenantId,
          {
            name: `${tenantId}-Delete`,
            metadata: {
              deleteAfterMigration: true,
            },
          },
          false,
        );

        await this.apiEntityCallService.deleteEntity(
          tenantId,
          defaultEntity.id,
        );
      } catch (error) {
        this.logger.error(
          `TENANT: Failed to remove default entity for ${tenantId}: ${
            error?.message ? error.message : error
          }`,
        );
      }
    }
  }

  async migrateEntities(
    tenantId: string,
    dryRun: boolean,
    singleEntityIdToMigrate: string,
  ) {
    this.logger.info(`ENTITY: Start entity migration for tenant ${tenantId}`);

    const alreadyMigratedEntities: {
      tenantId: string;
      entityId: string;
    }[] = [];
    const createdEntities: {
      tenantId: string;
      entityId: string;
    }[] = [];
    const createFailEntities: any[] = [];

    const createdWallets: {
      tenantId: string;
      entityId: string;
      walletAddress: string;
    }[] = [];

    const createFailWallets: any[] = [];

    // List of metadata users
    const users: User[] = singleEntityIdToMigrate
      ? [
          await this.apiMetadataCallService.retrieveUserInDB(
            tenantId,
            UserEnum.userId,
            singleEntityIdToMigrate,
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
    const entities = await this.apiEntityCallService.fetchEntities(
      tenantId,
      {},
      true,
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

    // For each user, check if it has changed or not
    for (const user of users) {
      if (user[UserKeys.USER_TYPE] === UserType.VEHICLE) {
        // We don't want to migrate VEHICLES
        continue;
      }

      const entityId = user.id;
      const existingEntity = entitiesMap[entityId];
      const userWallets = this.filterUserWallets(user.wallets);

      if (!existingEntity) {
        await this.createEntity(
          tenantId,
          entityId,
          user,
          userWallets,
          createdEntities,
          createFailEntities,
          createdWallets,
          createFailWallets,
          dryRun,
        );
        continue;
      } else {
        alreadyMigratedEntities.push({
          tenantId,
          entityId: existingEntity.id,
        });
      }
    }

    return {
      alreadyMigratedEntities,
      createdEntities,
      createFailEntities,
      createdWallets,
      createFailWallets,
    };
  }

  private async createEntity(
    tenantId: string,
    entityId: string,
    user: User,
    userWallets: Wallet[],
    createdEntities: {
      tenantId: string;
      entityId: string;
    }[],
    createFailEntities: any[],
    createdWallets: {
      tenantId: string;
      entityId: string;
      walletAddress: string;
    }[],
    createFailWallets: any[],
    dryRun: boolean,
  ) {
    this.logger.info(
      `ENTITY: Entity ${entityId} not found. Starting migration`,
    );

    // TODO BGC Some users have no wallets or default wallet. Check how to handle them
    const request: EntityCreateRequest = {
      id: entityId,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        ...this.apiEntityCallService.craftUserMetadata(user),
        assetsMigrationToEntityApi: true,
      },
      initialWallets:
        userWallets && userWallets?.length > 0
          ? userWallets.map((wallet) => this.craftWalletRequest(wallet))
          : undefined,
      defaultWallet:
        userWallets &&
        userWallets?.length > 0 &&
        userWallets.some(
          (wallet) => wallet[WalletKeys.WALLET_ADDRESS] === user.defaultWallet,
        )
          ? user.defaultWallet
          : undefined,
    };

    try {
      if (!dryRun) {
        const response = await this.apiEntityCallService.createEntity(
          tenantId,
          request,
        );
        this.logger.info(`ENTITY: Entity ${response.id} migrated successfully`);
      }

      createdEntities.push({
        tenantId,
        entityId: request.id,
      });

      if (request.initialWallets) {
        createdWallets.push(
          ...request.initialWallets.map((wallet) => {
            return {
              tenantId,
              entityId,
              walletAddress: wallet.address,
            };
          }),
        );
      }
    } catch (error) {
      this.logger.error(
        `ENTITY: Entity ${entityId} migration failed: ${
          error?.message ? error.message : error
        }`,
      );

      createFailEntities.push({
        tenantId,
        request,
      });
      createFailWallets.push({
        tenantId,
        entityId,
        wallets: request.initialWallets
          ? [...request.initialWallets.map((wallet) => wallet.address)]
          : undefined,
      });
    }
  }

  private filterUserWallets(wallets: Wallet[]) {
    return wallets.filter((wallet) => {
      return (
        wallet[WalletKeys.WALLET_ADDRESS] &&
        wallet[WalletKeys.WALLET_ADDRESS] !==
          '0x0000000000000000000000000000000000000000'
      );
    });
  }

  private async tenantDefaultNetworkKey(tenantId: string) {
    const { config } = await this.configService.retrieveConfig(
      tenantId,
      undefined,
    );

    if (
      config &&
      config[ConfigKeys.DATA] &&
      config[ConfigKeys.DATA][ConfigKeys.DATA__DEFAULT_CHAIN_ID]
    ) {
      return config[ConfigKeys.DATA][ConfigKeys.DATA__DEFAULT_CHAIN_ID];
    } else {
      const defaultNetwork: Network =
        await this.networkService.retrieveDefaultNetwork(tenantId, true);
      return defaultNetwork[NetworkKeys.KEY];
    }
  }

  private craftWalletRequest(wallet: Wallet) {
    return {
      address: wallet.address,
      type: this.walletTypeMap[wallet.type],
      metadata: {
        ...wallet.data,
        assetsMigrationToEntityApi: true,
        legacyAssetsWalletType: wallet.type,
      },
    };
  }

  private walletTypeMap = {
    [WalletType.VAULT]: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
    [WalletType.VAULT_DEPRECATED]: EntityApiWalletType.EXTERNAL_OTHER,
    [WalletType.LEDGER]: EntityApiWalletType.EXTERNAL_OTHER,
  };
}
