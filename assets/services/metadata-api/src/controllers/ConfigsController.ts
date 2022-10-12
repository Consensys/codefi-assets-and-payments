import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ConfigsService } from 'src/services/ConfigsService';
import { ConfigsDto } from 'src/model/dto/ConfigsDto';
import { IdentityDto } from 'src/model/dto/IdentityDto';

@ApiTags('CONFIGS')
@Controller('configs')
export class ConfigsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly configsService: ConfigsService,
  ) {
    logger.setContext(ConfigsController.name);
  }

  @Post('')
  @ApiOperation({
    summary: 'Create config',
  })
  @ApiBody({
    type: ConfigsDto,
  })
  async create(
    @Query() identityQuery: IdentityDto,
    @Body() createDto: ConfigsDto,
  ) {
    this.logger.info(createDto);

    return this.configsService.create(
      identityQuery.tenantId,
      identityQuery.userId,
      createDto,
    );
  }

  @Get('')
  @ApiOperation({
    summary: 'Find config by tenantId (userId optional)',
  })
  async find(@Query() identityQuery: IdentityDto) {
    return this.configsService.find(
      identityQuery.tenantId,
      identityQuery.userId,
    );
  }

  @Put('')
  @ApiOperation({
    summary:
      'Update config by tenantId (can also create custom config for user if userId passed)',
  })
  @ApiBody({
    type: ConfigsDto,
  })
  async update(
    @Query() identityQuery: IdentityDto,
    @Body() updateDto: ConfigsDto,
  ) {
    return this.configsService.update(
      identityQuery.tenantId,
      identityQuery.userId,
      updateDto,
    );
  }

  @Delete('')
  @ApiOperation({
    summary: 'Delete config by tenantId (userId optional)',
  })
  async delete(@Query() identityQuery: IdentityDto) {
    return this.configsService.delete(
      identityQuery.tenantId,
      identityQuery.userId,
    );
  }
}
