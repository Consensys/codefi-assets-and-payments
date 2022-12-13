import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ProductsEnum } from '@consensys/ts-types';
import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';

import { ApiCallHelperService } from '.';

import execRetry from 'src/utils/retry';
import {
  keys as ClientApplicationKeys,
  ClientApplication,
  clientApplicationDescriptionPrefix,
} from 'src/types/clientApplication';
import {
  Auth0User,
  craftAuth0TenantId,
  DEV_DOMAIN_NAME,
} from 'src/types/authentication';
import { EntityEnum, User, UserType } from 'src/types/user';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { Config, keys as ConfigKeys } from 'src/types/config';
import {
  filterClientApplicationForCustomSubDomainName,
  filterClientApplicationForDomainNameIfRelevant,
  filterClientApplicationForProduct,
  IS_DEV_DOMAIN_NAME,
} from 'src/utils/domain';
import { M2mTokenService } from '@consensys/auth';
import config from 'src/config';
import { Grant } from 'src/types/grant';
import { ApiEntityCallService } from './entity';

const M2M_TOKEN_ADMIN_CLIENT_ID = config().m2mToken.adminClient.id;
const M2M_TOKEN_ADMIN_CLIENT_SECRET = config().m2mToken.adminClient.secret;
const M2M_TOKEN_ADMIN_AUDIENCE = config().m2mToken.adminAudience;

if (!process.env.ADMIN_API) {
  throw new Error('missing env variable: ADMIN_API');
}

const ADMIN_HOST: string = process.env.ADMIN_API;
const API_NAME = 'Admin-Api';

export enum AppType {
  SPA = 'SPA',
  NotInteractive = 'NON_INTERACTIVE',
}

const defaultTenantId: string = config().defaultInitializationTenantId;

