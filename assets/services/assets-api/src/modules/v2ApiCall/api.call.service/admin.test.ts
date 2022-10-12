import createMockInstance from 'jest-create-mock-instance';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiAdminCallService, AppType } from './admin';
import { ApiCallHelperService } from '.';

import { of } from 'rxjs';

import { HttpService } from '@nestjs/axios';
import {
  clientApplicationDescriptionPrefix,
  ClientApplicationExample,
  keys as ClientKeys,
  tenantNameExample,
} from 'src/types/clientApplication';
import {
  Auth0UserExample,
  keys as UserKeys,
  UserExample,
} from 'src/types/user';
import {
  ASSETS_API_REQUIRED_SCOPES,
  GrantExample,
  keys as GrantKeys,
} from 'src/types/grant';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { M2mTokenService } from '@codefi-assets-and-payments/auth';
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types';
import config from 'src/config';
import { DEV_DOMAIN_NAME } from 'src/types/authentication';
import { ApiEntityCallService } from './entity';

const ADMIN_HOST = process.env.ADMIN_API;

const mockAccessToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik4wSXdNRE13TVRReVJrSkRSVFJDUXpNd00wSTRNemt3UVRsQlF6TTNRMFJET1RnME56ZEJPUSJ9.eyJodHRwczovL2FwaS5jb2RlZmkubmV0d29yayI6eyJ0ZW5hbnRJZCI6ImZRUGVZUzFCaFhRVWJFS3FCVUd2MEVYajdtbHVPZlBhIn0sImlzcyI6Imh0dHBzOi8vY29kZWZpLmV1LmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw1ZjU3OGEzYjcyNDRlYTAwNmQ3MjY1ZDciLCJhdWQiOlsiaHR0cHM6Ly9jb2RlZmkuZXUuYXV0aDAuY29tL2FwaS92Mi8iLCJodHRwczovL2NvZGVmaS5ldS5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjA3Njk3MDM1LCJleHAiOjE2MDc3ODM0MzUsImF6cCI6ImZRUGVZUzFCaFhRVWJFS3FCVUd2MEVYajdtbHVPZlBhIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCByZWFkOmN1cnJlbnRfdXNlciB1cGRhdGU6Y3VycmVudF91c2VyX21ldGFkYXRhIGRlbGV0ZTpjdXJyZW50X3VzZXJfbWV0YWRhdGEgY3JlYXRlOmN1cnJlbnRfdXNlcl9tZXRhZGF0YSBjcmVhdGU6Y3VycmVudF91c2VyX2RldmljZV9jcmVkZW50aWFscyBkZWxldGU6Y3VycmVudF91c2VyX2RldmljZV9jcmVkZW50aWFscyB1cGRhdGU6Y3VycmVudF91c2VyX2lkZW50aXRpZXMiLCJndHkiOiJwYXNzd29yZCJ9.bogpnSpWexuBx0WGGMMZL5ExNr0CzCIaL_bm7iDSZY6VtrmEKVyp6ppMtirvw2XwyKCC1DJHoJLcdPHlCftlK3EOKzD2EXdy5_Imu7Y8czpBrEWqNwGG_74N9YdGBO6cqLSWQ1CUWjLTfQsYMGFOM7R8eM8PA3YTUAbyH0eLI1c9qaC92YBlOFEbrIzVd1Ikw269LG_81Gd5bTk7Wkk0QqKklifrAwlIgwQcUQUOjPYh1FMbEFYc3i3GtD8FMmQi5dDd6vncfMPe9ScO_3jD33UYuDa2NmOEfnXH7bX_eOWhRXcJUaIwELP0KcWrVRqbPw2PPp9NHNZyf8rQle80fA';
const mockClientId = ClientApplicationExample[ClientKeys.CLIENT_ID];
const mockAppType = ClientApplicationExample[ClientKeys.APP_TYPE];
const mockGrantTypes = ClientApplicationExample[ClientKeys.GRANT_TYPES];
const mockClientApplicationListingResponse1 = {
  count: 1,
  items: [ClientApplicationExample],
};
const mockClientApplicationListingResponse2 = {
  count: 0,
  items: [],
};
const mockClientApplicationRetrievalResponse = ClientApplicationExample;
const mockClientApplicationCreationResponse = ClientApplicationExample;
const mockClientApplicationDeletionResponse = '';
const mockAssetsAPIAudience = GrantExample[GrantKeys.AUDIENCE];
const mockGrantCreationResponse = GrantExample;
const mockTenantId = mockClientId;
const mockUserId = '3611ab62-94a9-4782-890f-221a64518c83'; // TODO: will be renamed mockEntityId after integration with Entity-Api
const mockEmail = UserExample[UserKeys.EMAIL];
const mockPassword = process.env.DEFAULT_PASSWORD;
const mockFirstName = UserExample[UserKeys.FIRST_NAME];
const mockLastName = UserExample[UserKeys.LAST_NAME];
const mockUserCreationResponse = Auth0UserExample;

