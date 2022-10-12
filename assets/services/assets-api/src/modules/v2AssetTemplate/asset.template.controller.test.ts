// Local services
import { AssetTemplateController } from './asset.template.controller';

import createMockInstance from 'jest-create-mock-instance';
import { ApiMetadataCallService } from '../v2ApiCall/api.call.service/metadata';

describe('AssetTemplateController', () => {
  let controller: AssetTemplateController;
  let apiMetadataCallServiceMock: ApiMetadataCallService;

  beforeEach(() => {
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);

    controller = new AssetTemplateController(apiMetadataCallServiceMock);
  });

  it('AssetTemplate', async () => {
    await expect(true).toBe(true);
  });
});
