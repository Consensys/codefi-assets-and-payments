import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Put,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

import { TokensService } from 'src/services/TokensService';
import { TokenDto, FetchTokenQuery } from 'src/model/dto/TokensDto';
import { IdentityDto } from 'src/model/dto/IdentityDto';

@ApiTags('Tokens')
@Controller('tokens')
@UseInterceptors(ClassSerializerInterceptor)
export class TokensController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tokensService: TokensService,
  ) {
    logger.setContext(TokensController.name);
  }

  @Post()
  @ApiOperation({
    summary: 'Create token',
  })
  @ApiBody({
    type: TokenDto,
  })
  async create(
    @Query() identityQuery: IdentityDto,
    @Body() createTokenDto: TokenDto,
  ) {
    this.logger.info({
      ...createTokenDto,
    });
    return this.tokensService.create({
      ...createTokenDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Get()
  @ApiOperation({
    summary:
      'Find token by id or defaultDeployment, name & symbol, or find tokens by IDs',
  })
  async find(
    @Query() identityQuery: IdentityDto,
    @Query() query: FetchTokenQuery,
  ) {
    if (
      query.tokenIds &&
      JSON.parse(query.tokenIds) &&
      Array.isArray(JSON.parse(query.tokenIds))
    ) {
      return this.tokensService.findBatch({
        tenantId: identityQuery.tenantId,
        tokenIds: JSON.parse(query.tokenIds),
        withAssetData: query.withAssetData,
      });
    } else {
      return this.tokensService.find({
        ...query,
        offset: query.offset !== undefined ? Number(query.offset) : undefined,
        limit: query.limit !== undefined ? Number(query.limit) : undefined,
        tenantId: identityQuery.tenantId,
      });
    }
  }

  @Get('/search')
  @ApiOperation({
    summary: 'Search tokens by name',
  })
  async search(
    @Query() identityQuery: IdentityDto,
    @Query() query: FetchTokenQuery,
  ) {
    return this.tokensService.search({
      ...query,
      offset: query.offset !== undefined ? Number(query.offset) : undefined,
      limit: query.limit !== undefined ? Number(query.limit) : undefined,
      tenantId: identityQuery.tenantId,
    });
  }

  @Put(':tokenId')
  @ApiOperation({
    summary: 'Update token by id',
  })
  @ApiBody({
    type: TokenDto,
  })
  async update(
    @Query() identityQuery: IdentityDto,
    @Param('tokenId') tokenId: string,
    @Body() updateTokenDto: TokenDto,
  ) {
    return this.tokensService.update(tokenId, {
      ...updateTokenDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Delete(':tokenId')
  @ApiOperation({
    summary: 'Delete token by id',
  })
  async delete(
    @Query() identityQuery: IdentityDto,
    @Param('tokenId') tokenId: string,
  ) {
    return this.tokensService.delete(identityQuery.tenantId, tokenId);
  }
}
