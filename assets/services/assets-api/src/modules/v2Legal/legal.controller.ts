import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  HttpCode,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import { LegalService } from './legal.service';

import { Request, Response } from 'express';
import { uploadedFile } from 'src/utils/uploadedFile';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/legal')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Post('templates')
  @HttpCode(201)
  @Protected(true, [])
  async createTemplate(
    @UserContext() userContext: IUserContext,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // Workaround replace for @UseInterceptors(FileInterceptor('file'))
    // otherwise APM module stops to instrument the calls
    const [file, { templateName }] = await uploadedFile<{
      templateName: string;
    }>({
      file: 'file',
      request,
      response,
    });

    const template = await this.legalService.createTemplate(
      userContext[UserContextKeys.USER],
      templateName,
      file,
    );

    // https://docs.nestjs.com/controllers
    // Note that when you inject either @Res() or @Response() in a method handler,
    // you put Nest into Library-specific mode for that handler, and you
    // become responsible for managing the response.
    // When doing so, you must issue some kind of response by making a call
    // on the response object (e.g., res.json(...) or res.send(...)),
    // or the HTTP server will hang.
    return response.json(template);
  }

  @Post('envelopes')
  @HttpCode(200)
  @Protected(true, [])
  async createEnvelope(
    @UserContext() userContext: IUserContext,
    @Body('docusignId') docusignId: string,
    @Body('envelopeArgs') envelopeArgs: object,
  ) {
    return this.legalService.createEnvelope(
      userContext[UserContextKeys.USER],
      docusignId,
      envelopeArgs,
    );
  }

  @Post('envelopes/:envelopeId/url')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveUrl(
    @UserContext() userContext: IUserContext,
    @Param('envelopeId') envelopeId: string,
    @Body('docusignId') docusignId: string,
    @Body('returnUrl') returnUrl,
  ) {
    return this.legalService.generateUrl(
      userContext[UserContextKeys.USER],
      envelopeId,
      docusignId,
      returnUrl,
      userContext[UserContextKeys.USER_ID],
      userContext[UserContextKeys.CALLER_ID],
    );
  }

  @Get('envelopes/:envelopeId/status')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveEnvelopeStatusById(
    @UserContext() userContext: IUserContext,
    @Query('docusignId') docusignId: string,
    @Param('envelopeId') envelopeId: string,
  ) {
    return this.legalService.retrieveEnvelopeStatusById(
      userContext[UserContextKeys.USER],
      envelopeId,
      docusignId,
      userContext[UserContextKeys.USER_ID],
      userContext[UserContextKeys.CALLER_ID],
    );
  }

  @Get('envelopes/:envelopeId/pdf')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveEnvelopePdfById(
    @UserContext() userContext: IUserContext,
    @Query('docusignId') docusignId: string,
    @Param('envelopeId') envelopeId: string,
  ) {
    return this.legalService.retrieveEnvelopePdfById(
      userContext[UserContextKeys.USER],
      envelopeId,
      docusignId,
    );
  }
}
