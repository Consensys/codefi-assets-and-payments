import { Controller, Get, Query, HttpCode, UseFilters } from '@nestjs/common';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import ErrorService from 'src/utils/errorService';
import { UserType } from 'src/types/user';
import { AumService } from './aum.service';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { MAX_TOKENS_COUNT } from '../v2Token/token.dto';
import { ListAumsQueryInput, ListAumsOutput } from './aum.dto';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/essentials/digital/asset/aum')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class AumController {
  constructor(private readonly aumService: AumService) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async retrieveSlicedTotalAum(
    @UserContext() userContext: IUserContext,
    @Query() aumQuery: ListAumsQueryInput,
  ): Promise<ListAumsOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const offset = Number(aumQuery.offset || 0);
      const limit: number = Math.min(
        Number(aumQuery.limit || MAX_TOKENS_COUNT),
        MAX_TOKENS_COUNT,
      );

      const slicedTotalAum = await this.aumService.retrieveSlicedTotalAum(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.CALLER_ID],
        offset,
        limit,
      );

      const response = {
        aum: slicedTotalAum.aum,
        count: slicedTotalAum.count,
        total: slicedTotalAum.total,
        message: `${slicedTotalAum.total} token(s) with Aum listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieve sum of Aum for sliced tokens',
        'retrieveSlicedTotalAum',
        true,
        500,
      );
    }
  }
}
