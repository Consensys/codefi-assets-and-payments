import { HttpException, Injectable } from '@nestjs/common'
import { connect, Email } from 'node-mailjet'
import { NestJSPinoLogger } from '@consensys/observability'
import config from '../config'

@Injectable()
export class MailjetService {
  private client: Email.Client

  constructor(private readonly logger: NestJSPinoLogger) {
    logger.setContext(MailjetService.name)
    const mailjetConfig = config().mailjet
    this.client = connect(mailjetConfig.apiKey, mailjetConfig.apiSecret)
  }

  async send(
    templateId = 2958777,
    toName: string,
    toEmail: string,
    fromName = 'Codefi',
    fromEmail = config().mailjet.fromAddress,
    subject: string,
    variables: Record<string, string | any[]>,
    options: Record<string, any> = {},
    sandboxMode = false,
  ): Promise<Email.PostResponse> {
    try {
      return this.client
        .post('send', {
          version: 'v3.1',
        })
        .request({
          Messages: [
            {
              To: [
                {
                  Email: toEmail,
                  Name: toName,
                },
              ],
              From: {
                Email: fromEmail,
                Name: fromName,
              },
              TemplateID: templateId,
              Variables: variables || {},
              Subject: subject,
              TemplateLanguage: true,
              ...options,
            },
          ],
          SandboxMode: sandboxMode,
        })
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
