import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { ApiCallHelperService } from '.';

import { keys as WalletKeys, Wallet, WalletType } from 'src/types/wallet';

import execRetry from 'src/utils/retry';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  EntityCreateRequest,
  EntityResponse,
  EntityUpdateRequest,
  TenantCreateRequest,
  TenantQueryRequest,
  TenantResponse,
  TenantUpdateRequest,
  WalletCreateRequest,
  WalletQueryRequest,
  WalletResponse,
  WalletUpdateRequest,
  WalletType as EntityApiWalletType,
  EntityQueryRequest,
} from '@codefi-assets-and-payments/ts-types';
import { OrchestrateUtils } from '@codefi-assets-and-payments/nestjs-orchestrate';
import { M2mTokenService } from '@codefi-assets-and-payments/auth';
import config from '../../../config';
import { keys as UserKeys, User, EntityEnum } from 'src/types/user';
import _ from 'lodash';

import {
  IS_DEV_DOMAIN_NAME,
  IS_DEV_OR_DEMO_DOMAIN_NAME,
} from 'src/utils/domain';
import { DEMO_DOMAIN_NAME, DEV_DOMAIN_NAME } from 'src/types/authentication';

const baseMetadata = IS_DEV_OR_DEMO_DOMAIN_NAME
  ? IS_DEV_DOMAIN_NAME
    ? {
        [UserKeys.DATA__SUB_TENANT_ID]: DEV_DOMAIN_NAME,
      }
    : {
        [UserKeys.DATA__SUB_TENANT_ID]: DEMO_DOMAIN_NAME,
      }
  : undefined;

const ENTITY_HOST: string = config().entityApi.url;
const API_NAME = 'Entity-Api';

const M2M_TOKEN_CLIENT_ID = config().m2mToken.client.id;
const M2M_TOKEN_CLIENT_SECRET = config().m2mToken.client.secret;
const M2M_TOKEN_AUDIENCE = config().m2mToken.audience;
@Injectable()
export class ApiEntityCallService {
  private entity: AxiosInstance;

