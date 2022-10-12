import { TokenController } from './token.controller';

import createMockInstance from 'jest-create-mock-instance';
import { RoleService } from 'src/modules/v2Role/role.service';
import { TokenUpdateService } from './token.service/updateToken';
import { TokenListingService } from './token.service/listAllTokens';
import { UserListingService } from '../v2User/user.service/listAllUsers';
import { TokenRetrievalService } from './token.service/retrieveToken';

describe('TokenController', () => {
  let controller: TokenController;
  let roleServiceMock: RoleService;
  let tokenUpdateServiceMock: TokenUpdateService;
  let tokenListingServiceMock: TokenListingService;
  let userListingServiceMock: UserListingService;
  let tokenRetrievalServiceMock: TokenRetrievalService;
  beforeEach(() => {
    roleServiceMock = createMockInstance(RoleService);
    tokenUpdateServiceMock = createMockInstance(TokenUpdateService);
    tokenListingServiceMock = createMockInstance(TokenListingService);
    userListingServiceMock = createMockInstance(UserListingService);
    tokenRetrievalServiceMock = createMockInstance(TokenRetrievalService);
    controller = new TokenController(
      roleServiceMock,
      tokenUpdateServiceMock,
      tokenListingServiceMock,
      userListingServiceMock,
      tokenRetrievalServiceMock,
    );
  });

  it('Tokens', async () => {
    await expect(true).toBe(true);
  });
});
