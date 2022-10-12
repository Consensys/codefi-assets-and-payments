import { TokenHybridController } from './token.hybrid.controller';
import { TokenRetrievalService } from 'src/modules/v2Token/token.service/retrieveToken';
import { TokenCreationService } from 'src/modules/v2Token/token.service/createToken';
import { TokenUpdateService } from 'src/modules/v2Token/token.service/updateToken';
import { TokenDeletionService } from 'src/modules/v2Token/token.service/deleteToken';

import createMockInstance from 'jest-create-mock-instance';
import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { ApiMetadataCallService } from '../v2ApiCall/api.call.service/metadata';

// Mock Redis client
jest.mock('ioredis');
// Mock Redis cache client
jest.mock('ioredis-cache');

describe('TokenHybridController', () => {
  let controller: TokenHybridController;
  let tokenTxHelperServiceMock: TokenTxHelperService;
  let tokenCreationServiceMock: TokenCreationService;
  let tokenRetrievalServiceMock: TokenRetrievalService;
  let tokenUpdateServiceMock: TokenUpdateService;
  let tokenDeletionServiceMock: TokenDeletionService;
  let apiMetadataCallServiceMock: ApiMetadataCallService;

  beforeEach(() => {
    tokenTxHelperServiceMock = createMockInstance(TokenTxHelperService);
    tokenCreationServiceMock = createMockInstance(TokenCreationService);
    tokenRetrievalServiceMock = createMockInstance(TokenRetrievalService);
    tokenUpdateServiceMock = createMockInstance(TokenUpdateService);
    tokenDeletionServiceMock = createMockInstance(TokenDeletionService);
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);
    controller = new TokenHybridController(
      tokenTxHelperServiceMock,
      tokenCreationServiceMock,
      tokenRetrievalServiceMock,
      tokenUpdateServiceMock,
      tokenDeletionServiceMock,
      apiMetadataCallServiceMock,
    );
  });

  it('TokenHybrid', async () => {
    await expect(true).toBe(true);
  });
});
