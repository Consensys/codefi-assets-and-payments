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
import { AssetTemplatesService } from 'src/services/AssetTemplatesService';
import {
  AssetTemplatesDto,
  FetchAssetTemplatesQuery,
} from 'src/model/dto/AssetTemplatesDto';
import { ApiFile } from 'src/utils/common';
import { Request, Response } from 'express';
import { IdentityDto } from 'src/model/dto/IdentityDto';
import { uploadedFile } from '../utils/uploadedFile';

@ApiTags('TEMPLATES')
@Controller('assetTemplates')
export class AssetTemplatesController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly assetTemplatesService: AssetTemplatesService,
  ) {
    logger.setContext(AssetTemplatesController.name);
  }

  @Post('')
  @ApiOperation({
    summary: 'Create asset template',
  })
  @ApiBody({
    type: AssetTemplatesDto,
  })
  async create(
    @Query() identityQuery: IdentityDto,
    @Body() createDto: AssetTemplatesDto,
  ) {
    this.logger.info(createDto);
    return this.assetTemplatesService.create(
      {
        ...createDto,
        tenantId: identityQuery.tenantId,
      },
      true,
    );
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiFile()
  @ApiOperation({
    summary: 'Upload template json file',
  })
  async uploadFile(
    @Query() identityQuery: IdentityDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Workaround replace for @UseInterceptors(FileInterceptor('file'))
    // otherwise APM module stops to instrument the calls
    const [file] = await uploadedFile({ file: 'file', request, response });
    let template;
    try {
      template = JSON.parse(file.buffer.toString()) as AssetTemplatesDto;
    } catch (e) {
      this.logger.error(`failed to parse ${e.message}`);
      return response.status(500).send('Failed to parse the file');
    }

    await this.assetTemplatesService.upsertTemplate(
      identityQuery.tenantId,
      template,
    );

    // https://docs.nestjs.com/controllers
    // Note that when you inject either @Res() or @Response() in a method handler,
    // you put Nest into Library-specific mode for that handler, and you
    // become responsible for managing the response.
    // When doing so, you must issue some kind of response by making a call
    // on the response object (e.g., res.json(...) or res.send(...)),
    // or the HTTP server will hang.

    return response.send('File uploaded successfully');
  }

  @Get('')
  @ApiOperation({
    summary: 'Find asset template by id or name',
  })
  async find(
    @Query() identityQuery: IdentityDto,
    @Query() query: FetchAssetTemplatesQuery,
  ) {
    return this.assetTemplatesService.find({
      ...query,
      tenantId: identityQuery.tenantId,
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update asset template by id',
  })
  @ApiBody({
    type: AssetTemplatesDto,
  })
  async update(
    @Query() identityQuery: IdentityDto,
    @Param('id') id: string,
    @Body() updateDto: AssetTemplatesDto,
  ) {
    return this.assetTemplatesService.update(id, {
      ...updateDto,
      tenantId: identityQuery.tenantId,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete asset template by id',
  })
  async delete(@Query() identityQuery: IdentityDto, @Param('id') id: string) {
    return this.assetTemplatesService.delete(identityQuery.tenantId, id);
  }
}
