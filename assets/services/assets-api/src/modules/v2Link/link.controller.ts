import {
  Controller,
  HttpCode,
  Get,
  Query,
  Param,
  UseFilters,
} from '@nestjs/common';
import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import { LinkService } from './link.service';
import {
  ListAllLinksOutput,
  ListAllLinksQueryInput,
  ListAllLinksParamInput,
  MAX_LINKS_COUNT,
} from './link.dto';
import { UserType } from 'src/types/user';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/essentials/link')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class LinkController {
  constructor(
    private readonly linkService: LinkService,
    private readonly entityService: EntityService,
  ) {}

  @Get(':userId')
  @HttpCode(200)
  @Protected(true, [])
  async listAllLinks(
    @UserContext() userContext: IUserContext,
    @Query() linkQuery: ListAllLinksQueryInput,
    @Param() linkParam: ListAllLinksParamInput,
  ): Promise<ListAllLinksOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      if (linkParam.userId !== userContext[UserContextKeys.USER_ID]) {
        // In case the user is fetching entity-links of someone else, we need to make sure,
        // he is allowed to fetch this entity's data
        await this.entityService.retrieveEntityIfAuthorized(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          'list all links',
          linkQuery.entityId,
          linkQuery.entityType,
        );
      }

      const allLinksResponse: {
        links: Array<Link>;
        total: number;
      } = await this.linkService.listAllUserLinks(
        userContext[UserContextKeys.TENANT_ID],
        linkParam.userId,
        linkQuery.userType ? linkQuery.userType : UserType.INVESTOR,
        linkQuery.entityType,
        linkQuery.entityId,
        linkQuery.assetClass,
        Number(linkQuery.offset || 0),
        Math.min(Number(linkQuery.limit || MAX_LINKS_COUNT), MAX_LINKS_COUNT),
        true, // withMetadata
      );

      const response: ListAllLinksOutput = {
        links: allLinksResponse.links,
        count: allLinksResponse.links.length,
        total: allLinksResponse.total,
        message: `${allLinksResponse.links.length} link(s) listed successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all links',
        'listAllLinks',
        true,
        500,
      );
    }
  }
}
