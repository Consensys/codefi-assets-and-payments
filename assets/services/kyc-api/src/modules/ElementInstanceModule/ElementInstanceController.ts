import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JoiValidationPipe } from 'src/validation/JoiValidationPipe';
import { elementInstanceSchema } from './elementInstanceSchema';
import { elementInstancesSchema } from './elementInstancesSchema';
import { ElementInstanceRequest } from './ElementInstanceRequest';
import { RequestElementInstance } from './RequestElementInstance';
import { ElementInstanceService } from './ElementInstanceService';
import { ElementInstanceModel } from './ElementInstanceModel';
import { UserElementInstance } from './UserElementInstance';
import { IdentityDto } from '../identity.dto';
import { identitySchema } from '../identitySchema';
import { ElementInstance } from './ElementInstance';

@Controller('elementInstances')
@ApiTags('elementInstances')
export class ElementInstanceController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly elementInstanceService: ElementInstanceService,
  ) {
    logger.setContext(ElementInstanceController.name);
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: [ElementInstanceRequest] })
  async create(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(elementInstancesSchema, 'POST'))
    elementInstanceRequest: ElementInstanceRequest,
  ): Promise<Array<[ElementInstance, boolean]>> {
    this.logger.info(elementInstanceRequest.elementInstances);
    const createdInstances = await this.elementInstanceService.create(
      identityQuery.tenantId,
      elementInstanceRequest.elementInstances,
      elementInstanceRequest.userInfo,
    );
    return createdInstances;
  }

  @Get()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'elementId', required: false })
  @ApiQuery({ name: 'elementKey', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('elementId') elementInstanceId: string = null,
    @Query('elementKey') elementKey: string = null,
    @Query('userId') userId: string = null,
  ): Promise<ElementInstanceModel[]> {
    this.logger.info({
      elementInstanceId,
      elementKey,
      userId,
    });
    return this.elementInstanceService.find(
      identityQuery.tenantId,
      elementInstanceId,
      elementKey,
      userId,
    );
  }

  @Get('/admin')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'templateId', required: true })
  @ApiQuery({ name: 'atLeastValidated', required: false })
  retrieveForAdmin(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('templateId') templateId: string,
    @Query('userId') userId: string,
    @Query('atLeastValidated') atLeastValidated: string,
  ): Promise<{ [key: string]: UserElementInstance }> {
    this.logger.info({
      templateId,
      userId,
      atLeastValidated,
    });
    return this.elementInstanceService.retrieveKycForUser(
      identityQuery.tenantId,
      undefined, // entityId
      undefined, // entityClass
      templateId,
      userId,
      true,
      atLeastValidated === 'true',
    );
  }

  @Get('/issuer')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'entityId', required: true })
  @ApiQuery({ name: 'templateId', required: true })
  @ApiQuery({ name: 'atLeastValidated', required: false })
  retrieveForIssuer(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('entityId') entityId: string,
    @Query('entityClass') entityClass: string,
    @Query('templateId') templateId: string,
    @Query('userId') userId: string,
    @Query('atLeastValidated') atLeastValidated: string,
  ): Promise<{ [key: string]: UserElementInstance }> {
    this.logger.info({
      entityId,
      templateId,
      userId,
      atLeastValidated,
    });
    return this.elementInstanceService.retrieveKycForUser(
      identityQuery.tenantId,
      entityId,
      entityClass,
      templateId,
      userId,
      true,
      atLeastValidated === 'true',
    );
  }

  @Get('/investor')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'templateId', required: true })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'atLeastSubmitted', required: false })
  retrieveForInvestor(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('entityId') entityId: string,
    @Query('entityClass') entityClass: string,
    @Query('templateId') templateId: string,
    @Query('userId') userId: string,
    @Query('atLeastSubmitted') atLeastSubmitted: string,
  ): Promise<{ [key: string]: UserElementInstance }> {
    this.logger.info({
      entityId,
      templateId,
      userId,
      atLeastSubmitted,
    });
    return this.elementInstanceService.retrieveKycForUser(
      identityQuery.tenantId,
      entityId,
      entityClass,
      templateId,
      userId,
      atLeastSubmitted === 'true',
      false,
    );
  }

  @Put(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  update(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id') id: string,
    @Body(new JoiValidationPipe(elementInstanceSchema, 'PUT'))
    instanceRequest: RequestElementInstance,
  ): Promise<RequestElementInstance> {
    return this.elementInstanceService.update(
      identityQuery.tenantId,
      id,
      instanceRequest,
    );
  }

  @Delete(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  delete(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.elementInstanceService.remove(identityQuery.tenantId, id);
  }
}
