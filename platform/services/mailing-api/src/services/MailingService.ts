import { HttpException, Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { Email } from 'node-mailjet'
import { MailjetService } from './MailjetService'

@Injectable()
export class MailingService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private mailjetService: MailjetService,
  ) {
    logger.setContext(MailingService.name)
  }

  async send(
    templateId: number,
    toName: string,
    toEmail: string,
    fromName: string,
    fromEmail: string,
    subject: string,
    variables: Record<string, string>,
    options: Record<string, any>,
    sandboxMode: boolean,
  ): Promise<Email.PostResponse> {
    try {
      return this.mailjetService.send(
        templateId,
        toName,
        toEmail,
        fromName,
        fromEmail,
        subject,
        variables,
        options,
        sandboxMode,
      )
    } catch (error) {
      this.logger.error(error)
      throw new HttpException(
        {
          message: error.message,
          status: error.statusCode || 500,
        },
        error.statusCode || 500,
      )
    }
  }
}
