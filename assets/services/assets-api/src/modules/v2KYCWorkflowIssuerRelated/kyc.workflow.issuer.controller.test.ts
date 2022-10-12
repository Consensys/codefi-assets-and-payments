import { KYCWorkflowIssuerRelatedController } from './kyc.workflow.issuer.controller';
import createMockInstance from 'jest-create-mock-instance';
import { KYCWorkflowAllowListService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/allowList';
import { KYCWorkflowGenericService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/workflow';
import { LinkService } from 'src/modules/v2Link/link.service';
import { KYCWorkflowHelperService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service';

describe('KYCWorkflowIssuerRelatedController', () => {
  let controller: KYCWorkflowIssuerRelatedController;
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
    controller = new KYCWorkflowIssuerRelatedController(
      kycWorkflowHelperServiceMock,
      kycWorkflowGenericServiceMock,
      kycWorkflowAllowListService,
      linkServiceMock,
    );
  });

  it('KYCWorkflowIssuerRelated', async () => {
    await expect(true).toBe(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
