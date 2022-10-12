import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Delete,
  Query,
  Body,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import { ProjectCreationService } from './project.service/createProject';
import { ProjectRetrievalService } from './project.service/retrieveProject';

import {
  ListAllProjectsQueryInput,
  ListAllProjectsOutput,
  CreateProjectBodyInput,
  CreateProjectOutput,
  RetrieveProjectOutput,
  RetrieveProjectQueryInput,
  RetrieveProjectParamInput,
  UpdateProjectParamInput,
  UpdateProjectBodyInput,
  DeleteProjectParamInput,
  UpdateProjectOutput,
  DeleteProjectOutput,
  RetrieveProjectInvestorsQueryInput,
  RetrieveProjectInvestorsParamInput,
  ListAllProjectInvestorsOutput,
  MAX_PROJECTS_COUNT,
  MAX_INVESTORS_COUNT,
} from './project.dto';

import {
  extractUsertypeFromContext,
  IUserContext,
  keys as UserContextKeys,
} from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

/**
 * PROJECTS
 */

import { UserType, User } from 'src/types/user';
import { ProjectListingService } from './project.service/listAllProjects';
import { ProjectUpdateService } from './project.service/updateProject';
import { ProjectDeletionService } from './project.service/deleteProject';
import { keys as ProjectKeys, Project } from 'src/types/project';
import { UserListingService } from '../v2User/user.service/listAllUsers';
import { ProjectEnum } from 'src/old/constants/enum';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';
@Controller('v2/essentials/project')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class ProjectController {
  constructor(
    private readonly projectListingService: ProjectListingService,
    private readonly projectCreationService: ProjectCreationService,
    private readonly projectRetrievalService: ProjectRetrievalService,
    private readonly projectUpdateService: ProjectUpdateService,
    private readonly projectDeletionService: ProjectDeletionService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly userListingService: UserListingService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllProjects(
    @UserContext() userContext: IUserContext,
    @Query() projectQuery: ListAllProjectsQueryInput,
  ): Promise<ListAllProjectsOutput> {
    try {
      const offset = Number(projectQuery.offset || 0);
      const limit: number = Math.min(
        Number(projectQuery.limit || MAX_PROJECTS_COUNT),
        MAX_PROJECTS_COUNT,
      );

      const typeFunctionUser: UserType =
        extractUsertypeFromContext(userContext);

      let projectsList: {
        projects: Array<Project>;
        total: number;
      };
      if (
        typeFunctionUser === UserType.SUPERADMIN ||
        typeFunctionUser === UserType.ADMIN
      ) {
        projectsList = await this.projectListingService.listAllAdminProjects(
          userContext[UserContextKeys.TENANT_ID],
          offset,
          limit,
        );
      } else if (typeFunctionUser === UserType.ISSUER) {
        projectsList = await this.projectListingService.listAllProjects(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          offset,
          limit,
          UserType.ISSUER,
          projectQuery.withVehicles,
        );
      } else if (typeFunctionUser === UserType.NOTARY) {
        projectsList = await this.projectListingService.listAllProjects(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          offset,
          limit,
          UserType.NOTARY,
          projectQuery.withVehicles,
        );
      } else if (
        typeFunctionUser === UserType.INVESTOR ||
        typeFunctionUser === UserType.VEHICLE
      ) {
        projectsList = await this.projectListingService.listAllProjects(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          offset,
          limit,
          UserType.INVESTOR,
          projectQuery.withVehicles,
        );
      } else {
        ErrorService.throwError(
          `user type ${typeFunctionUser} is not allowed to retrieve projects`,
        );
      }

      const response: ListAllProjectsOutput = {
        projects: projectsList.projects,
        count: projectsList.projects.length,
        total: projectsList.total,
        message: `${projectsList.projects.length} project(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing projects',
        'listAllProjects',
        true,
        500,
      );
    }
  }

  @Get('/:projectId/investor')
  @HttpCode(200)
  @Protected(true, [])
  async listAllProjectInvestors(
    @UserContext() userContext: IUserContext,
    @Query() projectInvestorsQuery: RetrieveProjectInvestorsQueryInput,
    @Param() projectInvestorsParam: RetrieveProjectInvestorsParamInput,
  ): Promise<ListAllProjectInvestorsOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const offset = Number(projectInvestorsQuery.offset || 0);
      const limit: number = Math.min(
        Number(projectInvestorsQuery.limit || MAX_INVESTORS_COUNT),
        MAX_INVESTORS_COUNT,
      );

      const project: Project =
        await this.apiMetadataCallService.retrieveProject(
          userContext[UserContextKeys.TENANT_ID],
          ProjectEnum.projectId,
          projectInvestorsParam.projectId,
          true,
        );

      const investorsList: {
        investors: Array<User>;
        total: number;
      } = await this.userListingService.listAllInvestorsLinkedToProject(
        userContext[UserContextKeys.TENANT_ID],
        offset,
        limit,
        project,
        projectInvestorsQuery.withVehicles,
      );

      const response = {
        users: investorsList.investors,
        count: investorsList.investors.length,
        total: investorsList.total,
        message: `${investorsList.investors.length} user(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "listing project's investors",
        'listAllProjectInvestors',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(201)
  @Protected(true, [])
  async createProject(
    @UserContext() userContext: IUserContext,
    @Body() projectBody: CreateProjectBodyInput,
  ): Promise<CreateProjectOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response = await this.projectCreationService.createProject(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        typeFunctionUser,
        projectBody.wallet,
        projectBody.key,
        projectBody.name,
        projectBody.description,
        projectBody.picture,
        projectBody.bankAccount,
        projectBody.kycTemplateId,
        projectBody.data,
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating a project',
        'createProject',
        true,
        500,
      );
    }
  }

  @Get(':projectId')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveProject(
    @UserContext() userContext: IUserContext,
    @Query() projectQuery: RetrieveProjectQueryInput,
    @Param() projectParam: RetrieveProjectParamInput,
  ): Promise<RetrieveProjectOutput> {
    try {
      checkUserType(projectQuery.userType, userContext[UserContextKeys.USER]);

      const project: Project =
        await this.projectRetrievalService.retrieveProjectIfLinkedToUser(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          projectQuery.userType,
          projectParam.projectId,
          projectQuery.withVehicles,
        );

      const response: RetrieveProjectOutput = {
        project: project,
        message: `Project ${
          project[ProjectKeys.PROJECT_ID]
        } retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving a project',
        'retrieveProject',
        true,
        500,
      );
    }
  }

  // FIXME: Filter which user fields can be modified and which can not (for example, we don't want a user to modify his ethereum address)
  @Put(':projectId')
  @HttpCode(200)
  @Protected(true, [])
  async updateProject(
    @UserContext() userContext: IUserContext,
    @Param() projectParam: UpdateProjectParamInput,
    @Body() projectBody: UpdateProjectBodyInput,
  ): Promise<UpdateProjectOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const project: Project = await this.projectUpdateService.updateProject(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER_ID],
        projectParam.projectId,
        projectBody.updatedParameters,
      );

      const response: UpdateProjectOutput = {
        project: project,
        message: `Project ${
          project[ProjectKeys.PROJECT_ID]
        } updated successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating a project',
        'updateProject',
        true,
        500,
      );
    }
  }

  @Delete(':projectId')
  @HttpCode(200)
  @Protected(true, [])
  async deleteProject(
    @UserContext() userContext: IUserContext,
    @Param() projectParam: DeleteProjectParamInput,
  ): Promise<DeleteProjectOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: DeleteProjectOutput =
        await this.projectDeletionService.deleteProject(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          projectParam.projectId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting a project',
        'deleteProject',
        true,
        500,
      );
    }
  }
}
