import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Body,
  UseFilters,
} from '@nestjs/common';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

/**
 * USERS
 *
 * 5 kind of users can be distinguished:
 *  - SUPERADMINS (ConsenSys)
 *  - ADMINS (not available yet)
 *  - ISSUERS
 *  - NOTARIES
 *  - INVESTORS
 *  - VEHICLES
 */

import {
  RetrieveAssetDataQueryInput,
  SaveAssetDataBodyInput,
  RetrieveAssetDataOutput,
  SaveAssetDataOutput,
} from './asset.data.dto';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { AssetDataService } from './asset.data.service';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';
import { AssetElementInstance } from 'src/types/asset/elementInstance';

@Controller('v2/essentials/asset/data')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class AssetDataController {
  constructor(private readonly assetDataService: AssetDataService) {}

  @Post()
  @HttpCode(201)
  @Protected(true, [])
  async saveAssetData(
    @UserContext() userContext: IUserContext,
    @Body() assetInstancesDto: SaveAssetDataBodyInput,
  ): Promise<SaveAssetDataOutput> {
    try {
      const assetDataResponse: {
        id: string;
        tenantId: string;
        tokenId: string;
        templateId: string;
        issuerId: string;
        elementInstances: Array<AssetElementInstance>;
      } = await this.assetDataService.saveAssetData(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        assetInstancesDto.templateId,
        assetInstancesDto.tokenId,
        assetInstancesDto.elementInstances,
        assetInstancesDto.data,
      );
      return {
        assetData: assetDataResponse.elementInstances,
        message: `Asset data saved successfully (${assetDataResponse.elementInstances.length} elements saved)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'saving asset data',
        'saveAssetData',
        true,
        500,
      );
    }
  }

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async retrieveAssetData(
    @UserContext() userContext: IUserContext,
    @Query() assetDataQuery: RetrieveAssetDataQueryInput,
  ): Promise<RetrieveAssetDataOutput> {
    try {
      const assetData = await this.assetDataService.retrieveSavedAssetData(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        assetDataQuery.templateId,
        assetDataQuery.tokenId,
      );

      return {
        assetData: assetData,
        message: `Asset data retrieved successfully for token ${assetDataQuery.tokenId} and asset template ${assetDataQuery.templateId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset data',
        'retrieveAssetData',
        true,
        500,
      );
    }
  }
}
