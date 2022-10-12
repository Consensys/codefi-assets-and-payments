import { TokenNonfungibleController } from './token.nonfungible.controller';
import { TokenRetrievalService } from 'src/modules/v2Token/token.service/retrieveToken';
import { TokenCreationService } from 'src/modules/v2Token/token.service/createToken';
import { TokenUpdateService } from 'src/modules/v2Token/token.service/updateToken';
import { TokenDeletionService } from 'src/modules/v2Token/token.service/deleteToken';

import createMockInstance from 'jest-create-mock-instance';
import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';

// Mock Redis client
jest.mock('ioredis');
// Mock Redis cache client
jest.mock('ioredis-cache');

describe('TokenNonfungibleController', () => {
  let controller: TokenNonfungibleController;
  let tokenTxHelperServiceMock: TokenTxHelperService;
  let tokenCreationServiceMock: TokenCreationService;
  let tokenRetrievalServiceMock: TokenRetrievalService;
  let tokenUpdateServiceMock: TokenUpdateService;
  let tokenDeletionServiceMock: TokenDeletionService;

  beforeEach(() => {
    tokenTxHelperServiceMock = createMockInstance(TokenTxHelperService);
    tokenCreationServiceMock = createMockInstance(TokenCreationService);
    tokenRetrievalServiceMock = createMockInstance(TokenRetrievalService);
    tokenUpdateServiceMock = createMockInstance(TokenUpdateService);
    tokenDeletionServiceMock = createMockInstance(TokenDeletionService);
    controller = new TokenNonfungibleController(
      tokenTxHelperServiceMock,
      tokenCreationServiceMock,
      tokenRetrievalServiceMock,
      tokenUpdateServiceMock,
      tokenDeletionServiceMock,
    );
  });

  it('TokenNonfungible', async () => {
    await expect(true).toBe(true);
  });
});
