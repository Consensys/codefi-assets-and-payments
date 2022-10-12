import { KYCWorkflowPlatformRelatedController } from './kyc.workflow.platform.controller';
import createMockInstance from 'jest-create-mock-instance';
import { KYCWorkflowAllowListService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/allowList';
import { KYCWorkflowGenericService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/workflow';
import { LinkService } from 'src/modules/v2Link/link.service';
import { KYCWorkflowHelperService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service';

describe('KYCWorkflowPlatformRelatedController', () => {
  let controller: KYCWorkflowPlatformRelatedController;
  let kycWorkflowHelperServiceMock: KYCWorkflowHelperService;
  let kycWorkflowGenericServiceMock: KYCWorkflowGenericService;
  let kycWorkflowAllowListService: KYCWorkflowAllowListService;
  let linkServiceMock: LinkService;

  beforeEach(() => {
    kycWorkflowHelperServiceMock = createMockInstance(KYCWorkflowHelperService);
    kycWorkflowGenericServiceMock = createMockInstance(
      KYCWorkflowGenericService,
    );
    kycWorkflowAllowListService = createMockInstance(
      KYCWorkflowAllowListService,
    );
    linkServiceMock = createMockInstance(LinkService);
    controller = new KYCWorkflowPlatformRelatedController(
      kycWorkflowHelperServiceMock,
      kycWorkflowGenericServiceMock,
      kycWorkflowAllowListService,
      linkServiceMock,
    );
  });

  it('KYCWorkflowPlatformRelated', async () => {
    await expect(true).toBe(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
