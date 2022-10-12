import { OrderController } from './order.controller';
import createMockInstance from 'jest-create-mock-instance';
import { ApiWorkflowWorkflowInstanceService } from '../v2ApiCall/api.call.service/workflow';
import { OrderService } from './order.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { EntityService } from 'src/modules/v2Entity/entity.service';

describe('OrderController', () => {
  let controller: OrderController;
  let orderServiceMock: OrderService;
  let apiWorkflowWorkflowInstanceServiceMock: ApiWorkflowWorkflowInstanceService;
  let apiMetadataCallServiceMock: ApiMetadataCallService;
  let entityServiceMock: EntityService;
  beforeEach(() => {
    orderServiceMock = createMockInstance(OrderService);
    apiWorkflowWorkflowInstanceServiceMock = createMockInstance(
      ApiWorkflowWorkflowInstanceService,
    );
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);
    entityServiceMock = createMockInstance(EntityService);

    controller = new OrderController(
      orderServiceMock,
      apiWorkflowWorkflowInstanceServiceMock,
      apiMetadataCallServiceMock,
      entityServiceMock,
    );
  });

  it('Order', async () => {
    await expect(true).toBe(true);
  });
});
