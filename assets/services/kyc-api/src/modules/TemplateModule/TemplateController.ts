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

import { JoiValidationPipe } from 'src/validation/JoiValidationPipe';
import { templateSchema } from './templateSchema';
import { TemplateRequest } from './TemplateRequest';
import { TemplateService } from './TemplateService';
import { TemplateModel } from './TemplateModel';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { IdentityDto } from '../identity.dto';
import { identitySchema } from '../identitySchema';

@Controller('templates')
@ApiTags('templates')
export class TemplateController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly templateService: TemplateService,
  ) {
    logger.setContext(TemplateController.name);
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  create(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(templateSchema, 'POST'))
    template: TemplateRequest,
  ): Promise<[TemplateModel, boolean]> {
    this.logger.info(template);
    return this.templateService.create(identityQuery.tenantId, template);
  }

  @Get()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'templateId', required: false })
  @ApiQuery({ name: 'issuerId', required: false })
  @ApiQuery({ name: 'name', required: false })
  async findAll(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('templateId') templateId: string = null,
    @Query('issuerId') issuerId: string = null,
    @Query('name') name: string = null,
  ): Promise<TemplateModel[]> {
    this.logger.info({
      templateId,
      issuerId,
      name,
    });
    return this.templateService.find(
      identityQuery.tenantId,
      templateId,
      issuerId,
      name,
    );
  }

  @Put(':templateId')
  @ApiQuery({ name: 'tenantId', required: true })
  update(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('templateId') templateId: string,
    @Body(new JoiValidationPipe(templateSchema, 'PUT'))
    templateRequest: TemplateRequest,
  ): Promise<TemplateRequest> {
    return this.templateService.update(
      identityQuery.tenantId,
      templateId,
      templateRequest,
    );
  }

  @Delete(':templateId')
  @ApiQuery({ name: 'tenantId', required: true })
  delete(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('templateId') templateId: string,
  ): Promise<{ message: string }> {
    return this.templateService.remove(identityQuery.tenantId, templateId);
  }
}
