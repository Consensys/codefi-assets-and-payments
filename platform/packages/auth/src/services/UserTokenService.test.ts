import 'reflect-metadata';
import createMockInstance from 'jest-create-mock-instance';
import {
  audienceMock,
  clientIdMock,
  clientSecretMock,
  passwordMock,
  usernameMock,
} from '../../test/mock';
import cfg from '../config';
import { createMockLogger } from '../test/mock';
import { UserTokenService } from './UserTokenService';
import { HttpService } from '@nestjs/axios';

jest.mock('@codefi-assets-and-payments/observability', () => ({
  createLogger: () => createMockLogger(),
}));

jest.mock('axios-retry');

describe('UserTokenService', () => {
  let service: UserTokenService;
  let httpServiceMock: jest.Mocked<HttpService>;

  beforeEach(() => {
    httpServiceMock = createMockInstance(HttpService);
    service = new UserTokenService(httpServiceMock);
  });

  describe('createUserToken', () => {
    it('throws if no auth0 url env', async () => {
      cfg().auth0Url = undefined;

      await expect(
        service.createUserToken(
          clientIdMock,
          clientSecretMock,
          audienceMock,
          usernameMock,
          passwordMock
        )
      ).rejects.toThrowError(
        `Cannot request user token from Auth0 as no AUTH0_URL was provided`
      );
    });
  });
});
