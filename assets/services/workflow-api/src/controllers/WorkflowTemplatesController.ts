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
import { ApiTags, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@consensys/observability'

import { WorkflowTemplateDto } from '../models/dto/WorkflowTemplateDto'
import { WorkflowTemplate } from '../models/WorkflowTemplateEntity'
import { WorkflowTemplatesService } from '../services/WorkflowTemplatesService'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { workflowTemplateSchema } from '../validation/workflowTemplateSchema'
import { IdentityDto } from '../models/dto/IdentityDto'
import { identitySchema } from '../validation/identitySchema'

@ApiTags('workflow/templates')
@Controller('workflow/templates')
export class WorkflowTemplatesController {
  constructor(
    private workflowTemplatesService: WorkflowTemplatesService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(WorkflowTemplatesController.name)
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: WorkflowTemplateDto })
  async create(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(workflowTemplateSchema))
    template: WorkflowTemplateDto,
  ): Promise<any> {
    const createdTemplate = await this.workflowTemplatesService.create(
      identityQuery.tenantId,
      template,
      true,
    )
    this.logger.info('Workflow template successfully created', {
      tenantId: identityQuery.tenantId,
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
  ): Promise<WorkflowTemplate[]> {
    return await this.workflowTemplatesService.find(
      identityQuery.tenantId,
      id,
      field,
      value,
    )
  }

  @Put(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: WorkflowTemplateDto })
  async update(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
    @Body(new JoiValidationPipe(workflowTemplateSchema))
    template: WorkflowTemplateDto,
  ): Promise<any> {
    this.logger.info('Workflow template updated', {
      tenantId: identityQuery.tenantId,
      id,
    })
    return await this.workflowTemplatesService.update(
      identityQuery.tenantId,
      id,
      template,
      true,
    )
  }

  @Delete(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  async delete(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return await this.workflowTemplatesService.delete(
      identityQuery.tenantId,
      id,
    )
  }

  @Get('nextState')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'workflowName', required: true })
  @ApiQuery({ name: 'transitionName', required: true })
  @ApiQuery({ name: 'fromState', required: false })
  @ApiQuery({ name: 'fromStates', required: false })
  @ApiQuery({ name: 'role', required: true })
  async nextState(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('workflowName') workflowName: string,
    @Query('transitionName') transitionName: string,
    @Query('fromState') fromState: string,
    @Query('fromStates') fromStates: string,
    @Query('role') role: string,
  ): Promise<string | string[]> {
    const fromStatesList: string[] =
      fromStates &&
      JSON.parse(fromStates) &&
      Array.isArray(JSON.parse(fromStates))
        ? JSON.parse(fromStates)
        : undefined

    return fromStatesList
      ? await this.workflowTemplatesService.nextStateBatch(
          identityQuery.tenantId,
          workflowName,
          transitionName,
          fromStatesList,
          role,
        )
      : await this.workflowTemplatesService.nextState(
          identityQuery.tenantId,
          workflowName,
          transitionName,
          fromState,
          role,
        )
  }
}
