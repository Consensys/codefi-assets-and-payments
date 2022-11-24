import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Delete,
  Put,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';

import { ApiTags, ApiOperation, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IdentityDto } from 'src/model/dto/IdentityDto';
import { UseCaseDto, UserCaseRequestDto } from 'src/model/dto/UseCaseDto';
import { UseCaseService } from '../services/UseCaseService';

class UseCaseQueryDto extends IdentityDto {
  @ApiProperty({
    required: false,
  })
  usecase: string;
}

@ApiTags('Usecases')
@Controller('usecases')
export class UseCaseController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly usecaseService: UseCaseService,
  ) {
    logger.setContext(UseCaseController.name);
  }

  @Get('')
  @ApiOperation({
    summary: 'Get all usescases by Tenant id',
  })
  async find(@Query() requestQuery: UserCaseRequestDto) {
    return this.usecaseService.getConfigs(
      requestQuery.tenantId,
      requestQuery.usecase,
    );
  }

  @Delete('')
  @ApiOperation({
    summary: 'Delete a new usecase',
  })
  @ApiBody({
    type: UseCaseDto,
  })
  async delete(@Query() query: UseCaseQueryDto) {
    return this.usecaseService.delete(query.usecase, query.tenantId);
  }

  @Post('')
  @ApiOperation({
    summary: 'Create a usecase',
  })
  @ApiBody({
    type: UseCaseDto,
  })
  async create(
    @Query() query: UseCaseQueryDto,
    @Body() createUseCaseDtoD: UseCaseDto,
  ) {
    return this.usecaseService.createConfig(createUseCaseDtoD, query.tenantId);
  }

  @Put('')
  @ApiOperation({
    summary: 'Update a usecase',
  })
  @ApiBody({
    type: UseCaseDto,
  })
  async update(
    @Query() query: UseCaseQueryDto,
    @Body() updateUseCaseDtoD: UseCaseDto,
  ) {
    return this.usecaseService.updateConfig(updateUseCaseDtoD, query.tenantId);
  }
}