const mockConfig = {
  headers: {
    Authorization: 'Bearer '.concat(mockAccessToken),
  },
};

const M2M_TOKEN_ADMIN_CLIENT_ID = config().m2mToken.adminClient.id;
const M2M_TOKEN_ADMIN_CLIENT_SECRET = config().m2mToken.adminClient.secret;
const M2M_TOKEN_ADMIN_AUDIENCE = config().m2mToken.adminAudience;

const urls = {
  listAllClientApplicationInIdentityProvider1: `${ADMIN_HOST}/client?skip=0&limit=100`,
  listAllClientApplicationInIdentityProvider2: `${ADMIN_HOST}/client?skip=1&limit=100`,
  retrieveClientApplicationInAuth0: `${ADMIN_HOST}/client/${mockTenantId}`,
  updateClientApplicationInAuth0: `${ADMIN_HOST}/client/${mockTenantId}`,
  createClientApplicationInAuth0: `${ADMIN_HOST}/client`,
  deleteClientApplicationInAuth0: `${ADMIN_HOST}/client/${mockTenantId}`,
  createGrantForClientApplication: `${ADMIN_HOST}/client-grant`,
  createUserInAuth0: `${ADMIN_HOST}/user`,
};

const localhostUrl = 'http://localhost:3000';

const getHttpResponse = (url) => {
  // const params = paramObject.params;

  if (url === urls.listAllClientApplicationInIdentityProvider1) {
    return mockClientApplicationListingResponse1;
  } else if (url === urls.listAllClientApplicationInIdentityProvider2) {
    return mockClientApplicationListingResponse2;
  } else if (url === urls.retrieveClientApplicationInAuth0) {
    return mockClientApplicationRetrievalResponse;
  }
  throw new Error(`getHttpResponse not supported ${url}`);
};

const postHttpResponse = (url) => {
  // const params = paramObject.params;

  if (url === urls.createClientApplicationInAuth0) {
    return mockClientApplicationCreationResponse;
  } else if (url === urls.createGrantForClientApplication) {
    return mockGrantCreationResponse;
  } else if (url === urls.createUserInAuth0) {
    return mockUserCreationResponse;
  }
  throw new Error(`postHttpResponse not supported ${url}`);
};
const putHttpResponse = (url) => {
  if (url === urls.updateClientApplicationInAuth0) {
    return mockClientApplicationCreationResponse;
  }
  throw new Error(`putHttpResponse not supported ${url}`);
};

const deleteHttpResponse = (url) => {
  // const params = paramObject.params;

  if (url === urls.deleteClientApplicationInAuth0) {
    return mockClientApplicationDeletionResponse;
  } else {
    throw new Error('crash');
  }
};

