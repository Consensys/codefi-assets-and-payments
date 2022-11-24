import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import {
  RetrieveCycleParamInput,
  RetrieveCycleOutput,
  ListAllCyclesOutput,
  ListAllCyclesQueryInput,
  MAX_CYCLES_COUNT,
  RetrieveCycleQueryInput,
} from './cycle.dto';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

/**
 * CYCLES
 *
 * Those endpoints are only there for debug purposes
 */

import { CycleEnum } from 'src/old/constants/enum';

import { UserType } from 'src/types/user';
import { ApiMetadataCallService } from '../v2ApiCall/api.call.service/metadata';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { AssetCycleInstance } from 'src/types/asset/cycle';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/essentials/cycle')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class CycleController {
  constructor(
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllCycles(
    @UserContext() userContext: IUserContext,
    @Query() cycleQuery: ListAllCyclesQueryInput,
  ): Promise<ListAllCyclesOutput> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const offset = Number(cycleQuery.offset || 0);
      const limit: number = Math.min(
        Number(cycleQuery.limit || MAX_CYCLES_COUNT),
        MAX_CYCLES_COUNT,
      );

      const cycles: Array<AssetCycleInstance> =
        await this.apiMetadataCallService.retrieveCycle(
          cycleQuery.tenantId,
          CycleEnum.assetId,
          cycleQuery.tokenId,
          undefined,
          undefined,
          false,
        );

      const slicedCyclesList: Array<AssetCycleInstance> = cycles.slice(
        offset,
        Math.min(offset + limit, cycles.length),
      );

      const response: ListAllCyclesOutput = {
        cycles: slicedCyclesList,
        count: slicedCyclesList.length,
        total: cycles.length,
        message: `${slicedCyclesList.length} cycle(s) listed successfully, filtered for token ${cycleQuery.tokenId}`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing cycles',
        'listAllCycles',
        true,
        500,
      );
    }
  }

  @Get(':cycleId')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveCycle(
    @UserContext() userContext: IUserContext,
    @Param() cycleParam: RetrieveCycleParamInput,
    @Query() cycleQuery: RetrieveCycleQueryInput,
  ): Promise<RetrieveCycleOutput> {
    try {
      checkUserType(UserType.SUPERADMIN, userContext[UserContextKeys.USER]);

      const cycle: AssetCycleInstance =
        await this.apiMetadataCallService.retrieveCycle(
          cycleQuery.tenantId,
          CycleEnum.cycleId,
          cycleParam.cycleId,
          undefined,
          undefined,
          true,
        );

      const response: RetrieveCycleOutput = {
        cycle,
        message: `Cycle with ID ${cycleParam.cycleId} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving cycle',
        'retrieveCycle',
        true,
        500,
      );
    }
  }
}