  userKeysNotToAddInMetadata: Array<string> = [
    UserKeys.USER_ID,
    UserKeys.TENANT_ID,
    UserKeys.DEFAULT_WALLET,
    UserKeys.WALLETS,
    UserKeys.DATA,
    UserKeys.DATA__SUB_TENANT_ID,
    UserKeys.CREATED_AT,
    UserKeys.UPDATED_AT,
  ];

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly m2mTokenService: M2mTokenService,
  ) {
    this.entity = axios.create({
      baseURL: ENTITY_HOST,
    });
  }

  // TENANTS
  /**
   * [Fetch all tenants]
   */
  async fetchTenants(
    filter: Omit<TenantQueryRequest, 'skip' | 'limit'>,
  ): Promise<TenantResponse[]> {
    try {
      const authToken = await this.craftToken();

      const BATCH_SIZE = 1000;
      let offset = 0; // number of users to skip
      let tenantList = [];
      let nbTenantsToFetch: number;

      while (nbTenantsToFetch === undefined || nbTenantsToFetch > 0) {
        const retriedClosure = () => {
          return this.entity.get('/tenant', {
            ...this.craftAuthHeaders(authToken),
            params: {
              ...filter,
              skip: offset,
              limit: BATCH_SIZE,
            },
          });
        };
        const { data } = await execRetry(retriedClosure, 3, 1500, 1);

        tenantList = [...tenantList, ...data.items];

        // Update 'nbUsersToFetch' and 'offset'
        if (nbTenantsToFetch === undefined) {
          nbTenantsToFetch = data.count;
        }
        nbTenantsToFetch = nbTenantsToFetch - data.items.length;
        offset += data.items.length;
      }

      return tenantList;
    } catch (error) {
      ErrorService.throwApiCallError('fetchTenants', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch single tenant by id]
   */
  async fetchTenant(tenantId: string): Promise<TenantResponse> {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.get(
          `/tenant/${tenantId}`,
          this.craftAuthHeaders(authToken, tenantId),
        );
      };
      const { data: tenant } = await execRetry(retriedClosure, 1, 1500, 1);

      return tenant;
    } catch (error) {
      ErrorService.throwApiCallError('fetchTenant', API_NAME, error, 500);
    }
  }

  /**
   * [Create tenant]
   */
  async createTenant(
    tenantCreateRequest: TenantCreateRequest,
  ): Promise<TenantResponse> {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.post(
          '/tenant',
          tenantCreateRequest,
          this.craftAuthHeaders(authToken, tenantCreateRequest.id),
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating tenant',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createTenant', API_NAME, error, 500);
    }
  }

  /**
   * [Create tenant]
   */
  async updateTenant(
    tenantId: string,
    tenantUpdateRequest: TenantUpdateRequest,
  ): Promise<TenantResponse> {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.put(
          `/tenant/${tenantId}`,
          tenantUpdateRequest,
          this.craftAuthHeaders(authToken, tenantId),
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating tenant',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateTenant', API_NAME, error, 500);
    }
  }

  /**
   * [Delete tenant]
   */
  async deleteTenant(tenantId: string) {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.delete(
          `/tenant/${tenantId}`,
          this.craftAuthHeaders(authToken, tenantId),
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting tenant',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteTenant', API_NAME, error, 500);
    }
  }

  /**
   * [Create or update tenant]
   */
  async createTenantOrUpdateTenant(
    tenantCreateRequest: TenantCreateRequest,
  ): Promise<TenantResponse> {
    try {
      if (!tenantCreateRequest?.id) {
        ErrorService.throwError(
          "shall never happen: missing tenantId in 'tenantCreateRequest'",
        );
      }

      let tenant: TenantResponse;
      try {
        tenant = await this.fetchTenant(tenantCreateRequest.id);
      } catch (error) {
        // Error code is 500 when tenant doesn't exist.
        // TODO: update Entity-Api to return 404 error code when tenant doesn't exist and check it here.
      }

      if (!tenant) {
        this.logger.info(
          {},
          `Tenant with id "${tenantCreateRequest.id}" doesn't exist. It needs to be created.`,
        );

        tenant = await this.createTenant(tenantCreateRequest);
      } else if (
        this.checkTenantNeedsToBeUpdated(tenant, tenantCreateRequest)
      ) {
        this.logger.info(
          { tenant },
          `Tenant with id "${tenantCreateRequest.id}" already exists. But it needs to be updated.`,
        );
        tenant = await this.updateTenant(tenantCreateRequest.id, {
          name: tenantCreateRequest.name,
          products: tenantCreateRequest.products,
          defaultNetworkKey: tenantCreateRequest.defaultNetworkKey,
          metadata: tenantCreateRequest.metadata,
        });
      }

      this.logger.info(
        { tenant },
        `Tenant with id "${tenantCreateRequest.id}" already exists. No need to update it.`,
      );

      return tenant;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating or updating tenant',
        'createTenantOrUpdateTenant',
        false,
        500,
      );
    }
  }

  /**
   * [Check if tenant needs to be updated]
   */
  checkTenantNeedsToBeUpdated(
    existingTenant: TenantResponse,
    tenantCreateRequest: TenantCreateRequest,
  ): boolean {
    try {
      if (existingTenant.name !== tenantCreateRequest.name) {
        this.logger.info(
          {},
          `Unexpected tenant name (${existingTenant.name}). It needs to be updated (Expected: ${tenantCreateRequest.name}).`,
        );
        return true;
      } else if (
        existingTenant.defaultNetworkKey !==
        tenantCreateRequest.defaultNetworkKey
      ) {
        this.logger.info(
          {},
          `Unexpected tenant defaultNetworkKey (${existingTenant.defaultNetworkKey}). It needs to be updated (Expected: ${tenantCreateRequest.defaultNetworkKey}).`,
        );
        return true;
      } else if (
        !_.isEqual(
          existingTenant?.products || {},
          tenantCreateRequest?.products || {},
        )
      ) {
        this.logger.info(
          {
            products: {
              existing: existingTenant?.products,
              expected: tenantCreateRequest?.products,
            },
          },
          'Unexpected tenant products. It needs to be updated.',
        );
        return true;
      } else if (
        JSON.stringify(existingTenant?.metadata || {}) !==
        JSON.stringify(tenantCreateRequest?.metadata || {})
      ) {
        this.logger.info(
          {
            products: {
              existing: existingTenant?.metadata,
              expected: tenantCreateRequest?.metadata,
            },
          },
          'Unexpected tenant metadata. It needs to be updated.',
        );
        return true;
      }

      return false;
    } catch (error) {
      ErrorService.throwApiCallError(
        'checkTenantNeedsToBeUpdated',
        API_NAME,
        error,
        500,
      );
    }
  }

  private formatFilterForAxiosParams(
    filter: Omit<EntityQueryRequest, 'skip' | 'limit'>,
    crossNamespaceMigration?: boolean, // In the case of a cross-namespace migration, we don't want to apply 'baseMetadata' filters. This allows to retrieve entities from both "dev" and "demo" namespaces
  ) {
    if (baseMetadata && !crossNamespaceMigration) {
      filter = {
        ...filter,
        metadata: {
          ...(filter?.metadata || {}),
          ...baseMetadata,
        },
      };
    }

    return {
      ...(filter || {}),
      ...(filter?.metadata
        ? { metadata: JSON.stringify(filter.metadata) }
        : {}),
      ...(filter?.metadataWithOptions
        ? { metadataWithOptions: JSON.stringify(filter.metadataWithOptions) }
        : {}),
      ...(filter?.ids ? { ids: JSON.stringify(filter.ids) } : {}),
    };
  }

  // ENTITIES
  /**
   * [Fetch multiple entities]
   */
  async fetchEntities(
    tenantId: string,
    filter: Omit<EntityQueryRequest, 'skip' | 'limit'>,
    includeWallets: boolean,
    crossNamespaceMigration?: boolean, // In the case of a cross-namespace migration, we don't want to apply 'baseMetadata' filters. This allows to retrieve entities from both "dev" and "demo" namespaces
  ): Promise<User[]> {
    try {
      const authToken = await this.craftToken();

      const BATCH_SIZE = 1000;
      let offset = 0; // number of users to skip
      let entityList = [];
      let nbEntitiesToFetch: number;

      const filterFormattedForAxiosParams = this.formatFilterForAxiosParams(
        filter,
        crossNamespaceMigration,
      );

      while (nbEntitiesToFetch === undefined || nbEntitiesToFetch > 0) {
        const retriedClosure = () => {
          return this.entity.get('/entity', {
            ...this.craftAuthHeaders(authToken, tenantId),
            params: {
              ...filterFormattedForAxiosParams,
              skip: offset,
              limit: BATCH_SIZE,
              includeWallets,
            },
          });
        };
        const { data } = await execRetry(retriedClosure, 3, 1500, 1);

        entityList = [...entityList, ...data.items];

        // Update 'nbUsersToFetch' and 'offset'
        if (nbEntitiesToFetch === undefined) {
          nbEntitiesToFetch = data.count;
        }
        nbEntitiesToFetch = nbEntitiesToFetch - data.items.length;
        offset += data.items.length;
      }

      const userList: User[] = entityList.map((entity: EntityResponse) => {
        return this.formatEntityIntoUser(entity);
      });
      return userList;
    } catch (error) {
      ErrorService.throwApiCallError('fetchEntities', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch multiple entities, while applying a filter]
   */
  async fetchFilteredEntities(
    tenantId: string,
    keyType: EntityEnum,
    keyValue: string,
    includeWallets: boolean,
  ): Promise<User[]> {
    try {
      let filter;

      if (keyType === EntityEnum.ids) {
        filter = {
          ids: JSON.parse(keyValue || '[]'), // Expects 'keyValue' to be a stringified array of ids
        };
      } else if (keyType === EntityEnum.email) {
        filter = {
          metadata: {
            [UserKeys.EMAIL]: keyValue,
          },
        };
      } else if (keyType === EntityEnum.firstConnectionCode) {
        filter = {
          metadata: {
            [UserKeys.FIRST_CONNECTION_CODE]: keyValue,
          },
        };
      } else if (keyType === EntityEnum.superUserId) {
        filter = {
          metadata: {
            [UserKeys.SUPER_USER_ID]: keyValue,
          },
        };
      } else if (keyType === EntityEnum.userType) {
        filter = {
          metadata: {
            [UserKeys.USER_TYPE]: keyValue,
          },
        };
      } else if (keyType === EntityEnum.userTypes) {
        const parsedKeyValue = JSON.parse(keyValue); // Expects keyValue to be a stringified array
        if (!Array.isArray(parsedKeyValue)) {
          ErrorService.throwError(
            `shall never happen: expected a stringified array, got the following instead: ${keyValue}`,
          );
        }

        filter = {
          metadataWithOptions: {
            [UserKeys.USER_TYPE]: parsedKeyValue,
          },
        };
      } else {
        throw new Error(`Unknown key type: ${keyType}`);
      }

      const userList: User[] = await this.fetchEntities(
        tenantId,
        filter,
        includeWallets,
      );

      return userList;
    } catch (error) {
      ErrorService.throwApiCallError(
        'fetchFilteredEntities',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Fetch multiple entities in batch]
   */
  async fetchEntitiesBatch(
    tenantId: string,
    entityIds: Array<string>,
    includeWallets: boolean,
  ): Promise<User[]> {
    try {
      if (!(entityIds && Array.isArray(entityIds))) {
        ErrorService.throwError(
          `invalid input (${entityIds}), an array of entity IDs is expected`,
        );
      }

      // Fails with "431 - Request Header Fields Too Large" if BATCH_SIZE > 170
      // Set BATCH_SIZE = 1000, once Entity-Api is ready to support it.
      const BATCH_SIZE = 150;

      let usersList = [];
      let nbRequests = 0;
      let nbUsersToFetch: number = entityIds.length;

      while (nbUsersToFetch === undefined || nbUsersToFetch > 0) {
        const subUserIds = entityIds.slice(
          nbRequests * BATCH_SIZE,
          (nbRequests + 1) * BATCH_SIZE,
        );
        nbRequests++;

        const subUsersList = await this.fetchFilteredEntities(
          tenantId,
          EntityEnum.ids,
          JSON.stringify(subUserIds),
          includeWallets,
        );

        // For information, "subUserIds.length" can potentially be different from "response.data?.length" in the case
        // "userIds" contains duplicated values of userIds.

        // Add fetched users to final response
        usersList = [...usersList, ...subUsersList];

        // Update 'nbUsersToFetch' and 'offset'
        nbUsersToFetch = nbUsersToFetch - subUserIds.length;
      }

      this.logger.debug(
        `Performed ${nbRequests} requests of max ${BATCH_SIZE} instances to retrieve a total of ${usersList.length} users`,
      );
      if (nbRequests > 100) {
        ErrorService.throwError(
          `Shall never happen: too many users to retrieve (more than ${
            BATCH_SIZE * 100
          })`,
        );
      }

      return usersList;
    } catch (error) {
      ErrorService.throwApiCallError(
        'fetchEntitiesBatch',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * [Fetch single entity by id]
   */
  async fetchEntity(
    tenantId: string,
    entityId: string,
    includeWallets: boolean,
    crossNamespaceMigration?: boolean, // In the case of a cross-namespace migration, we don't want to apply 'baseMetadata' filters. This allows to retrieve entities from both "dev" and "demo" namespaces
  ): Promise<User> {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.get(`/entity/${entityId}`, {
          ...this.craftAuthHeaders(authToken, tenantId),
          params: {
            includeWallets,
          },
        });
      };
      const response = await execRetry(retriedClosure, 1, 1500, 1);

      const fetchedEntity: EntityResponse = response.data;
      const fetchedUser: User = this.formatEntityIntoUser(fetchedEntity);

      if (
        baseMetadata &&
        !crossNamespaceMigration &&
        fetchedUser?.[UserKeys.DATA]?.[UserKeys.DATA__SUB_TENANT_ID] !==
          baseMetadata?.[UserKeys.DATA__SUB_TENANT_ID]
      ) {
        ErrorService.throwError(
          `Entity with id ${entityId} exists, but doesn't belong to the "${DEV_DOMAIN_NAME}" namespace. Entities from the "${DEV_DOMAIN_NAME}" namespace can be distinguished thanks to the "${UserKeys.DATA__SUB_TENANT_ID}=${DEV_DOMAIN_NAME}" flag in their metadata.`,
        );
      }

      return fetchedUser;
    } catch (error) {
      ErrorService.throwApiCallError('fetchEntity', API_NAME, error, 500);
    }
  }

  /**
   * [Create entity]
   */
  async createEntity(
    tenantId: string,
    entityCreateRequest: EntityCreateRequest,
  ): Promise<User> {
    try {
      const authToken = await this.craftToken();

      if (baseMetadata) {
        entityCreateRequest.metadata = {
          ...entityCreateRequest.metadata,
          ...baseMetadata,
        };
      }

      const retriedClosure = () => {
        return this.entity.post(
          '/entity',
          entityCreateRequest,
          this.craftAuthHeaders(authToken, tenantId),
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating entity',
        response,
      );

      const createdEntity: EntityResponse = response.data;
      // We need to re-fetch entity, because wallets are not included in entity creation response
      const fetchedUser: User = await this.fetchEntity(
        tenantId,
        createdEntity.id,
        true, // includeWallets
      );

      return fetchedUser;
    } catch (error) {
      ErrorService.throwApiCallError('createEntity', API_NAME, error, 500);
    }
  }

  /**
   * [Update entity]
   */
  private async updateEntity(
    tenantId: string,
    entityId: string,
    entityUpdateRequest: EntityUpdateRequest,
    crossNamespaceMigration?: boolean, // In the case of a cross-namespace migration, we don't want to apply 'baseMetadata' filters. This allows to update entities from both "dev" and "demo" namespaces
  ): Promise<EntityResponse> {
    try {
      const authToken = await this.craftToken();

      if (baseMetadata && !crossNamespaceMigration) {
        const subTenantId =
          entityUpdateRequest?.metadata?.[UserKeys.DATA__SUB_TENANT_ID];

        if (
          subTenantId &&
          subTenantId !== baseMetadata?.[UserKeys.DATA__SUB_TENANT_ID]
        ) {
          ErrorService.throwError(
            `Unauthorized value for 'user.data.${
              UserKeys.DATA__SUB_TENANT_ID
            }': ${subTenantId}. Only authorized value is ${
              baseMetadata?.[UserKeys.DATA__SUB_TENANT_ID]
            }`,
          );
        }
      }

      const retriedClosure = () => {
        return this.entity.put(
          `/entity/${entityId}`,
          entityUpdateRequest,
          this.craftAuthHeaders(authToken, tenantId),
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating entity',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('updateEntity', API_NAME, error, 500);
    }
  }

  /**
   * [Update entity (only specified properties)]
   */
  async patchEntity(
    tenantId: string,
    entityId: string,
    updates: any,
    crossNamespaceMigration?: boolean, // In the case of a cross-namespace migration, we don't want to apply 'baseMetadata' filters. This allows to update entities from both "dev" and "demo" namespaces
  ): Promise<User> {
    try {
      const currentUser: User = await this.fetchEntity(
        tenantId,
        entityId,
        true,
        crossNamespaceMigration,
      );

      // Extract 'primaries' from current user
      const currentUserPrimaries = {
        ...currentUser,
      };

      // Extract 'data' from existing user
      const currentUserData = currentUser[UserKeys.DATA];

      // Extract 'data' and 'primaries' from requested updates
      const { data: dataUpdates, ...primaryUpdates } = updates;

      // Override the current user data by that from the given update data
      const updatedUserData = {
        ...currentUserData,
        ...dataUpdates,
      };

      // Clean 'updatedUserData', by deleting keys with null value
      Object.keys(updatedUserData).forEach((key: string) => {
        if (updatedUserData[key] === null) {
          delete updatedUserData[key];
        }
      });

      // Clean 'currentUserPrimaries', by deleting 'primaries' we don't want to add in metadata
      this.userKeysNotToAddInMetadata.forEach((userProperty) => {
        delete currentUserPrimaries[userProperty];
      });
      // Clean 'primaryUpdates', by deleting 'primaries' we don't want to add in metadata
      this.userKeysNotToAddInMetadata.forEach((userProperty) => {
        delete primaryUpdates[userProperty];
      });

      const updatedEntity: EntityResponse = await this.updateEntity(
        tenantId,
        entityId,
        {
          defaultWallet:
            updates.defaultWallet || currentUser?.[UserKeys.DEFAULT_WALLET],
          name: `${updates.firstName || currentUser?.[UserKeys.FIRST_NAME]} ${
            updates.lastName || currentUser?.[UserKeys.LAST_NAME]
          }`, // During a trasition period: Entity name will be firstName+lastName
          metadata: {
            // 'data' comes first, as it shall not override 'primaries'
            ...updatedUserData,
            // 'primaries' come second, as they shall not be overridden by 'data'
            ...currentUserPrimaries,
            ...primaryUpdates, // 'dataUpdates' shall override 'currentUserData'
          },
        },
        crossNamespaceMigration,
      );

      // We need to re-fetch entity, because wallets are not included in entity creation response
      const fetchedUser: User = await this.fetchEntity(
        tenantId,
        updatedEntity.id,
        true, // includeWallets
      );

      return fetchedUser;
    } catch (error) {
      ErrorService.throwApiCallError('patchEntity', API_NAME, error, 500);
    }
  }

  /**
   * [Delete entity]
   */
  async deleteEntity(tenantId: string, entityId: string) {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.delete(
          `/entity/${entityId}`,
          this.craftAuthHeaders(authToken, tenantId),
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting entity',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteEntity', API_NAME, error, 500);
    }
  }

  craftUserMetadata(user: User) {
    return {
      [UserKeys.AUTH_ID]: user[UserKeys.AUTH_ID],
      [UserKeys.FIRST_CONNECTION_CODE]: user[UserKeys.FIRST_CONNECTION_CODE],
      [UserKeys.SUPER_USER_ID]: user[UserKeys.SUPER_USER_ID],
      [UserKeys.USER_TYPE]: user[UserKeys.USER_TYPE],
      [UserKeys.USER_NATURE]: user[UserKeys.USER_NATURE],
      [UserKeys.ACCESS_TYPE]: user[UserKeys.ACCESS_TYPE],
      [UserKeys.EMAIL]: user[UserKeys.EMAIL],
      [UserKeys.PHONE]: user[UserKeys.PHONE],
      [UserKeys.PREFIX]: user[UserKeys.PREFIX],
      [UserKeys.FIRST_NAME]: user[UserKeys.FIRST_NAME],
      [UserKeys.LAST_NAME]: user[UserKeys.LAST_NAME],
      [UserKeys.PICTURE]: user[UserKeys.PICTURE],
      [UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]:
        user[UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID],
      ...user[UserKeys.DATA],
    };
  }

  // WALLETS
  /**
   * [Fetch multiple wallets]
   */
  async fetchWallets(
    tenantId: string,
    entityId: string,
    filter: Omit<WalletQueryRequest, 'skip' | 'limit'>,
  ): Promise<WalletResponse[]> {
    try {
      const authToken = await this.craftToken();

      const BATCH_SIZE = 1000;
      let offset = 0; // number of users to skip
      let walletList = [];
      let nbWalletsToFetch: number;

      while (nbWalletsToFetch === undefined || nbWalletsToFetch > 0) {
        const retriedClosure = () => {
          return this.entity.get(`/entity/${entityId}/wallet`, {
            ...this.craftAuthHeaders(authToken, tenantId),
            params: {
              ...filter,
              skip: offset,
              limit: BATCH_SIZE,
            },
          });
        };
        const { data } = await execRetry(retriedClosure, 3, 1500, 1);

        walletList = [...walletList, ...data.items];

        // Update 'nbUsersToFetch' and 'offset'
        if (nbWalletsToFetch === undefined) {
          nbWalletsToFetch = data.count;
        }
        nbWalletsToFetch = nbWalletsToFetch - data.items.length;
        offset += data.items.length;
      }

      return walletList;
    } catch (error) {
      ErrorService.throwApiCallError('fetchWallets', API_NAME, error, 500);
    }
  }

  /**
   * [Fetch single wallet by address]
   */
  async fetchWallet(
    tenantId: string,
    entityId: string,
    address: string,
  ): Promise<Wallet> {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.get(
          `/entity/${entityId}/wallet/${address}`,
          this.craftAuthHeaders(authToken, tenantId),
        );
      };
      const response = await execRetry(retriedClosure, 1, 1500, 1);

      const fetchedWallet: WalletResponse = response.data;

      return this.formatEntityWalletIntoUserWallet(fetchedWallet);
    } catch (error) {
      ErrorService.throwApiCallError('fetchWallet', API_NAME, error, 500);
    }
  }

  /**
   * [Create wallet]
   */
  async createWallet(
    tenantId: string,
    entityId: string,
    walletCreateRequest: WalletCreateRequest,
    setAsDefault: boolean,
  ): Promise<Wallet> {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.post(
          `/entity/${entityId}/wallet`,
          walletCreateRequest,
          {
            ...this.craftAuthHeaders(authToken, tenantId),
            params: {
              setAsDefault,
            },
          },
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating wallet',
        response,
      );

      const createdWallet: WalletResponse = response.data;

      return this.formatEntityWalletIntoUserWallet(createdWallet);
    } catch (error) {
      ErrorService.throwApiCallError('createWallet', API_NAME, error, 500);
    }
  }

  /**
   * [Update wallet]
   */
  async updateWallet(
    tenantId: string,
    entityId: string,
    address: string,
    walletUpdateRequest: WalletUpdateRequest,
    setAsDefault: boolean,
  ): Promise<Wallet> {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.put(
          `/entity/${entityId}/wallet/${address}`,
          walletUpdateRequest,
          {
            ...this.craftAuthHeaders(authToken, tenantId),
            params: {
              setAsDefault,
            },
          },
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating wallet',
        response,
      );

      const updatedWallet: WalletResponse = response.data;

      return this.formatEntityWalletIntoUserWallet(updatedWallet);
    } catch (error) {
      ErrorService.throwApiCallError('updateWallet', API_NAME, error, 500);
    }
  }

  /**
   * [Delete wallet]
   */
  async deleteWallet(tenantId: string, entityId: string, address: string) {
    try {
      const authToken = await this.craftToken();

      const retriedClosure = () => {
        return this.entity.delete(
          `/entity/${entityId}/wallet/${address}`,
          this.craftAuthHeaders(authToken, tenantId),
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting wallet',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('deleteWallet', API_NAME, error, 500);
    }
  }

  /**
   * [Pre-create wallet for vehicle]
   * Entities of type VEHICLE do not own their wallets
   * Wallet is owned by a superUser/superEntity, who controls the VEHICLE.
   * Consequently, wallet needs to be pre-created for superUser/superEntity.
   */
  async preCreateWalletForVehicle(
    tenantId: string,
    superEntityId: string,
  ): Promise<{
    address: string;
    type: EntityApiWalletType;
  }> {
    try {
      if (!superEntityId) {
        ErrorService.throwError(
          "shall never happen: impossible to pre-create wallet for vehicle because 'superEntityId' is undefined",
        );
      }

      const walletType: EntityApiWalletType =
        EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT;

      const vehicleWallet: Wallet = await this.createWallet(
        tenantId,
        superEntityId,
        {
          type: walletType,
        },
        false, // setAsDefault
      );
      // Wallet is deleted in Entity-Api (but it will still exists in Orchestrate)
      await this.deleteWallet(
        tenantId,
        superEntityId,
        vehicleWallet[WalletKeys.WALLET_ADDRESS],
      );

      // Wallet still exists in Orchestrate, which is why we can assign it to vehicle
      return {
        address: vehicleWallet[WalletKeys.WALLET_ADDRESS],
        type: walletType,
      };
    } catch (error) {
      ErrorService.throwApiCallError(
        'preCreateWalletForVehicle',
        API_NAME,
        error,
        500,
      );
    }
  }

  private craftAuthHeaders(
    authToken: string,
    tenantId?: string,
  ): AxiosRequestConfig {
    return {
      headers: {
        Authorization: 'Bearer ' + authToken,
        ...(tenantId && {
          [OrchestrateUtils.orchestrateTenantIdHeader]: tenantId,
        }),
      },
    };
  }

  private craftToken() {
    return this.m2mTokenService.createM2mToken(
      M2M_TOKEN_CLIENT_ID,
      M2M_TOKEN_CLIENT_SECRET,
      M2M_TOKEN_AUDIENCE,
    );
  }

  private formatEntityIntoUser(entity: EntityResponse): User {
    const userMetadata = { ...entity.metadata };
    delete userMetadata[UserKeys.AUTH_ID];
    delete userMetadata[UserKeys.FIRST_CONNECTION_CODE];
    delete userMetadata[UserKeys.SUPER_USER_ID];
    delete userMetadata[UserKeys.USER_TYPE];
    delete userMetadata[UserKeys.USER_NATURE];
    delete userMetadata[UserKeys.EMAIL];
    delete userMetadata[UserKeys.FIRST_NAME];
    delete userMetadata[UserKeys.LAST_NAME];
    delete userMetadata[UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID];

    const user = {
      [UserKeys.USER_ID]: entity.id,
      [UserKeys.TENANT_ID]: entity.tenantId,
      [UserKeys.AUTH_ID]: entity.metadata[UserKeys.AUTH_ID],
      [UserKeys.FIRST_CONNECTION_CODE]:
        entity.metadata[UserKeys.FIRST_CONNECTION_CODE],
      [UserKeys.SUPER_USER_ID]: entity.metadata[UserKeys.SUPER_USER_ID],
      [UserKeys.USER_TYPE]: entity.metadata[UserKeys.USER_TYPE],
      [UserKeys.USER_NATURE]: entity.metadata[UserKeys.USER_NATURE],
      [UserKeys.EMAIL]: entity.metadata[UserKeys.EMAIL],
      [UserKeys.FIRST_NAME]: entity.metadata[UserKeys.FIRST_NAME],
      [UserKeys.LAST_NAME]: entity.metadata[UserKeys.LAST_NAME],
      [UserKeys.DEFAULT_WALLET]: entity.defaultWallet,
      [UserKeys.WALLETS]:
        entity.wallets?.map((wallet: WalletResponse) => {
          return this.formatEntityWalletIntoUserWallet(wallet);
        }) || [],
      [UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID]:
        entity.metadata[UserKeys.LEGAL_AGREEMENT_SIGNATURE_ACCOUNT_ID],
      [UserKeys.DATA]: userMetadata,
      [UserKeys.CREATED_AT]: entity.createdAt,
      [UserKeys.UPDATED_AT]: entity.updatedAt,
    };
    return user;
  }

  private formatEntityWalletIntoUserWallet(wallet: WalletResponse): Wallet {
    return {
      [WalletKeys.WALLET_ADDRESS]: wallet.address,
      [WalletKeys.WALLET_TYPE]:
        (wallet.metadata?.['legacyAssetsWalletType'] as WalletType) ||
        undefined,
      [WalletKeys.WALLET_NEW_TYPE]: wallet.type,
      [WalletKeys.WALLET_DATA]: wallet.metadata,
    };
  }
}
