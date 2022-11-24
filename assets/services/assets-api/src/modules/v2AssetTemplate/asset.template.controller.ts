import {
  Controller,
  Get,
  HttpCode,
  Param,
  Delete,
  Query,
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

import { UserType } from 'src/types/user';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { RawAssetTemplate } from 'src/types/asset/template';
import {
  ListAllAssetTemplatesOutput,
  RetrieveAssetTemplateParamInput,
  RetrieveAssetTemplateOutput,
} from './asset.template.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

export class ListAllTemplatesQueryInput {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value: it }) => it === 'true')
  withDefaultTemplates: boolean;
}

@Controller('v2/essentials/asset/template')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class AssetTemplateController {
  constructor(
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllAssetTemplates(
    @Query() { withDefaultTemplates = true }: ListAllTemplatesQueryInput,
    @UserContext() userContext: IUserContext,
  ): Promise<ListAllAssetTemplatesOutput> {
    try {
      const expectedUserType = UserType.INVESTOR; // To accommodate Project Carbon where Investor creates asset

      checkUserType(expectedUserType, userContext[UserContextKeys.USER]);

      let assetTemplates: Array<RawAssetTemplate> =
        await this.apiMetadataCallService.fetchAssetTemplates(
          userContext[UserContextKeys.TENANT_ID],
        );

      if (!withDefaultTemplates) {
        assetTemplates = assetTemplates.filter(
          (template) =>
            template.tenantId === userContext[UserContextKeys.TENANT_ID],
        );
      }

      return {
        templates: assetTemplates,
        message: `${assetTemplates.length} asset template(s) listed successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'fetch fund templates',
        'fundTemplates',
        true,
        500,
      );
    }
  }

  @Get(':assetTemplateId')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveAssetTemplate(
    @UserContext() userContext: IUserContext,
    @Param()
    assetTemplateParam: RetrieveAssetTemplateParamInput,
  ): Promise<RetrieveAssetTemplateOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const assetTemplate: RawAssetTemplate =
        await this.apiMetadataCallService.fetchAssetTemplate(
          userContext[UserContextKeys.TENANT_ID],
          assetTemplateParam.assetTemplateId,
        );

      return {
        template: assetTemplate,
        message: `Asset template ${assetTemplateParam.assetTemplateId} retrieved successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieve asset template',
        'retrieveAssetTemplate',
        true,
        500,
      );
    }
  }

  @Delete(':assetTemplateId')
  @HttpCode(200)
  @Protected(true, [])
  async deleteAssetTemplateById(
    @UserContext() userContext: IUserContext,
    @Param()
    assetTemplateParam: RetrieveAssetTemplateParamInput,
  ): Promise<{ message: string }> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const { message } = await this.apiMetadataCallService.deleteAssetTemplate(
        userContext[UserContextKeys.TENANT_ID],
        assetTemplateParam.assetTemplateId,
      );

      return {
        message,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'delete asset template by id',
        'deleteAssetTemplateById',
        true,
        500,
      );
    }
  }
}