describe('ApiAdminCallService', () => {
  let service: ApiAdminCallService;
  let loggerMock: jest.Mocked<NestJSPinoLogger>;
  let httpServiceMock: jest.Mocked<HttpService>;
  let apiCallHelperServiceMock: ApiCallHelperService;
  let apiEntityCallServiceMock: ApiEntityCallService;
  let configServiceMock: ConfigService;
  let m2mTokenServiceMock: M2mTokenService;

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger);
    httpServiceMock = createMockInstance(HttpService);
    Object.defineProperty(httpServiceMock, 'axiosRef', {
      value: {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      },
    });

    apiCallHelperServiceMock = new ApiCallHelperService();
    m2mTokenServiceMock = createMockInstance(M2mTokenService);
    configServiceMock = createMockInstance(ConfigService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);

    service = new ApiAdminCallService(
      loggerMock,
      httpServiceMock,
      apiCallHelperServiceMock,
      apiEntityCallServiceMock,
      configServiceMock,
      m2mTokenServiceMock,
    );

    m2mTokenServiceMock.createM2mToken = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockAccessToken));

    httpServiceMock.get.mockImplementation((url) =>
      of({
        data: getHttpResponse(url),
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      }),
    );

    httpServiceMock.post.mockImplementation((url) =>
      of({
        data: postHttpResponse(url),
        status: 201,
        statusText: 'OK',
        headers: {},
        config: {},
      }),
    );

    httpServiceMock.put.mockImplementation((url) =>
      of({
        data: putHttpResponse(url),
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      }),
    );

    httpServiceMock.delete.mockImplementation((url) =>
      of({
        data: deleteHttpResponse(url),
        status: 201,
        statusText: 'OK',
        headers: {},
        config: {},
      }),
    );
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('listAllClientApplicationInAuth0', () => {
    it('returns list of Codefi Assets client applications', async () => {
      await expect(service.listAllClientApplicationInAuth0()).resolves.toEqual(
        mockClientApplicationListingResponse1.items,
      );
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      expect(httpServiceMock.get).toHaveBeenCalledTimes(2);
      expect(httpServiceMock.get).toHaveBeenCalledWith(
        urls.listAllClientApplicationInIdentityProvider1,
        mockConfig,
      );
      expect(httpServiceMock.get).toHaveBeenCalledWith(
        urls.listAllClientApplicationInIdentityProvider2,
        mockConfig,
      );
    });
  });

  describe('retrieveClientApplicationInAuth0', () => {
    it('returns client applications', async () => {
      await expect(
        service.retrieveClientApplicationInAuth0(mockTenantId),
      ).resolves.toEqual(mockClientApplicationRetrievalResponse);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      expect(httpServiceMock.get).toHaveBeenCalledTimes(1);
      expect(httpServiceMock.get).toHaveBeenCalledWith(
        urls.retrieveClientApplicationInAuth0,
        mockConfig,
      );
    });
  });

  describe('createClientApplicationInAuth0', () => {
    // to avoid race conditions between expected and actual date values
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('December 19, 1990 08:24:00').getTime());
    });

    // Back to reality...
    afterAll(() => {
      jest.useRealTimers();
    });

    const defaultAlias = '<client>.assets.codefi.network';
    const mockAliases = [defaultAlias];
    const mockClientApplicationCreationBody = {
      name: tenantNameExample,
      description: `${clientApplicationDescriptionPrefix} ${tenantNameExample}`,
      appType: mockAppType,
      isEmailOnly: false,
      clientMetadata: {
        aliases: JSON.stringify(mockAliases),
        subTenantId: DEV_DOMAIN_NAME,
      },
      allowedLogoutUrls: [
        ...mockAliases.map((alias) => `https://${alias}`),
        localhostUrl,
      ],
      callbacks: [
        ...mockAliases.map((alias) => `https://${alias}`),
        localhostUrl,
      ],
      webOrigins: [
        ...mockAliases.map((alias) => `https://${alias}`),
        localhostUrl,
      ],
      grantTypes: mockGrantTypes,
      product: ProductsEnum.assets,
      tenantId: undefined,
      entityId: undefined,
    };

    it('returns created client application', async () => {
      const tenant = await service.createClientApplicationInAuth0(
        tenantNameExample,
        defaultAlias,
        mockAliases,
        AppType.NotInteractive,
      );
      expect(tenant).toEqual(mockClientApplicationCreationResponse);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      expect(httpServiceMock.post).toHaveBeenCalledTimes(1);
      expect(httpServiceMock.post).toHaveBeenCalledWith(
        urls.createClientApplicationInAuth0,
        mockClientApplicationCreationBody,
        mockConfig,
      );
    });
    it('returns created client application with only unique aliases', async () => {
      await expect(
        service.createClientApplicationInAuth0(
          tenantNameExample,
          defaultAlias,
          [...mockAliases, ...mockAliases],
          AppType.NotInteractive,
        ),
      ).resolves.toEqual(mockClientApplicationCreationResponse);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      expect(httpServiceMock.post).toHaveBeenCalledTimes(1);
      expect(httpServiceMock.post).toHaveBeenCalledWith(
        urls.createClientApplicationInAuth0,
        mockClientApplicationCreationBody,
        mockConfig,
      );
    });
  });

  describe('updateClientApplicationInAuth0', () => {
    const defaultAlias = '<client>.assets.codefi.network';
    const mockAliases = [defaultAlias];
    const mockClientApplicationCreationBody = {
      name: tenantNameExample,
      description: `${clientApplicationDescriptionPrefix} ${tenantNameExample}`,
      appType: mockAppType,
      isEmailOnly: false,
      clientMetadata: {
        aliases: JSON.stringify(mockAliases),
        subTenantId: DEV_DOMAIN_NAME,
      },
      allowedLogoutUrls: [
        ...mockAliases.map((alias) => `https://${alias}`),
        localhostUrl,
      ],
      callbacks: [
        ...mockAliases.map((alias) => `https://${alias}`),
        localhostUrl,
      ],
      webOrigins: [
        ...mockAliases.map((alias) => `https://${alias}`),
        localhostUrl,
      ],
      grantTypes: mockGrantTypes,
      product: ProductsEnum.assets,
      tenantId: mockTenantId,
      entityId: undefined,
    };

    it('returns updated client application', async () => {
      await expect(
        service.updateClientApplicationInAuth0(
          mockTenantId,
          tenantNameExample,
          defaultAlias,
          [...mockAliases, defaultAlias, ...mockAliases],
          AppType.NotInteractive,
          mockGrantTypes,
          mockTenantId,
        ),
      ).resolves.toEqual(mockClientApplicationRetrievalResponse);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      expect(httpServiceMock.put).toHaveBeenCalledTimes(1);
      expect(httpServiceMock.put).toHaveBeenCalledWith(
        urls.updateClientApplicationInAuth0,
        mockClientApplicationCreationBody,
        mockConfig,
      );
    });
  });

  describe('deleteClientApplicationInAuth0', () => {
    it('returns empty string', async () => {
      await expect(
        service.deleteClientApplicationInAuth0(mockTenantId),
      ).resolves.toEqual(mockClientApplicationDeletionResponse);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      expect(httpServiceMock.delete).toHaveBeenCalledTimes(1);
      expect(httpServiceMock.delete).toHaveBeenCalledWith(
        urls.deleteClientApplicationInAuth0,
        mockConfig,
      );
    });
  });

  describe('createGrantForClientApplication', () => {
    const mockGrantCreationBody = {
      client_id: mockClientId,
      audience: mockAssetsAPIAudience,
      scope: ['create:users'],
    };

    it('returns created grant', async () => {
      await expect(
        service.createGrantForClientApplication(
          mockClientId,
          config().acceptedAudience,
          ASSETS_API_REQUIRED_SCOPES,
        ),
      ).resolves.toEqual(mockGrantCreationResponse);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      expect(httpServiceMock.post).toHaveBeenCalledTimes(1);
      expect(httpServiceMock.post).toHaveBeenCalledWith(
        urls.createGrantForClientApplication,
        mockGrantCreationBody,
        mockConfig,
      );
    });
  });

  describe('createUserInAuth0', () => {
    const mockUserCreationBody = {
      email: mockEmail,
      password: mockPassword,
      name: mockFirstName,
      familyName: mockLastName,
      givenName: `${mockFirstName} ${mockLastName}`,
      tenantId: mockClientId, // client application ID is used as tenant ID
      entityId: mockUserId, // TODO: will be renamed mockEntityId after integration with Entity-Api
      product: ProductsEnum.assets,
      tenantRoles: [],
    };

    it('returns created user (with subTenantId)', async () => {
      await expect(
        service.createUserInAuth0(
          mockTenantId,
          mockUserId, // TODO: will be renamed mockEntityId after integration with Entity-Api
          mockEmail,
          mockPassword,
          mockFirstName,
          mockLastName,
          [], // tenantRoles
          false,
        ),
      ).resolves.toEqual(mockUserCreationResponse);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledTimes(1);
      expect(m2mTokenServiceMock.createM2mToken).toHaveBeenCalledWith(
        M2M_TOKEN_ADMIN_CLIENT_ID,
        M2M_TOKEN_ADMIN_CLIENT_SECRET,
        M2M_TOKEN_ADMIN_AUDIENCE,
      );

      expect(httpServiceMock.post).toHaveBeenCalledTimes(1);
      expect(httpServiceMock.post).toHaveBeenCalledWith(
        urls.createUserInAuth0,
        {
          ...mockUserCreationBody,
          tenantId: `${mockClientId}:dev`,
          tenantRoles: [],
        },
        mockConfig,
      );
    });
  });
});
