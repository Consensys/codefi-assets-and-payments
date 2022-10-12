// Local services

import createMockInstance from 'jest-create-mock-instance';
import { ApiMetadataCallService } from '../v2ApiCall/api.call.service/metadata';
import { ProjectDeletionService } from './project.service/deleteProject';
import { ProjectUpdateService } from './project.service/updateProject';
import { ProjectRetrievalService } from './project.service/retrieveProject';
import { ProjectCreationService } from './project.service/createProject';
import { ProjectListingService } from './project.service/listAllProjects';
import { ProjectController } from './project.controller';
import { UserListingService } from '../v2User/user.service/listAllUsers';

describe('ProjectController', () => {
  let controller: ProjectController;
  let projectListingServiceMock: ProjectListingService;
  let projectCreationServiceMock: ProjectCreationService;
  let projectRetrievalServiceMock: ProjectRetrievalService;
  let projectUpdateServiceMock: ProjectUpdateService;
  let projectDeletionServiceMock: ProjectDeletionService;
  let apiMetadataCallServiceMock: ApiMetadataCallService;
  let userListingServiceMock: UserListingService;

  beforeEach(() => {
    projectListingServiceMock = createMockInstance(ProjectListingService);
    projectCreationServiceMock = createMockInstance(ProjectCreationService);
    projectRetrievalServiceMock = createMockInstance(ProjectRetrievalService);
    projectUpdateServiceMock = createMockInstance(ProjectUpdateService);
    projectDeletionServiceMock = createMockInstance(ProjectDeletionService);
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);
    userListingServiceMock = createMockInstance(UserListingService);

    controller = new ProjectController(
      projectListingServiceMock,
      projectCreationServiceMock,
      projectRetrievalServiceMock,
      projectUpdateServiceMock,
      projectDeletionServiceMock,
      apiMetadataCallServiceMock,
      userListingServiceMock,
    );
  });

  it('Project', async () => {
    await expect(true).toBe(true);
  });
});
