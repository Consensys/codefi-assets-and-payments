import {
  Controller,
  Post,
  HttpCode,
  Body,
  Get,
  Query,
  Param,
  Delete,
  UseFilters,
} from '@nestjs/common';
import { AxiosResponse } from 'axios';

import ErrorService from 'src/utils/errorService';

import {
  CreateNavBodyInput,
  CreateNavOutput,
  ListAllNavOutput,
  ListAllNavQueryInput,
  RetrieveNavOutput,
  RetrieveNavParamInput,
  CreateNavM2MQuery,
  MAX_NAV_COUNT,
} from './nav.dto';
import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import { UserType } from 'src/types/user';
import { NavService } from './nav.service';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { ApiWorkflowWorkflowInstanceService } from '../v2ApiCall/api.call.service/workflow';
import { ApiDataFeedService } from '../v2ApiCall/api.call.service/datafeed';
import { WorkflowInstanceEnum } from 'src/old/constants/enum';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import { setToLowerCase } from 'src/utils/case';
import { Subscription } from 'src/types/subscription';
import { Paginate } from 'src/modules/v2ApiCall/api.call.service/query';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/essentials/digital/asset/nav')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class NavController {
  constructor(
    private readonly navService: NavService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllNavs(
    @UserContext() userContext: IUserContext,
    @Query() navQuery: ListAllNavQueryInput,
  ): Promise<ListAllNavOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const offset = Number(navQuery.offset || 0);
      const limit: number = Math.min(
        Number(navQuery.limit || MAX_NAV_COUNT),
        MAX_NAV_COUNT,
      );

      let allNavs: Paginate<NAV>;
      if (navQuery.userType === UserType.ISSUER) {
        allNavs = await this.navService.listAllNavsAsIssuer({
          tenantId: userContext[UserContextKeys.TENANT_ID],
          assetId: navQuery.tokenId,
          assetClassKey: setToLowerCase(navQuery.assetClass),
          skip: offset,
          limit,
          maxDate: undefined,
          filterValidatedNavs: navQuery.filterValidatedNavs,
          issuerId: userContext[UserContextKeys.USER_ID],
        });
      } else {
        allNavs = await this.navService.listAllNavsAsInvestor({
          tenantId: userContext[UserContextKeys.TENANT_ID],
          assetId: navQuery.tokenId,
          assetClassKey: setToLowerCase(navQuery.assetClass),
          skip: offset,
          limit,
          maxDate: undefined,
          filterValidatedNavs: true,
        });
      }

      // const slicedNAVsList: Array<NAV> = allNavs.slice(
      //   offset,
      //   Math.min(offset + limit, allNavs.length),
      // );

      const response: ListAllNavOutput = {
        navs: allNavs.items,
        count: allNavs.items.length,
        total: allNavs.total,
        message: `${allNavs.items.length} NAV(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all NAVs',
        'listAllNavs',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(201)
  @Protected(true, [])
  async createNav(
    @UserContext() userContext: IUserContext,
    @Body() createNavBody: CreateNavBodyInput,
  ): Promise<CreateNavOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CreateNavOutput = await this.navService.createNav(
        userContext[UserContextKeys.TENANT_ID],
        createNavBody.idempotencyKey,
        typeFunctionUser,
        userContext[UserContextKeys.USER_ID],
        createNavBody.tokenId,
        createNavBody.navValue,
        createNavBody.navDate,
        createNavBody.assetClass
          ? setToLowerCase(createNavBody.assetClass)
          : undefined,
        createNavBody.data,
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating new NAV ',
        'createNav',
        true,
        500,
      );
    }
  }

  @Post('/m2m')
  @HttpCode(201)
  @Protected(false, [])
  // This endpoint is not protected as it's a M2M route.
  // Its protected by a secret (cf. AuthenticationGuard) instead of an access token.
  async createNavM2M(
    @Body() createNavBody: CreateNavBodyInput,
    @Query() query: CreateNavM2MQuery,
  ): Promise<CreateNavOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;

      const response: CreateNavOutput = await this.navService.createNav(
        query.tenantId,
        createNavBody.idempotencyKey,
        typeFunctionUser,
        query.userId,
        createNavBody.tokenId,
        createNavBody.navValue,
        createNavBody.navDate,
        createNavBody.assetClass
          ? setToLowerCase(createNavBody.assetClass)
          : undefined,
        createNavBody.data,
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating new NAV from Data-Feed API',
        'createNavM2M',
        true,
        500,
      );
    }
  }

  @Get(':navId')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveNav(
    @UserContext() userContext: IUserContext,
    @Param() navParam: RetrieveNavParamInput,
  ): Promise<RetrieveNavOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const navData: NAV = await this.workflowService.retrieveWorkflowInstances(
        userContext[UserContextKeys.TENANT_ID],
        WorkflowInstanceEnum.id,
        navParam.navId,
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        WorkflowType.NAV,
        undefined, // otherWorkflowType
        true,
      );

      const response: RetrieveNavOutput = {
        nav: navData,
        message: `NAV ${navParam.navId} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving NAV',
        'retrieveNav',
        true,
        500,
      );
    }
  }
}
@Controller('v2/subscription')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class SubscriptionController {
  constructor(private readonly datafeedService: ApiDataFeedService) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllSubscriptions(
    @UserContext() userContext: IUserContext,
  ): Promise<Subscription[]> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      return await this.datafeedService.getAllSubscriptions();
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all subscriptions',
        'listAllSubscriptions',
        true,
        500,
      );
    }
  }

  @Post()
  @HttpCode(201)
  @Protected(true, [])
  async createSubscription(
    @UserContext() userContext: IUserContext,
    @Body() subscription: Subscription,
  ): Promise<Subscription> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      return await this.datafeedService.createSubscription(subscription);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating a subscription',
        'createSubscription',
        true,
        500,
      );
    }
  }

  @Delete(':id')
  @HttpCode(200)
  @Protected(true, [])
  async deleteSubscription(
    @UserContext() userContext: IUserContext,
    @Param('id') id: string,
  ): Promise<AxiosResponse<string>> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      return await this.datafeedService.deleteSubscription(id);
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting a subscription',
        'deleteSubscription',
        true,
        500,
      );
    }
  }
}
