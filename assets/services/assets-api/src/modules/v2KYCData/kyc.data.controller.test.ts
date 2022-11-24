import { KYCEssentialDataController } from './kyc.data.controller';
import { KYCDataService } from './kyc.data.service';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import createMockInstance from 'jest-create-mock-instance';
import { LinkService } from 'src/modules/v2Link/link.service';
import { KycCheckService } from 'src/modules/v2KYCCheck/kyc.check.service';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import { EntityService } from 'src/modules/v2Entity/entity.service';

import { NestJSPinoLogger } from '@consensys/observability';
import { ApiEntityCallService } from '../v2ApiCall/api.call.service/entity';

describe('KYCEssentialDataController', () => {
  let controller: KYCEssentialDataController;
  let loggerMock: NestJSPinoLogger;
  let entityServiceMock: EntityService;
  let kycCheckServiceMock: KycCheckService;
  let kycTemplateServiceMock: KYCTemplateService;
  let linkServiceMock: LinkService;
  let apiKycCallServiceMock: ApiKycCallService;
  let apiEntityCallServiceMock: ApiEntityCallService;

  beforeEach(() => {
    kycTemplateServiceMock = createMockInstance(KYCTemplateService);
    loggerMock = createMockInstance(NestJSPinoLogger);
    entityServiceMock = createMockInstance(EntityService);
    kycCheckServiceMock = createMockInstance(KycCheckService);
    linkServiceMock = createMockInstance(LinkService);
    apiKycCallServiceMock = createMockInstance(ApiKycCallService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    controller = new KYCEssentialDataController(
      new KYCDataService(
        loggerMock,
        entityServiceMock,
        kycCheckServiceMock,
        kycTemplateServiceMock,
        linkServiceMock,
        apiKycCallServiceMock,
        apiEntityCallServiceMock,
      ),
    );
  });

  it('KYCEssentialData', async () => {
    await expect(true).toBe(true);
  });
});
