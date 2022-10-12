import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { TransitionInstancesService } from '../services/TransitionInstancesService'
import { TransitionInstanceDto } from '../models/dto/TransitionInstanceDto'
import { TransitionInstance } from '../models/TransitionInstanceEntity'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { transitionInstanceSchema } from '../validation/transitionInstanceSchema'
import { identitySchema } from '../validation/identitySchema'
import { IdentityDto } from '../models/dto/IdentityDto'

@ApiTags('transition/instances')
@Controller('transition/instances')
export class TransitionInstancesController {
  constructor(
    private transitionInstancesService: TransitionInstancesService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(TransitionInstancesController.name)
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: TransitionInstanceDto })
  async create(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(transitionInstanceSchema))
    transition: TransitionInstanceDto,
  ): Promise<any> {
    const createdTemplate = await this.transitionInstancesService.create(
      identityQuery.tenantId,
      transition,
    )
    this.logger.info('Transition instance successfully created', {
      name: createdTemplate.name,
      id: createdTemplate.id,
    })
    return createdTemplate
  }

  @Get()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'id', required: false })
  @ApiQuery({ name: 'field', required: false })
  @ApiQuery({ name: 'value', required: false })
  async find(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('id') id: number,
    @Query('field') field: string,
    @Query('value') value: string,
  ): Promise<TransitionInstance[]> {
    return await this.transitionInstancesService.find(
      identityQuery.tenantId,
      id,
      field,
      value,
    )
  }

  @Put(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: TransitionInstanceDto })
  async update(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
    @Body(new JoiValidationPipe(transitionInstanceSchema))
    template: TransitionInstanceDto,
  ): Promise<any> {
    this.logger.info('Transition template updated', { id })
    return await this.transitionInstancesService.update(
      identityQuery.tenantId,
      id,
      template,
    )
  }

  @Delete(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  async delete(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return await this.transitionInstancesService.delete(
      identityQuery.tenantId,
      id,
    )
  }
}
