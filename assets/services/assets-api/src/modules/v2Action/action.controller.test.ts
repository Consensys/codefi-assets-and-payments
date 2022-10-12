// Local services
import { ActionController } from './action.controller';

import createMockInstance from 'jest-create-mock-instance';
import { ApiWorkflowWorkflowInstanceService } from '../v2ApiCall/api.call.service/workflow';
import { ActionService } from './action.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

describe('ActionController', () => {
  let controller: ActionController;
  let actionServiceMock: ActionService;
  let workflowServiceMock: ApiWorkflowWorkflowInstanceService;
  let apiMetadataCallServiceMock: ApiMetadataCallService;

  beforeEach(() => {
    actionServiceMock = createMockInstance(ActionService);
    workflowServiceMock = createMockInstance(
      ApiWorkflowWorkflowInstanceService,
    );
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);
    controller = new ActionController(
      actionServiceMock,
      workflowServiceMock,
      apiMetadataCallServiceMock,
    );
  });

  it('Action', async () => {
    await expect(true).toBe(true);
  });
});
