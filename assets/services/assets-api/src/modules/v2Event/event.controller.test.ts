import { EventController } from './event.controller';
import createMockInstance from 'jest-create-mock-instance';
import { ApiWorkflowWorkflowInstanceService } from '../v2ApiCall/api.call.service/workflow';
import { EventService } from './event.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

describe('EventController', () => {
  let controller: EventController;
  let eventServiceMock: EventService;
  let apiWorkflowWorkflowInstanceServiceMock: ApiWorkflowWorkflowInstanceService;
  let apiMetadataCallServiceMock: ApiMetadataCallService;
  beforeEach(() => {
    eventServiceMock = createMockInstance(EventService);
    apiWorkflowWorkflowInstanceServiceMock = createMockInstance(
      ApiWorkflowWorkflowInstanceService,
    );
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);

    controller = new EventController(
      eventServiceMock,
      apiWorkflowWorkflowInstanceServiceMock,
      apiMetadataCallServiceMock,
    );
  });

  it('Event', async () => {
    await expect(true).toBe(true);
  });
});
