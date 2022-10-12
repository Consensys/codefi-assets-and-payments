import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  Query,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AssetInstancesService } from 'src/services/AssetInstancesService';
import {
  AssetInstancesDto,
  FetchAssetInstancesQuery,
  FetchAssetTemplateDataQuery,
  CheckAssetDataCompletionQuery,
  CheckAssetDataValidityDto,
} from 'src/model/dto/AssetInstancesDto';
import { IdentityDto } from 'src/model/dto/IdentityDto';

@ApiTags('INSTANCES')
@Controller('assetInstances')
@UseInterceptors(ClassSerializerInterceptor)
export class AssetInstancesController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly assetInstancesService: AssetInstancesService,
  ) {
    logger.setContext(AssetInstancesController.name);
  }

  @Post('')
  @ApiOperation({
    summary: 'Create asset elements instances',
  })
  @ApiBody({
    type: AssetInstancesDto,
  })
  async create(
    @Query() identityQuery: IdentityDto,
    @Body() createDto: AssetInstancesDto,
  ) {
    this.logger.info(createDto);
    return this.assetInstancesService.create({
      ...createDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Get('')
  @ApiOperation({
    summary:
      'Find asset elements instances by id or templateId, tokenId & issuerId',
  })
  async find(
    @Query() identityQuery: IdentityDto,
    @Query() query: FetchAssetInstancesQuery,
  ) {
    return this.assetInstancesService.find({
      ...query,
      tenantId: identityQuery.tenantId,
    });
  }

  @Get('data')
  @ApiOperation({
    summary:
      'Find asset template with instances by templateId, tokenId & issuerId',
  })
  async findAssetTemplateData(
    @Query() identityQuery: IdentityDto,
    @Query()
    query: FetchAssetTemplateDataQuery,
  ) {
    if (
      query.tokenIds &&
      JSON.parse(query.tokenIds) &&
      Array.isArray(JSON.parse(query.tokenIds)) &&
      query.templateIds &&
      JSON.parse(query.templateIds) &&
      Array.isArray(JSON.parse(query.templateIds)) &&
      query.issuerIds &&
      JSON.parse(query.issuerIds) &&
      Array.isArray(JSON.parse(query.issuerIds))
    ) {
      return this.assetInstancesService.findAssetTemplateDataBatch({
        tenantId: identityQuery.tenantId,
        tokenIds: JSON.parse(query.tokenIds),
        templateIds: JSON.parse(query.templateIds),
        issuerIds: JSON.parse(query.issuerIds),
      });
    } else {
      return this.assetInstancesService.findAssetTemplateData({
        ...query,
        tenantId: identityQuery.tenantId,
      });
    }
  }

  @Get('completion/check')
  @ApiOperation({
    summary: 'Check asset data completion by templateId, tokenId & issuerId',
  })
  async checkAssetDataCompletion(
    @Query() identityQuery: IdentityDto,
    @Query()
    query: CheckAssetDataCompletionQuery,
  ) {
    return this.assetInstancesService.checkAssetDataCompletion({
      tenantId: identityQuery.tenantId,
      tokenId: query.tokenId,
      templateId: query.templateId,
      issuerId: query.issuerId,
    });
  }

  @Post('validity/check')
  @ApiOperation({
    summary: 'Check asset data validity',
  })
  @ApiBody({
    type: CheckAssetDataValidityDto,
  })
  async checkAssetDataValidity(
    @Query() identityQuery: IdentityDto,
    @Body() checkDto: CheckAssetDataValidityDto,
  ) {
    this.logger.info(checkDto);
    return this.assetInstancesService.checkAssetDataValidity({
      ...checkDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete asset elements instances by id',
  })
  async delete(@Query() identityQuery: IdentityDto, @Param('id') id: string) {
    return this.assetInstancesService.delete(identityQuery.tenantId, id);
  }
}
