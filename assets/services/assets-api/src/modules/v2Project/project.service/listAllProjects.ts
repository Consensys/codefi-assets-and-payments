import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { WorkflowInstanceEnum } from 'src/old/constants/enum';

// APIs
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import { keys as UserKeys, User, UserType } from 'src/types/user';
import { Link, LinkState } from 'src/types/workflow/workflowInstances/link';

import { EntityType } from 'src/types/entity';
import { ProjectRetrievalService } from './retrieveProject';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  keys as LinkKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { checkLinkStateValidForUserType } from 'src/utils/checks/links';
import { Project } from 'src/types/project';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class ProjectListingService {
  constructor(
    private readonly projectRetrievalService: ProjectRetrievalService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
  ) {}

  /**
   * [List all projects linked to the issuer]
   * Returns the list of all projects linked to the issuer + the associated link.
   */
  async listAllProjects(
    tenantId: string,
    userId: string,
    offset: number,
    limit: number,
    userType: UserType,
    withVehicles: boolean,
  ): Promise<{
    projects: Array<Project>;
    total: number;
  }> {
    try {
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );

      // Fetch all user-project links
      const userProjectLinks: Array<Link> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityTypeAndUserId,
          undefined, // userEntityLinkId
          undefined, // idempotencyKey
          user[UserKeys.USER_ID],
          undefined, // entityId
          undefined, // objectId
          EntityType.PROJECT, // entityType
          WorkflowType.LINK,
          undefined, // otherWorkflowType
          false,
        );

      let filteredUserProjectLinks: Array<Link>;
      if (userType === UserType.ISSUER || userType === UserType.SUPERADMIN) {
        filteredUserProjectLinks = userProjectLinks.filter(
          (userProjectLink: Link) =>
            userProjectLink[LinkKeys.STATE] === LinkState.ISSUER,
        );
      } else if (userType === UserType.NOTARY) {
        filteredUserProjectLinks = userProjectLinks.filter(
          (userProjectLink: Link) =>
            userProjectLink[LinkKeys.STATE] === LinkState.NOTARY,
        );
      } else if (userType === UserType.INVESTOR) {
        filteredUserProjectLinks = userProjectLinks.filter(
          (userProjectLink: Link) => {
            return checkLinkStateValidForUserType(
              userProjectLink[LinkKeys.STATE],
              UserType.INVESTOR,
              userProjectLink[LinkKeys.ENTITY_TYPE],
            );
          },
        );
      } else {
        ErrorService.throwError('invalid user type');
      }

      let projectsTotal: number;
      let projectsList: Array<Project>;
      if (userType === UserType.ISSUER || userType === UserType.NOTARY) {
        projectsTotal = filteredUserProjectLinks.length;
        const slicedIssuerProjectLinks: Array<Link> =
          filteredUserProjectLinks.slice(
            offset,
            Math.min(offset + limit, filteredUserProjectLinks.length),
          );

        projectsList = await Promise.all(
          slicedIssuerProjectLinks.map((issuerProjectLink: Link) => {
            return this.projectRetrievalService.retrieveProjectAsIssuer(
              tenantId,
              issuerProjectLink[LinkKeys.ENTITY_ID], // projectId
              withVehicles, // withVehicles
            );
          }),
        );
      } else if (userType === UserType.INVESTOR) {
        // We extract IDs by taking care of deduplicating them (even though duplicated links shall never happen for projects).
        const projectIds: Array<string> = [];
        filteredUserProjectLinks.map((investorProjectLink: Link) => {
          const currentProjectId = investorProjectLink[LinkKeys.ENTITY_ID];
          if (projectIds.indexOf(currentProjectId) < 0) {
            projectIds.push(currentProjectId);
          }
        });

        projectsTotal = projectIds.length;
        const slicedProjectIds: Array<string> = projectIds.slice(
          offset,
          Math.min(offset + limit, projectIds.length),
        );

        projectsList = await Promise.all(
          slicedProjectIds.map((projectId: string) => {
            return this.projectRetrievalService.retrieveProjectAsInvestor(
              tenantId,
              projectId,
              withVehicles,
              user,
            );
          }),
        );
      } else {
        ErrorService.throwError('invalid user type');
      }

      return { projects: projectsList, total: projectsTotal };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all projects',
        'listAllProjects',
        false,
        500,
      );
    }
  }

  /**
   * [List all projects]
   */
  async listAllAdminProjects(
    tenantId: string,
    offset: number,
    limit: number,
  ): Promise<{ projects: Array<Project>; total: number }> {
    try {
      const projects: Array<Project> =
        await this.apiMetadataCallService.listAllProjects(tenantId);

      const slicedProjects: Array<Project> = projects.slice(
        offset,
        Math.min(offset + limit, projects.length),
      );

      return {
        projects: slicedProjects,
        total: projects.length,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all admin projects',
        'listAllAdminProjects',
        false,
        500,
      );
    }
  }
}
