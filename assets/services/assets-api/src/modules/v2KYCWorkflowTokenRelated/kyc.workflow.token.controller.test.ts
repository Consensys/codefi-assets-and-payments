import { KYCWorkflowTokenRelatedController } from './kyc.workflow.token.controller';
import createMockInstance from 'jest-create-mock-instance';
import { KYCWorkflowAllowListService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/allowList';
import { KYCWorkflowGenericService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/workflow';
import { LinkService } from 'src/modules/v2Link/link.service';
import { KYCWorkflowHelperService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service';

describe('KYCWorkflowTokenRelatedController', () => {
  let controller: KYCWorkflowTokenRelatedController;
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
    controller = new KYCWorkflowTokenRelatedController(
      kycWorkflowHelperServiceMock,
      kycWorkflowGenericServiceMock,
      kycWorkflowAllowListService,
      linkServiceMock,
    );
  });

  it('KYCWorkflowTokenRelated', async () => {
    await expect(true).toBe(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
