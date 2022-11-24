import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

import { AssetCycleInstancesService } from 'src/services/AssetCycleInstancesService';
import {
  AssetCycleInstanceDto,
  FetchAssetCycleInstanceQuery,
} from 'src/model/dto/AssetCycleInstancesDto';
import { IdentityDto } from 'src/model/dto/IdentityDto';

@ApiTags('CYCLES')
@Controller('cycles')
export class AssetCycleInstancesController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly cycleService: AssetCycleInstancesService,
  ) {
    logger.setContext(AssetCycleInstancesController.name);
  }

  @Post()
  @ApiOperation({
    summary: 'Create assetCycleInstance',
  })
  @ApiBody({
    type: AssetCycleInstanceDto,
  })
  async create(
    @Query() identityQuery: IdentityDto,
    @Body() createCycleDto: AssetCycleInstanceDto,
  ) {
    this.logger.info({
      ...createCycleDto,
    });
    return this.cycleService.create({
      ...createCycleDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Find project by id or defaultDeployment, name & symbol',
  })
  async find(
    @Query() identityQuery: IdentityDto,
    @Query() query: FetchAssetCycleInstanceQuery,
  ) {
    return this.cycleService.find({
      ...query,
      tenantId: identityQuery.tenantId,
    });
  }

  @Put(':cycleId')
  @ApiOperation({
    summary: 'Update cycle by id',
  })
  @ApiBody({
    type: AssetCycleInstanceDto,
  })
  async update(
    @Query() identityQuery: IdentityDto,
    @Param('cycleId') cycleId: string,
    @Body() updateCycleDto: AssetCycleInstanceDto,
  ) {
    return this.cycleService.update(cycleId, {
      ...updateCycleDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Delete(':cycleId')
  @ApiOperation({
    summary: 'Delete assetCycleInstance by id',
  })
  async delete(
    @Query() identityQuery: IdentityDto,
    @Param('cycleId') cycleId: string,
  ) {
    return this.cycleService.delete(identityQuery.tenantId, cycleId);
  }
}
