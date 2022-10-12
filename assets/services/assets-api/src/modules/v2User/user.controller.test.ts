// Local services
import { UserController } from './user.controller';
import { UserListingService } from './user.service/listAllUsers';
import { UserCreationService } from './user.service/createUser';
import { UserRetrievalService } from './user.service/retrieveUser';
import { UserUpdateService } from './user.service/updateUser';
import { UserDeletionService } from './user.service/deleteUser';

import createMockInstance from 'jest-create-mock-instance';
import { RoleService } from 'src/modules/v2Role/role.service';
import { UserHelperService } from './user.service/index';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';

describe('UserController', () => {
  let controller: UserController;
  let userListingServiceMock: UserListingService;
  let userCreationServiceMock: UserCreationService;
  let userRetrievalServiceMock: UserRetrievalService;
  let userUpdateServiceMock: UserUpdateService;
  let userDeletionServiceMock: UserDeletionService;
  let roleServiceMock: RoleService;
  let apiEntityCallServiceMock: ApiEntityCallService;
  let userHelperService: UserHelperService;

  beforeEach(() => {
    userListingServiceMock = createMockInstance(UserListingService);
    userCreationServiceMock = createMockInstance(UserCreationService);
    userRetrievalServiceMock = createMockInstance(UserRetrievalService);
    userUpdateServiceMock = createMockInstance(UserUpdateService);
    userDeletionServiceMock = createMockInstance(UserDeletionService);
    roleServiceMock = createMockInstance(RoleService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    userHelperService = createMockInstance(UserHelperService);

    controller = new UserController(
      userListingServiceMock,
      userCreationServiceMock,
      userRetrievalServiceMock,
      userUpdateServiceMock,
      userDeletionServiceMock,
      roleServiceMock,
      apiEntityCallServiceMock,
      userHelperService,
    );
  });

  it('User', async () => {
    await expect(true).toBe(true);
  });
});
