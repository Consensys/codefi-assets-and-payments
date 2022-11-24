import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Put,
  Delete,
  Query,
  Req,
  Res,
} from '@nestjs/common';

import { NestJSPinoLogger } from '@consensys/observability';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';

import { AssetElementsService } from 'src/services/AssetElementsService';
import {
  AssetElementsDto,
  FetchAssetElementQuery,
} from 'src/model/dto/AssetElementsDto';
import { ApiFile } from 'src/utils/common';
import { IdentityDto } from 'src/model/dto/IdentityDto';
import { Request, Response } from 'express';
import { uploadedFile } from '../utils/uploadedFile';

@ApiTags('ELEMENTS')
@Controller('assetElements')
export class AssetElementsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly assetElementsService: AssetElementsService,
  ) {
    logger.setContext(AssetElementsController.name);
  }

  @Post('')
  @ApiOperation({
    summary: 'Create elements',
  })
  @ApiBody({
    type: AssetElementsDto,
  })
  async create(
    @Query() identityQuery: IdentityDto,
    @Body() createDto: AssetElementsDto,
  ) {
    this.logger.info(createDto);
    return this.assetElementsService.create({
      ...createDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiFile()
  @ApiOperation({
    summary: 'Upload elements json file',
  })
  async uploadFile(
    @Query() identityQuery: IdentityDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Workaround replace for @UseInterceptors(FileInterceptor('file'))
    // otherwise APM module stops to instrument the calls
    const [file] = await uploadedFile({ file: 'file', request, response });
    let elements;

    try {
      elements = JSON.parse(file.buffer.toString()) as Array<AssetElementsDto>;
    } catch (e) {
      this.logger.error(`failed to parse ${e.message}`);
      return response.status(500).send('Failed to parse the file');
    }

    const createdElements = this.assetElementsService.upsertElements(
      identityQuery.tenantId,
      elements,
      true,
    );

    // https://docs.nestjs.com/controllers
    // Note that when you inject either @Res() or @Response() in a method handler,
    // you put Nest into Library-specific mode for that handler, and you
    // become responsible for managing the response.
    // When doing so, you must issue some kind of response by making a call
    // on the response object (e.g., res.json(...) or res.send(...)),
    // or the HTTP server will hang.
    return response.json(createdElements);
  }

  @Get('')
  @ApiOperation({
    summary: 'Fetch element by id or key',
  })
  async find(
    @Query() identityQuery: IdentityDto,
    @Query() query: FetchAssetElementQuery,
  ) {
    return this.assetElementsService.find({
      ...query,
      tenantId: identityQuery.tenantId,
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update element by id',
  })
  @ApiBody({
    type: AssetElementsDto,
  })
  async update(
    @Query() identityQuery: IdentityDto,
    @Param('id') id: string,
    @Body() updateDto: AssetElementsDto,
  ) {
    return this.assetElementsService.update(id, {
      ...updateDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete element by id',
  })
  async delete(@Query() identityQuery: IdentityDto, @Param('id') id: string) {
    return this.assetElementsService.delete(identityQuery.tenantId, id);
  }
}
