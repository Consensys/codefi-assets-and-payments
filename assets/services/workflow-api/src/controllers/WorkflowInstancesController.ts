import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common'
import { ApiTags, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { WorkflowInstanceDto } from '../models/dto/WorkflowInstanceDto'
import { WorkflowInstance } from '../models/WorkflowInstanceEntity'
import { WorkflowInstancesService } from '../services/WorkflowInstancesService'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { workflowInstanceSchema } from '../validation/workflowInstanceSchema'
import { TransitionInstance } from '../models/TransitionInstanceEntity'
import { identitySchema } from '../validation/identitySchema'
import { IdentityDto } from '../models/dto/IdentityDto'
import { OrderSide } from '../constants/enums'
import { WorkflowType } from '../models/WorkflowType'

@ApiTags('workflow/instances')
@Controller('workflow/instances')
export class WorkflowInstancesController {
  constructor(
    private workflowInstancesService: WorkflowInstancesService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(WorkflowInstancesController.name)
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: WorkflowInstanceDto })
  async create(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(workflowInstanceSchema))
    instance: WorkflowInstanceDto,
  ): Promise<any> {
    // If no orderSide for Order WorkFlow instance, default it to SELL
    if (instance.workflowType === WorkflowType.ORDER && !instance.orderSide) {
      instance.orderSide = OrderSide.SELL
    }

    if (instance.workflowType !== WorkflowType.ORDER) {
      if (!instance.userId) {
        throw new Error(
          `Missing userId property in ${JSON.stringify(instance)}`,
        )
      }
    }

    const createdTemplate = await this.workflowInstancesService.create(
      identityQuery.tenantId,
      instance,
    )

    this.logger.info('Workflow instance successfully created', {
      tenantId: createdTemplate.tenantId,
      workflowTemplateId: createdTemplate.workflowTemplateId,
    })
    return createdTemplate
  }

  @Get()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'id', required: false })
  @ApiQuery({ name: 'ids', required: false })
  @ApiQuery({ name: 'field1', required: false })
  @ApiQuery({ name: 'value1', required: false })
  @ApiQuery({ name: 'field2', required: false })
  @ApiQuery({ name: 'value2', required: false })
  @ApiQuery({ name: 'field3', required: false })
  @ApiQuery({ name: 'value3', required: false })
  @ApiQuery({ name: 'multiValue3', required: false })
  @ApiQuery({ name: 'otherValue1', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async find(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('id') id: number,
    @Query('ids') ids: string,
    @Query('field1') field1: string,
    @Query('value1') value1: string,
    @Query('field2') field2: string,
    @Query('value2') value2: string,
    @Query('field3') field3: string,
    @Query('value3') value3: string,
    @Query('multiValue3') multiValue3: string,
    @Query('otherValue1') otherValue1: string,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ): Promise<[WorkflowInstance[], number]> {
    const idsList: number[] =
      ids && JSON.parse(ids) && Array.isArray(JSON.parse(ids))
        ? JSON.parse(ids)
        : undefined

    return await this.workflowInstancesService.find(
      identityQuery.tenantId,
      id,
      idsList,
      field1,
      value1,
      field2,
      value2,
      field3,
      value3,
      multiValue3,
      otherValue1,
      offset !== undefined ? Number(offset) : undefined,
      limit !== undefined ? Number(limit) : undefined,
    )
  }

  @Put(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: WorkflowInstanceDto })
  async update(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
    @Body(new JoiValidationPipe(workflowInstanceSchema))
    instance: WorkflowInstanceDto,
  ): Promise<any> {
    return await this.workflowInstancesService.update(
      identityQuery.tenantId,
      id,
      instance,
    )
  }

  @Delete(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  async delete(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return await this.workflowInstancesService.delete(
      identityQuery.tenantId,
      id,
    )
  }

  @Get('/:id/transitions')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  async listAllTransitions(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransitionInstance[]> {
    const transitions = await this.workflowInstancesService.listAllTransitions(
      identityQuery.tenantId,
      id,
    )

    this.logger.info(
      'Transition instances list retrieved for a given workflow instance.',
      {
        workflowInstanceId: id,
        length: transitions.length,
      },
    )
    return transitions
  }
}
