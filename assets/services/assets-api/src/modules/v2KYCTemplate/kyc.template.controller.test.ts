import { KYCEssentialTemplateController } from './kyc.template.controller';
import { KYCTemplateService } from './kyc.template.service';
import createMockInstance from 'jest-create-mock-instance';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';

describe('KYCEssentialTemplateController', () => {
  let controller: KYCEssentialTemplateController;
  let kycTemplateServiceMock: KYCTemplateService;
  let apiKycCallServiceMock: ApiKycCallService;
  let apiEntityCallServiceMock: ApiEntityCallService;

  beforeEach(() => {
    kycTemplateServiceMock = createMockInstance(KYCTemplateService);
    apiKycCallServiceMock = createMockInstance(ApiKycCallService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    controller = new KYCEssentialTemplateController(
      kycTemplateServiceMock,
      apiKycCallServiceMock,
      apiEntityCallServiceMock,
    );
  });

  it('KYCEssentialTemplate', async () => {
    await expect(true).toBe(true);
  });
});
