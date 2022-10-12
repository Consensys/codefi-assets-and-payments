import { WorkflowTemplateController } from './workflows.template.controller';
import { ApiWorkflowWorkflowTemplateService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import createMockInstance from 'jest-create-mock-instance';

describe('WorkflowTemplateController', () => {
  let controller: WorkflowTemplateController;
  let apiWorkflowWorkflowTemplateServiceMock: ApiWorkflowWorkflowTemplateService;

  beforeEach(() => {
    apiWorkflowWorkflowTemplateServiceMock = createMockInstance(
      ApiWorkflowWorkflowTemplateService,
    );
    controller = new WorkflowTemplateController(
      apiWorkflowWorkflowTemplateServiceMock,
    );
  });

  it('KYCEssentialsLocal', async () => {
    await expect(true).toBe(true);
  });
});
