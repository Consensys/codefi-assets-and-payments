import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseFilters,
  UsePipes,
} from '@nestjs/common'
import { Protected } from '@codefi-assets-and-payments/auth'
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { sendSchema } from '../validation/sendSchema'
import { SendRequest } from '../requests/SendRequest'
import { MailingService } from '../services/MailingService'
import { Email } from 'node-mailjet'

@ApiTags('Mailing')
@UseFilters(new AppToHttpFilter())
@Controller('')
export class MailingController {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private mailingService: MailingService,
  ) {
    logger.setContext(MailingController.name)
  }

  @Post(`send`)
  @Protected(true)
  @ApiBearerAuth()
  @HttpCode(200)
  @UsePipes(new JoiValidationPipe(sendSchema))
  async send(@Body() request: SendRequest): Promise<Email.PostResponse> {
    this.logger.info({
      ...request,
    })

    return this.mailingService.send(
      request.templateId,
      request.toName,
      request.toEmail,
      request.fromName,
      request.fromEmail,
      request.subject,
      request.variables,
      request.options,
      request.sandboxMode,
    )
  }
}
