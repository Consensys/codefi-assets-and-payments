import { NavController } from './nav.controller';
import createMockInstance from 'jest-create-mock-instance';
import { NavService } from './nav.service';
import { ApiWorkflowWorkflowInstanceService } from '../v2ApiCall/api.call.service/workflow';
import { ListAllNavQueryInput, MAX_NAV_COUNT } from 'src/modules/v2Nav/nav.dto';
import { UserExample, UserType } from 'src/types/user';

import {
  IUserContext,
  keys as UserContextKeys,
  UserContextExample,
} from 'src/types/userContext';

const userMock = UserExample;

describe('NavController', () => {
  let controller: NavController;
  let navServiceMock: NavService;
  let apiWorkflowWorkflowInstanceServiceMock: ApiWorkflowWorkflowInstanceService;
  beforeEach(() => {
    navServiceMock = createMockInstance(NavService);
    apiWorkflowWorkflowInstanceServiceMock = createMockInstance(
      ApiWorkflowWorkflowInstanceService,
    );

    controller = new NavController(
      navServiceMock,
      apiWorkflowWorkflowInstanceServiceMock,
    );
  });

  it('Nav', async () => {
    await expect(controller).toBeDefined();
  });

  describe('listAllNavs', () => {
    const mockResponse = { items: [], total: 0 };
    const mockTenantId = 'fQPeYS1BhXQUbEKqBUGv0EXj7mluOfPa';

    const mockUserContext: IUserContext = {
      ...UserContextExample,
      [UserContextKeys.TENANT_ID]: mockTenantId,
      [UserContextKeys.USER]: userMock,
    };

    beforeEach(() => {
      navServiceMock.listAllNavsAsIssuer = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockResponse));
      navServiceMock.listAllNavsAsInvestor = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockResponse));
    });

    describe('as Issuer', () => {
      it('returns the list', async () => {
        const query: ListAllNavQueryInput = {
          tokenId: '0x1',
          userType: UserType.ISSUER,
          assetClass: 'A',
          offset: 0,
          limit: 100,
          filterValidatedNavs: false,
        };

        await expect(
          controller.listAllNavs(mockUserContext, query),
        ).resolves.toEqual({
          navs: mockResponse.items,
          count: mockResponse.items.length,
          total: mockResponse.total,
          message: `${mockResponse.items.length} NAV(s) listed successfully`,
        });

        expect(navServiceMock.listAllNavsAsIssuer).toHaveBeenCalledWith({
          tenantId: mockUserContext[UserContextKeys.TENANT_ID],
          issuerId: mockUserContext[UserContextKeys.USER_ID],
          assetId: query.tokenId,
          assetClassKey: query.assetClass.toLowerCase(),
          skip: query.offset,
          limit: MAX_NAV_COUNT,
          maxDate: undefined,
          filterValidatedNavs: false,
        });
      });
    });

    describe('as Investor', () => {
      it('returns the list', async () => {
        const query: ListAllNavQueryInput = {
          tokenId: '0x1',
          userType: UserType.INVESTOR,
          assetClass: 'A',
          offset: 0,
          limit: 100,
          filterValidatedNavs: false,
        };

        await expect(
          controller.listAllNavs(mockUserContext, query),
        ).resolves.toEqual({
          navs: mockResponse.items,
          count: mockResponse.items.length,
          total: mockResponse.total,
          message: `${mockResponse.items.length} NAV(s) listed successfully`,
        });

        expect(navServiceMock.listAllNavsAsInvestor).toHaveBeenCalledWith({
          tenantId: mockUserContext[UserContextKeys.TENANT_ID],
          assetId: query.tokenId,
          assetClassKey: query.assetClass.toLowerCase(),
          skip: query.offset,
          limit: MAX_NAV_COUNT,
          maxDate: undefined,
          filterValidatedNavs: true,
        });
      });
    });
  });
});
