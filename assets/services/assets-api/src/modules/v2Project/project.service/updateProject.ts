import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { ProjectEnum } from 'src/old/constants/enum';

// APIs
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import { keys as ProjectKeys, Project } from 'src/types/project';
import { EntityType } from 'src/types/entity';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { ProjectHelperService } from '.';

@Injectable()
export class ProjectUpdateService {
  constructor(
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly entityService: EntityService,
    private readonly projectHelperService: ProjectHelperService,
  ) {}

  /**
   * [update a project]
   */
  async updateProject(
    tenantId: string,
    userId: string,
    projectId: string,
    updatedParameters: any,
  ): Promise<Project> {
    try {
      const project: Project =
        await this.apiMetadataCallService.retrieveProject(
          tenantId,
          ProjectEnum.projectId,
          projectId,
          true,
        );

      await this.entityService.checkEntityCanBeUpdatedOrDeleted(
        tenantId,
        userId,
        projectId,
        EntityType.PROJECT,
        undefined, // token (only required if previous parameter is EntityType.TOKEN)
      );

      if (!updatedParameters) {
        ErrorService.throwError('wrong input format for parameters to update');
      }

      const { name, description, picture, bankAccount, kycTemplateId, data } =
        updatedParameters;

      const _description: string =
        this.projectHelperService.retrieveProjectDescriptionIfValid(
          description,
        );

      const newData = { ...project[ProjectKeys.DATA], ...data };
      // cleanup data by removing keys with null values
      Object.keys(newData).forEach((key) => {
        if (newData[key] === null) {
          delete newData[key];
        }
      });

      const updatedProject: Project =
        await this.apiMetadataCallService.updateProjectInDB(
          tenantId,
          project[ProjectKeys.PROJECT_ID],
          {
            key: project[ProjectKeys.KEY],
            name,
            description: _description,
            picture,
            bankAccount,
            kycTemplateId,
            data: newData,
          },
        );

      return updatedProject;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating project',
        'updateProject',
        false,
        500,
      );
    }
  }
}
