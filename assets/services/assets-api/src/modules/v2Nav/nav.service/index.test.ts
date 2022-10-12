import createMockInstance from 'jest-create-mock-instance';
import {
  FindNavOptions,
  NavService,
} from 'src/modules/v2Nav/nav.service/index';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { CycleService } from 'src/modules/v2Cycle/cycle.service';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { LinkService } from 'src/modules/v2Link/link.service';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { MAX_NAV_COUNT } from 'src/modules/v2Nav/nav.dto';
import { Paginate } from 'src/modules/v2ApiCall/api.call.service/query';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

describe('NavService', () => {
  let service: NavService;
  let apiMetadataCallServiceMock: ApiMetadataCallService;
  let apiEntityCallServiceMock: ApiEntityCallService;
  let apiWorkflowWorkflowInstanceServiceMock: ApiWorkflowWorkflowInstanceService;
  let cycleServiceMock: CycleService;
  let assetDataServiceMock: AssetDataService;
  let linkServiceMock: LinkService;
  let workflowTemplateServiceMock: ApiWorkflowWorkflowTemplateService;

  beforeEach(() => {
    const mockLogger = createMockInstance(NestJSPinoLogger);
    const mockEntityService = createMockInstance(EntityService);
    apiMetadataCallServiceMock = createMockInstance(ApiMetadataCallService);
    apiEntityCallServiceMock = createMockInstance(ApiEntityCallService);
    apiWorkflowWorkflowInstanceServiceMock = createMockInstance(
      ApiWorkflowWorkflowInstanceService,
    );
    cycleServiceMock = createMockInstance(CycleService);
    assetDataServiceMock = createMockInstance(AssetDataService);
    linkServiceMock = createMockInstance(LinkService);
    workflowTemplateServiceMock = createMockInstance(
      ApiWorkflowWorkflowTemplateService,
    );

    service = new NavService(
      mockLogger,
      mockEntityService,
      apiMetadataCallServiceMock,
      apiEntityCallServiceMock,
      apiWorkflowWorkflowInstanceServiceMock,
      cycleServiceMock,
      assetDataServiceMock,
      linkServiceMock,
      workflowTemplateServiceMock,
    );
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('listAllNavs', () => {
    const mockTenantId = 'fQPeYS1BhXQUbEKqBUGv0EXj7mluOfPa';
    const mockTokenId = '0x01';
    const mockResponse = { items: [], total: 0 };

    beforeEach(() => {
      apiWorkflowWorkflowInstanceServiceMock.findAll = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockResponse));
    });

    it('returns paginated navs', async () => {
      const query: FindNavOptions = {
        tenantId: mockTenantId,
        assetId: mockTokenId,
        assetClassKey: undefined,
        skip: undefined,
        limit: undefined,
        maxDate: undefined,
        filterValidatedNavs: undefined,
      };
      await expect(service.listAllNavs(query)).resolves.toEqual(mockResponse);
      expect(
        apiWorkflowWorkflowInstanceServiceMock.findAll,
      ).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        filters: [
          { name: 'entityId', comparator: '=', value: mockTokenId },
          { name: 'workflowType', comparator: '=', value: WorkflowType.NAV },
          { name: 'date', comparator: '<', value: expect.any(String) },
          { name: 'assetClassKey', comparator: '!', value: '' },
        ],
        order: [{ date: 'DESC' }],
        skip: 0,
        limit: MAX_NAV_COUNT,
      });
    });

    it('returns paginated navs less than the a max date', async () => {
      const query: FindNavOptions = {
        tenantId: mockTenantId,
        assetId: mockTokenId,
        assetClassKey: undefined,
        skip: undefined,
        limit: undefined,
        maxDate: new Date(),
        filterValidatedNavs: undefined,
      };
      await expect(service.listAllNavs(query)).resolves.toEqual(mockResponse);
      expect(
        apiWorkflowWorkflowInstanceServiceMock.findAll,
      ).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        filters: [
          { name: 'entityId', comparator: '=', value: mockTokenId },
          { name: 'workflowType', comparator: '=', value: WorkflowType.NAV },
          { name: 'date', comparator: '<', value: query.maxDate.toISOString() },
          { name: 'assetClassKey', comparator: '!', value: '' },
        ],
        order: [{ date: 'DESC' }],
        skip: 0,
        limit: MAX_NAV_COUNT,
      });
    });

    it('returns paginated navs filtered by assetClassKey', async () => {
      const navs = [{ assetClassKey: 'a' }, { assetClassKey: 'foo' }];
      apiWorkflowWorkflowInstanceServiceMock.findAll = jest
        .fn()
        .mockImplementation(() => Promise.resolve({ items: navs, total: 2 }));
      const query: FindNavOptions = {
        tenantId: mockTenantId,
        assetId: mockTokenId,
        assetClassKey: 'a',
        skip: undefined,
        limit: undefined,
        maxDate: new Date(),
        filterValidatedNavs: undefined,
      };

      await expect(service.listAllNavs(query)).resolves.toEqual({
        items: navs,
        total: 2,
      });

      expect(
        apiWorkflowWorkflowInstanceServiceMock.findAll,
      ).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        filters: [
          { name: 'entityId', comparator: '=', value: mockTokenId },
          { name: 'workflowType', comparator: '=', value: WorkflowType.NAV },
          { name: 'date', comparator: '<', value: query.maxDate.toISOString() },
          { name: 'assetClassKey', comparator: '=', value: 'a' },
        ],
        order: [{ date: 'DESC' }],
        skip: 0,
        limit: MAX_NAV_COUNT,
      });
    });
  });

  describe('listAllNavsAsIssuer', () => {
    const mockTenantId = 'fQPeYS1BhXQUbEKqBUGv0EXj7mluOfPa';
    const mockTokenId = '0x01';
    const mockIssuerId = '8581c38f-5717-4716-8699-674838e75e9c';
    const mockResponse: Paginate<any> = { items: [], total: 0 };
    const mockIssuer = {
      id: mockIssuerId,
    };

    beforeEach(() => {
      service.listAllNavs = jest.fn().mockImplementation(() => mockResponse);
      linkServiceMock.retrieveIssuerLinkedToEntity = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockIssuer));
      apiMetadataCallServiceMock.retrieveTokenInDB = jest
        .fn()
        .mockImplementation(() => Promise.resolve({}));
    });

    it('returns paginated navs', async () => {
      const query: FindNavOptions & { issuerId: string } = {
        tenantId: mockTenantId,
        assetId: mockTokenId,
        assetClassKey: undefined,
        skip: 0,
        limit: 100,
        maxDate: undefined,
        filterValidatedNavs: undefined,
        issuerId: mockIssuerId,
      };
      await expect(service.listAllNavsAsIssuer(query)).resolves.toEqual(
        mockResponse,
      );
      expect(service.listAllNavs).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        assetId: mockTokenId,
        assetClassKey: undefined,
        skip: query.skip,
        limit: query.limit,
        maxDate: undefined,
        filterValidatedNavs: undefined,
      });
    });
  });
});