@Injectable()
export class ApiAdminCallService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly httpService: HttpService,
    private readonly apiCallHelperService: ApiCallHelperService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly configService: ConfigService,
    private m2mTokenService: M2mTokenService,
  ) {}

  /**
   * List all Codefi Assets client applications in auth0 (identity provider)
   */
  async listAllClientApplicationInAuth0(): // namePrefix?: string,
  Promise<Array<ClientApplication>> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      let allApplicationsFetched;
      let skip = 0; // skip is the page number
      const limit = 100;
      let applicationsList: Array<ClientApplication> = [];
      while (!allApplicationsFetched) {
        const retriedClosure = () => {
          return this.httpService
            .get(`${ADMIN_HOST}/client?skip=${skip}&limit=${limit}`, config)
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 3, 1500, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'listing all client applications in auth0 (identity provider)',
          response,
        );

        if (!(response.data && response.data.items)) {
          ErrorService.throwError(
            "invalid response format: missing 'items' field",
          );
        }

        applicationsList = [...applicationsList, ...response.data.items];

        if (response.data.items?.length > 0) {
          skip += 1; // skip is the page number
        } else {
          allApplicationsFetched = true;
        }
      }

      const finalOutput: Array<ClientApplication> =
        filterClientApplicationForDomainNameIfRelevant(
          filterClientApplicationForProduct(
            filterClientApplicationForCustomSubDomainName(applicationsList),
          ),
        );

      return finalOutput;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllClientApplicationInAuth0',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Retrieve client applications in auth0 (identity provider)
   */
  async retrieveClientApplicationInAuth0(
    clientApplicationId: string,
  ): Promise<ClientApplication> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${ADMIN_HOST}/client/${clientApplicationId}`, config)
          .toPromise()
          .catch((e) => {
            switch (e.response.status) {
              case 404:
                return Promise.resolve({ data: null });
              default:
                return Promise.reject(e);
            }
          });
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieve client applications in auth0 (identity provider)',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveClientApplicationInAuth0',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Retrieve defailt client applications in auth0 (identity provider) for a given tenantId
   */
  async retrieveDefaultClientApplicationForTenantId(
    tenantId: string,
  ): Promise<ClientApplication> {
    try {
      const clientApplications: Array<ClientApplication> =
        await this.listAllClientApplicationInAuth0();
      const filteredClientApplications: Array<ClientApplication> =
        clientApplications.filter(({ clientMetadata }) => {
          return (
            clientMetadata?.[ClientApplicationKeys.METADATA__TENANT_ID] ===
            tenantId
          );
        });

      if (
        !(filteredClientApplications && filteredClientApplications.length > 0)
      ) {
        ErrorService.throwError(
          `shall never happen: cannot find client application for tenantId ${tenantId}`,
        );
      }

      return filteredClientApplications[0];
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveDefaultClientApplicationForTenantId',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Retrieve first user (either admin or issuer) of client applications in auth0 (identity provider)
   */
  async retrieveFirstUserOfClient(tenantId: string): Promise<User> {
    try {
      const config: Config = await this.configService.retrieveTenantConfig(
        tenantId,
      );

      // Retrieve first user and codefi users for this tenant
      let firstUser = null as unknown as User;
      const firstUserId =
        config[ConfigKeys.DATA][ConfigKeys.DATA__FIRST_USER_ID];

      if (firstUserId) {
        try {
          firstUser = await this.apiEntityCallService.fetchEntity(
            tenantId,
            firstUserId,
            true,
          );
        } catch (error) {
          // We need a try/catch here otherwise, some functions will fail once the first user has been deleted
          this.logger.info(
            { error },
            `First user with id ${firstUserId} of tenant ${tenantId} could not be retrived (error: ${error?.message})`,
          );
        }
      }

      // If first user id is not stored in client application metadata,
      // we search for the oldest admin or issuer that belongs to the client
      if (!firstUser) {
        const admins = await this.apiEntityCallService.fetchFilteredEntities(
          tenantId,
          EntityEnum.userType,
          UserType.ADMIN,
          true, // includeWallets
        );
        const issuers = await this.apiEntityCallService.fetchFilteredEntities(
          tenantId,
          EntityEnum.userType,
          UserType.ISSUER,
          true, // includeWallets
        );
        const adminsAndIssuers = admins.concat(issuers);
        if (adminsAndIssuers.length !== 0) {
          firstUser = adminsAndIssuers.reduce((a, b) =>
            b.createdAt < a.createdAt ? b : a,
          );
        }
      }

      return firstUser;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveFirstUserOfClient',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Craft client application
   */
  craftClientApplication(
    clientApplicationName: string,
    defaultAlias: string,
    aliases: string[],
    appType: AppType,
    grantTypes: string[],
    existingClientApplication?: ClientApplication,
    tenantId?: string, // So far, for SPA client applications, we leave tenantId undefined at client application creation. Then, once created, we update client application in order to set "client.id" as "tenantId".
    entityId?: string, // So far, we only use this parameter to specify '*' as entityId for M2M client applications.
  ) {
    try {
      let uniqueAliases = defaultAlias ? [defaultAlias] : [];
      if (aliases && aliases.length > 0) {
        uniqueAliases = [...new Set([...uniqueAliases, ...aliases])];
      }
      // defaultTenantId
      const validUrls: Array<string> = [];
      uniqueAliases.map((alias) => {
        validUrls.push(`https://${alias}`);
        if (tenantId === defaultTenantId) {
          validUrls.push(`https://*.${alias}`); // This is useful in order to inject the tenantAlias at the beginning of the url (instead of the '*')
        }
      });
      if (IS_DEV_DOMAIN_NAME) {
        validUrls.push('http://localhost:3000'); // This is useful for local development
      }

      let callbacks = validUrls;
      if (
        existingClientApplication?.[ClientApplicationKeys.CALLBACKS]?.length > 0
      ) {
        const existingCallbacks =
          existingClientApplication[ClientApplicationKeys.CALLBACKS];
        callbacks = [...new Set([...validUrls, ...existingCallbacks])];
      }

      let allowedLogoutUrls = validUrls;
      if (
        existingClientApplication?.[ClientApplicationKeys.ALLOWED_LOGOUT_URLS]
          ?.length > 0
      ) {
        const existinAllowedLogoutUrls =
          existingClientApplication[ClientApplicationKeys.ALLOWED_LOGOUT_URLS];
        allowedLogoutUrls = [
          ...new Set([...validUrls, ...existinAllowedLogoutUrls]),
        ];
      }

      let webOrigins = validUrls;
      if (
        existingClientApplication?.[ClientApplicationKeys.WEB_ORIGINS]?.length >
        0
      ) {
        const existingWebOrigins =
          existingClientApplication[ClientApplicationKeys.WEB_ORIGINS];
        webOrigins = [...new Set([...validUrls, ...existingWebOrigins])];
      }

      return {
        [ClientApplicationKeys.NAME]: clientApplicationName,
        [ClientApplicationKeys.DESCRIPTION]: `${clientApplicationDescriptionPrefix} ${clientApplicationName}`,
        [ClientApplicationKeys.APP_TYPE]: appType.toLowerCase(),
        [ClientApplicationKeys.IS_EMAIL_ONLY]: false,
        [ClientApplicationKeys.METADATA]: {
          [ClientApplicationKeys.METADATA__ALIASES]:
            uniqueAliases && uniqueAliases.length > 0
              ? JSON.stringify(uniqueAliases)
              : undefined,
          [ClientApplicationKeys.METADATA__SUB_TENANT_ID]: IS_DEV_DOMAIN_NAME
            ? DEV_DOMAIN_NAME
            : undefined, // This flag allows to add a 'subTenantId' flag for client applications of the dev environment
          [ClientApplicationKeys.METADATA__CUSTOM_DOMAIN_NAME]:
            config().customSubDomainName || undefined, // This flag allows to add a 'customSubDomainName' flag for client applications of the dev environment (is is undefined for Codefi Assets client applications - but can have a value for client applications created by PS for the KSA region for example)
        },

        [ClientApplicationKeys.CALLBACKS]: callbacks,
        [ClientApplicationKeys.ALLOWED_LOGOUT_URLS]: allowedLogoutUrls,
        [ClientApplicationKeys.WEB_ORIGINS]: webOrigins,

        [ClientApplicationKeys.GRANT_TYPES]: grantTypes,
        product: ProductsEnum.assets, // This will add "assets: true" flag in client application's metadata
        tenantId: tenantId || undefined, // This will add "tenantId" in client application's metadata
        entityId: entityId || undefined, // This will add "entityId" in client application's metadata
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting client application',
        'craftClientApplication',
        false,
        500,
      );
    }
  }

  /**
   * Create a new client application in auth0 (identity provider)
   */
  async createClientApplicationInAuth0(
    tenantName: string,
    defaultAlias: string,
    aliases: string[],
    appType: AppType,
    tenantId?: string, // So far, for SPA client applications, we leave tenantId undefined at client application creation. Then, once created, we update client application in order to set "client.id" as "tenantId".
    entityId?: string, // So far, we only use this parameter to specify '*' as entityId for M2M client applications.
  ): Promise<ClientApplication> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const grantTypes = [
        'password',
        'authorization_code',
        'implicit',
        'refresh_token',
        'client_credentials',
      ];

      const body = this.craftClientApplication(
        tenantName,
        defaultAlias,
        aliases,
        appType,
        grantTypes,
        undefined, // existingClientApplication
        tenantId,
        entityId,
      );

      const retriedClosure = () => {
        return this.httpService
          .post(`${ADMIN_HOST}/client`, body, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating client application in auth0 (identity provider)',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'createClientApplicationInAuth0',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Create a new client application in auth0 (identity provider)
   */
  async updateClientApplicationInAuth0(
    clientId: string,
    tenantName: string,
    defaultAlias: string,
    aliases: string[],
    appType: AppType,
    grantTypes: string[],
    tenantId: string, // We update client application in order to set "client.id" as "tenantId".
    existingClientApplication?: ClientApplication,
  ): Promise<ClientApplication> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const body = this.craftClientApplication(
        tenantName,
        defaultAlias,
        aliases,
        appType,
        grantTypes,
        existingClientApplication,
        tenantId,
        undefined, // entityId
      );

      const retriedClosure = () => {
        return this.httpService
          .put(`${ADMIN_HOST}/client/${clientId}`, body, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'update client application in auth0 (identity provider)',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'updateClientApplicationInAuth0',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Delete client application in auth0 (identity provider)
   */
  async deleteClientApplicationInAuth0(clientId: string) {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.httpService
          .delete(`${ADMIN_HOST}/client/${clientId}`, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting client application in auth0 (identity provider)',
        response,
        true, // allowZeroLengthData
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'deleteClientApplicationInAuth0',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Create a new grant in auth0 (identity provider)
   */
  async createGrantForClientApplication(
    clientApplicationId: string,
    audience: string,
    scope: Array<string>,
  ): Promise<Grant> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const body = {
        client_id: clientApplicationId,
        audience,
        scope,
      };

      const retriedClosure = () => {
        return this.httpService
          .post(`${ADMIN_HOST}/client-grant`, body, config)
          .toPromise();
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating grant for client application in auth0 (identity provider)',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'createGrantForClientApplication',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Retrieve a grant in auth0 (identity provider)
   */
  async retrieveGrantForClientApplication(
    clientApplicationId: string,
    audience: string,
  ): Promise<Array<Grant>> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
        params: {
          clientId: clientApplicationId,
          audience,
        },
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${ADMIN_HOST}/client-grant`, config)
          .toPromise();
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving grant for client application in auth0 (identity provider)',
        response,
        true,
      );

      if (!(response.data && response.data.grants)) {
        ErrorService.throwError(
          "invalid response format: missing 'grants' field",
        );
      }

      return response.data.grants;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveGrantForClientApplication',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Delete a grant in auth0 (identity provider)
   */
  async deleteGrantForClientApplication(grantId: string): Promise<any> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.httpService
          .delete(`${ADMIN_HOST}/client-grant/${grantId}`, config)
          .toPromise();
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting grant for client application in auth0 (identity provider)',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'deleteGrantForClientApplication',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Create a new user in auth0 (identity provider)
   */
  async createUserInAuth0(
    tenantId: string,
    entityId: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantRoles: Array<string> = [],
    e2eTestUser: boolean,
  ): Promise<Auth0User> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const body = {
        email: email,
        password,
        name: firstName,
        // applicationClientId: clientId,
        familyName: lastName,
        givenName: `${firstName} ${lastName}`,
        appMetadata: e2eTestUser
          ? {
              e2eTestUser: true,
            }
          : undefined,
        tenantId: craftAuth0TenantId(tenantId),
        entityId,
        product: ProductsEnum.assets,
        tenantRoles,
      };

      const retriedClosure = () => {
        return this.httpService
          .post(`${ADMIN_HOST}/user`, body, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating user in auth0 (identity provider)',
        response,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError('createUserInAuth0', API_NAME, error, 500);
    }
  }

  /**
   * Listing users in auth0 (identity provider) by tenantId and entityId
   */
  async listAllAuth0UsersInByTenantIdAndEntityId(
    tenantId: string,
    entityId: string,
  ): Promise<Auth0User[]> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      let allUsersFetched;
      let skip = 0; // skip is the page number
      const limit = 100;
      let usersList: Array<Auth0User> = [];
      while (!allUsersFetched) {
        const retriedClosure = () => {
          return this.httpService
            .get(
              `${ADMIN_HOST}/user/tenant/${craftAuth0TenantId(
                tenantId,
              )}/entity/${entityId}?skip=${skip}&limit=${limit}`,
              config,
            )
            .toPromise();
        };
        const response = await execRetry(retriedClosure, 3, 1500, 1);

        this.apiCallHelperService.checkRequestResponseFormat(
          'listing users in auth0 (identity provider) by tenantId and entityId',
          response,
        );

        if (!(response.data && response.data.items)) {
          ErrorService.throwError(
            "invalid response format: missing 'items' field",
          );
        }

        usersList = [...usersList, ...response.data.items];

        if (response.data.items?.length > 0) {
          skip += 1; // skip is the page number
        } else {
          allUsersFetched = true;
        }
      }

      return usersList;
    } catch (error) {
      ErrorService.throwApiCallError(
        'listAllAuth0UsersInByTenantIdAndEntityId',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Retrieve users in auth0 (identity provider) by id
   */
  async retrieveUsersInAuth0ById(
    tenantId: string,
    authId: string,
  ): Promise<Auth0User> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${ADMIN_HOST}/user/${authId}`, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving users in auth0 (identity provider) by id',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveUsersInAuth0ById',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Retrieve users in auth0 (identity provider) by email
   */
  async retrieveUsersInAuth0ByEmail(
    tenantId: string,
    email: string,
  ): Promise<Auth0User[]> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.httpService
          .get(`${ADMIN_HOST}/user/email/${email}`, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving users in auth0 (identity provider) by email',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveUsersInAuth0ByEmail',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Update user in auth0 (identity provider) by id
   */
  async updateUserInAuth0ById(
    tenantId: string,
    authId: string,
    entityId?: string,
    tenantRoles?: Array<string>,
  ): Promise<Auth0User> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const body = {
        tenantId: craftAuth0TenantId(tenantId),
        entityId,
        product: ProductsEnum.assets,
        tenantRoles,
      };

      const retriedClosure = () => {
        return this.httpService
          .put(`${ADMIN_HOST}/user/${authId}`, body, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'updating user in auth0 (identity provider) by id',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'updateUserInAuth0ById',
        API_NAME,
        error,
        500,
      );
    }
  }

  /**
   * Delete user in auth0 (identity provider) by id
   */
  async deleteUserInAuth0ById(
    tenantId: string,
    authId: string,
  ): Promise<Auth0User> {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.httpService
          .delete(`${ADMIN_HOST}/user/${authId}`, config)
          .toPromise();
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting user in auth0 (identity provider) by id',
        response,
        true,
      );

      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'deleteUserInAuth0ById',
        API_NAME,
        error,
        500,
      );
    }
  }
}
