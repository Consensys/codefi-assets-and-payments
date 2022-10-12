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
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JoiValidationPipe } from 'src/validation/JoiValidationPipe';
import { elementsSchema } from './elementsSchema';
import { ElementRequest } from './ElementRequest';
import { ElementService } from './ElementService';
import { ElementModel } from './ElementModel';
import { IdentityDto } from '../identity.dto';
import { identitySchema } from '../identitySchema';
import { elementSchema } from './elementSchema';

@Controller('elements')
@ApiTags('elements')
export class ElementController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly elementService: ElementService,
  ) {
    logger.setContext(ElementController.name);
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: [ElementRequest] })
  create(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(elementsSchema, 'POST'))
    elements: ElementRequest[],
  ): Promise<Array<[ElementModel, boolean]>> {
    this.logger.info(elements);
    return this.elementService.create(identityQuery.tenantId, elements);
  }

  @Get()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'elementId', required: false })
  @ApiQuery({ name: 'key', required: false })
  async findAll(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('elementId') elementId: string = null,
    @Query('key') key: string = null,
  ): Promise<ElementModel[]> {
    this.logger.info({
      tenantId: identityQuery.tenantId,
      elementId,
      key,
    });
    return this.elementService.find(identityQuery.tenantId, elementId, key);
  }

  @Put(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  update(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id') id: string,
    @Body(new JoiValidationPipe(elementSchema, 'PUT'))
    elementRequest: ElementRequest,
  ): Promise<ElementRequest> {
    return this.elementService.update(
      identityQuery.tenantId,
      id,
      elementRequest,
    );
  }

  @Delete(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  delete(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.elementService.remove(identityQuery.tenantId, id);
  }
}
