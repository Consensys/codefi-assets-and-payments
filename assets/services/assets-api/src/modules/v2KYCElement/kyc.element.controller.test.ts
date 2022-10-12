import { KYCEssentialElementController } from './kyc.element.controller';
import { ApiKycCallService } from '../v2ApiCall/api.call.service/kyc';
import createMockInstance from 'jest-create-mock-instance';

describe('KYCEssentialElementController', () => {
  let controller: KYCEssentialElementController;
  let apiKycCallServiceMock: ApiKycCallService;

  beforeEach(() => {
    apiKycCallServiceMock = createMockInstance(ApiKycCallService);
    controller = new KYCEssentialElementController(apiKycCallServiceMock);
  });

  it('KYCEssentialElement', async () => {
    await expect(true).toBe(true);
  });
});
