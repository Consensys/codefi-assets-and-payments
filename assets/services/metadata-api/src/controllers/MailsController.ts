import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
} from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { MailsService } from 'src/services/MailsService';
import {
  MailDto,
  BulkMailDto,
  MailBuildDto,
  FindMailsQuery,
  UpdateDeleteMailQuery,
} from 'src/model/dto/MailDto';
import { Mail } from 'src/model/MailEntity';

@ApiTags('MAILS')
@Controller('mails')
@UseInterceptors(ClassSerializerInterceptor)
export class MailsController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly mailsService: MailsService,
  ) {
    logger.setContext(MailsController.name);
  }

  @Post('')
  @ApiOperation({
    summary: 'Create mail',
  })
  @ApiBody({
    type: MailDto,
  })
  async create(@Body() createDto: MailDto) {
    this.logger.info(createDto);

    return this.mailsService.create(createDto, false, false);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Create/Update multiple mails',
  })
  @ApiBody({
    type: MailDto,
    isArray: true,
  })
  @HttpCode(200)
  async upsertMultipleMails(
    @Body() { items: mails }: BulkMailDto,
  ): Promise<Mail[]> {
    this.logger.info(mails);
    return Promise.all(
      mails.map((mail) => this.mailsService.create(mail, false, true)),
    );
  }

  @Post('build')
  @ApiOperation({
    summary: 'Build mail body elements',
  })
  @ApiBody({
    type: MailBuildDto,
  })
  async buildMail(@Body() dto: MailBuildDto) {
    this.logger.info(dto);

    return this.mailsService.build(dto);
  }

  @Get('')
  @ApiOperation({
    summary: 'Find mails by tenantId (key optional)',
  })
  async find(@Query() query: FindMailsQuery) {
    return this.mailsService.find(query.tenantId, query.key);
  }

  @Put('')
  @ApiOperation({
    summary: 'Update mail',
  })
  @ApiBody({
    type: MailDto,
  })
  async update(@Body() updateDto: MailDto) {
    return this.mailsService.update(updateDto);
  }

  @Delete('')
  @ApiOperation({
    summary: 'Delete mail by tenantId and key',
  })
  async delete(@Query() query: UpdateDeleteMailQuery) {
    return this.mailsService.delete(query.tenantId, query.key);
  }
}
