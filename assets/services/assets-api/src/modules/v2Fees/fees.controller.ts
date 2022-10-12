import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  Post,
  Body,
  UseFilters,
} from '@nestjs/common';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import { UserType } from 'src/types/user';

import { FeesService } from './fees.service';
import {
  CreateFeesParamInput,
  CreateFeesBodyInput,
  CreateFeesOutput,
  RetrieveFeesParamInput,
  RetrieveFeesQueryInput,
  RetrieveFeesOutput,
} from './fees.dto';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';

@Controller('v2/essentials/digital/asset')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('/:tokenId/fees')
  @HttpCode(201)
  @Protected(true, [])
  async createOrUpdateTokenFees(
    @UserContext() userContext: IUserContext,
    @Param() feesParam: CreateFeesParamInput,
    @Body() feesBody: CreateFeesBodyInput,
  ): Promise<CreateFeesOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: CreateFeesOutput =
        await this.feesService.createOrUpdateTokenFeesAsIssuer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          feesParam.tokenId,
          feesBody.assetClass,
          feesBody.investorId,
          feesBody.fees,
          feesBody.elementInstances,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating or updating token fees',
        'createOrUpdateTokenFees',
        true,
        500,
      );
    }
  }

  @Get('/:tokenId/fees')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveTokenFees(
    @UserContext() userContext: IUserContext,
    @Param() feesParam: RetrieveFeesParamInput,
    @Query() feesQuery: RetrieveFeesQueryInput,
  ): Promise<RetrieveFeesOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: RetrieveFeesOutput =
        await this.feesService.retrieveTokenFees(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          feesParam.tokenId,
          feesQuery.assetClass,
          feesQuery.investorId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieve token fees',
        'retrieveTokenFees',
        true,
        500,
      );
    }
  }
}
