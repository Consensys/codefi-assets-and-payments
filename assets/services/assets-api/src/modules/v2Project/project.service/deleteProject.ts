import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { ProjectEnum } from 'src/old/constants/enum';

import { DeleteKycDataOutput } from 'src/modules/v2KYCData/kyc.data.dto';
import { KYCDataService } from 'src/modules/v2KYCData/kyc.data.service';
import { EntityType } from 'src/types/entity';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { DeleteProjectOutput } from '../project.dto';
import { keys as ProjectKeys, Project } from 'src/types/project';

@Injectable()
export class ProjectDeletionService {
  constructor(
    private readonly entityService: EntityService,
    private readonly kycDataService: KYCDataService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  /**
   * [Delete project]
   */
  deleteProject = async (
    tenantId: string,
    userId: string,
    projectId: string,
  ): Promise<DeleteProjectOutput> => {
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

      let deletedKycData: DeleteKycDataOutput;
      if (project[ProjectKeys.DATA]) {
        // Caution: KYC data deletion needs to be performed before Links deletion (links are used to delete KYC)
        deletedKycData = await this.kycDataService.deleteAllEntityKycData(
          tenantId,
          projectId,
          EntityType.PROJECT,
        );
      }

      const deletedLinkIds: Array<number> =
        await this.workflowService.deleteAllEntityWorkflowInstances(
          tenantId,
          projectId,
          WorkflowType.LINK,
        );

      await this.apiMetadataCallService.deleteProjectInDB(
        tenantId,
        project[ProjectKeys.PROJECT_ID],
      );

      return {
        deletedElementReviews:
          deletedKycData && deletedKycData.deletedElementReviews
            ? deletedKycData.deletedElementReviews
            : [],
        deletedTemplateReviews:
          deletedKycData && deletedKycData.deletedTemplateReviews
            ? deletedKycData.deletedTemplateReviews
            : [],
        deletedLinks: deletedLinkIds,
        message: `Project ${
          project[ProjectKeys.PROJECT_ID]
        } deleted successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting project',
        'deleteProject',
        false,
        500,
      );
    }
  };
}
