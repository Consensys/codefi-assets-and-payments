// Local services
import { CycleController } from './cycle.controller';

import createMockInstance from 'jest-create-mock-instance';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

describe('CycleController', () => {
  let controller: CycleController;
  let apiMetadataCallServiceMock: ApiMetadataCallService;

  beforeEach(() => {
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);
    controller = new CycleController(apiMetadataCallServiceMock);
  });

  it('Cycle', async () => {
    await expect(true).toBe(true);
  });
});
