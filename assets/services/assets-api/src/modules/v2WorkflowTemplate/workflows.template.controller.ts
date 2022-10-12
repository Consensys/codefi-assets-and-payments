import { Controller, Get, Param, HttpCode, UseFilters } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import { WorkflowTemplate } from 'src/types/workflow/workflowTemplate';

import {
  ListAllWorkflowsOutput,
  RetrieveWorkflowOutput,
  RetrieveWorkflowParamInput,
} from './workflows.template.dto';
import { UserType } from 'src/types/user';
import { ApiWorkflowWorkflowTemplateService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { WorkflowTemplateEnum } from 'src/old/constants/enum';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';

@Controller('v2/workflows')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class WorkflowTemplateController {
  constructor(
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
  ) {}

  @Get('')
  @HttpCode(200)
  @Protected(true, [])
  async listAllWorkflows(
    @UserContext() userContext: IUserContext,
  ): Promise<ListAllWorkflowsOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const workflowTemplates: Array<WorkflowTemplate> =
        await this.workflowTemplateService.listAllWorkflowTemplates(
          userContext[UserContextKeys.TENANT_ID],
        );
      return {
        workflows: workflowTemplates,
        message: `${workflowTemplates.length} workflow(s) listed successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all workflows',
        'listAllWorkflows',
        true,
        500,
      );
    }
  }

  @Get('/:workflowId')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveWorkflowById(
    @UserContext() userContext: IUserContext,
    @Param() workflowsParam: RetrieveWorkflowParamInput,
  ): Promise<RetrieveWorkflowOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const workflowTemplate: WorkflowTemplate =
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          userContext[UserContextKeys.TENANT_ID],
          WorkflowTemplateEnum.id,
          workflowsParam.workflowId,
          undefined,
        );

      const response: RetrieveWorkflowOutput = {
        workflow: workflowTemplate,
        message: `Workflow ${workflowsParam.workflowId} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving workflow by ID',
        'retrieveWorkflowById',
        true,
        500,
      );
    }
  }
}
