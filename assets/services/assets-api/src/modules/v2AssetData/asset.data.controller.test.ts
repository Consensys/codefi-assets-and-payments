// Local services
import { AssetDataController } from './asset.data.controller';

import createMockInstance from 'jest-create-mock-instance';
import { AssetDataService } from './asset.data.service';

describe('AssetDataController', () => {
  let controller: AssetDataController;
  let assetDataServiceMock: AssetDataService;

  beforeEach(() => {
    assetDataServiceMock = createMockInstance(AssetDataService);
    controller = new AssetDataController(assetDataServiceMock);
  });

  it('AssetData', async () => {
    await expect(true).toBe(true);
  });
});
